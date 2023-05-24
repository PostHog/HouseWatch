import React, { useEffect, useState } from 'react'
import { Line } from '@ant-design/plots'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { Tab, Tabs } from '@mui/material'
// @ts-ignore
import { format } from 'sql-formatter-plus'
import { Card, Col, Row, Spin, Table, Tooltip, notification } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useHistory } from 'react-router-dom'

interface MetricData {
    day_start: string
    total: number
}

interface QueryDetailData {
    query: string
    explain: {
        explain: string
    }[]
    example_queries: { 
        query: string
    }[]
    execution_count: MetricData[]
    memory_usage: MetricData[]
    read_bytes: MetricData[]
    cpu: MetricData[]
}

export default function QueryDetail({ match }: { match: { params: { query_hash: string } } }) {
    const [tab, setTab] = useState('query')
    const [querySQL, setQuerySQL] = useState('')
    const [data, setData] = useState<QueryDetailData | null>(null)
    const history = useHistory()


    const loadData = async () => {
        const res = await fetch(`http://localhost:8000/api/analyze/${match.params.query_hash}/query_detail`)
        const resJson = await res.json()
        setData(resJson)
        setQuerySQL(resJson.query)
    }

    useEffect(() => {
        loadData()
    }, [])


    const copyToClipboard = (value: string) => {
        notification.info({ message: 'Copied to clipboard!', placement: 'bottomRight', duration: 1.5, style: { fontSize: 10 }})
        navigator.clipboard.writeText(value)
    }

    let index = 0
    return (
        <>
            <a onClick={() => history.push(`/slow_queries/`)}>← Return to queries list</a>
            <h1>Query analyzer</h1>
            <Tabs value={tab} textColor="primary" indicatorColor="primary" onChange={(_, value) => setTab(value)}>
                <Tab value="query" label="Query" />
                <Tab value="metrics" label="Metrics" />
                <Tab value="explain" label="EXPLAIN" />
                <Tab value="examples" label="Example queries" />
            </Tabs>
            <br />
            {!data ? (
                <div style={{ height: 500 }}>
                    <Spin size='large' style={{ margin: 'auto', display: 'block', marginTop: 50 }} />
                </div>
            ) :
                tab === 'query' ? (
                    <div onClick={() => copyToClipboard(querySQL)}
                    >
                        <Editor
                            value={format(
                                querySQL.replace(/(\?)/g, () => {
                                    index = index + 1
                                    return '$' + index
                                })
                            )}
                            onValueChange={() => { }}
                            highlight={(code) => highlight(code, languages.sql)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 16,
                                border: '1px solid rgb(216, 216, 216)',
                                borderRadius: 4,
                                boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                                marginBottom: 5,
                            }}
                            disabled
                            className='code-editor'
                        />
                    </div>
                ) : tab === 'metrics' ? (
                    <>
                        <br />
                        <Row gutter={8} style={{ paddingBottom: 8 }}>
                            <Col span={12}>
                                <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }} title="Number of queries">
                                    <Line
                                        data={data.execution_count.map((dataPoint) => ({
                                            ...dataPoint,
                                            day_start: dataPoint.day_start.split('T')[0],
                                        }))}
                                        xField={'day_start'}
                                        yField={'total'}
                                        xAxis={{ tickCount: 5 }}
                                        style={{ padding: 20, height: 300 }}
                                        color="#ffb200"
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }} title="Data read (GB)">
                                    <Line
                                        data={data.read_bytes.map((dataPoint) => ({
                                            day_start: dataPoint.day_start.split('T')[0],
                                            total: dataPoint.total / 1000000000,
                                        }))}
                                        xField={'day_start'}
                                        yField={'total'}
                                        xAxis={{ tickCount: 5 }}
                                        style={{ padding: 20, height: 300 }}
                                        color="#ffb200"
                                    />
                                </Card>
                            </Col>
                        </Row>
                        <Row gutter={8}>
                            <Col span={12}>
                                <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }} title="Memory usage (GB)">
                                    <Line
                                        data={data.memory_usage.map((dataPoint) => ({
                                            day_start: dataPoint.day_start.split('T')[0],
                                            total: dataPoint.total / 1000000000,
                                        }))}
                                        xField={'day_start'}
                                        yField={'total'}
                                        style={{ padding: 20, height: 300 }}
                                        color="#ffb200"
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card
                                    style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }}
                                    title={
                                        <>
                                            CPU usage (seconds){' '}
                                            <Tooltip
                                                title={`Calculated from OSCPUVirtualTimeMicroseconds metric from ClickHouse query log's ProfileEvents.`}
                                            >
                                                <span>
                                                    <InfoCircleOutlined rev={undefined} />
                                                </span>
                                            </Tooltip>
                                        </>
                                    }
                                >
                                    <Line
                                        data={data.cpu.map((dataPoint) => ({
                                            day_start: dataPoint.day_start.split('T')[0],
                                            total: dataPoint.total,
                                        }))}
                                        xField={'day_start'}
                                        yField={'total'}
                                        style={{ padding: 20, height: 300 }}
                                        color="#ffb200"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </>
                ) : tab === 'explain' ? (
                    <div onClick={() => copyToClipboard((data.explain || [{ explain: '' }]).map((row) => row.explain).join('\n'))}>

                        <Editor
                            value={(data.explain || [{ explain: '' }]).map((row) => row.explain).join('\n')}
                            onValueChange={() => { }}
                            highlight={(code) => highlight(code, languages.yaml)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 12,
                                border: '1px solid rgb(216, 216, 216)',
                                borderRadius: 4,
                                boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                                marginBottom: 5,
                            }}
                            disabled
                            className='code-editor'
                        />
                    </div>
                ) : tab === 'examples' ? (
                    <Table
                        columns={[
                            {
                                title: 'Query',
                                dataIndex: 'query',
                                render: (_, item) => (
                                    <Editor
                                        value={item.query}
                                        onValueChange={() => { }}
                                        highlight={(code) => highlight(code, languages.sql)}
                                        padding={10}
                                        style={{
                                            fontFamily: '"Fira code", "Fira Mono", monospace',
                                        }}
                                        disabled
                                    />
                                ),
                            },
                        ]}
                        dataSource={data.example_queries}
                    />
                ) : null}
            <br />
        </>
    )
}
