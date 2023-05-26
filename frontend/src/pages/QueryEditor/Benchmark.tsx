// @ts-nocheck
import { Table, Button, ConfigProvider, Row, Col, Tooltip, Modal, Input, notification, Spin, Card } from 'antd'
import React, { useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { v4 as uuidv4 } from 'uuid'
import { SaveOutlined } from '@ant-design/icons'
import { Bar, Column } from '@ant-design/charts'

const DEFAULT_QUERY1 = `SELECT number FROM system.errors errors
JOIN (
    SELECT * FROM system.numbers LIMIT 1000
) numbers 
ON numbers.number = toUInt64(errors.code)
SETTINGS join_algorithm = 'default'
`

const DEFAULT_QUERY2 = `SELECT number FROM system.errors errors
JOIN (
    SELECT * FROM system.numbers LIMIT 1000
) numbers 
ON numbers.number = toUInt64(errors.code)
SETTINGS join_algorithm = 'parallel_hash'
`

export default function QueryBenchmarking() {
    const [query1, setQuery1] = useState(DEFAULT_QUERY1)
    const [query2, setQuery2] = useState(DEFAULT_QUERY2)
    const [runningBenchmark, setRunningBenchmark] = useState(false)
    const [error, setError] = useState('')
    const [data, setData] = useState([{}])


    const query = async () => {
        setRunningBenchmark(true)
        try {
            setData([])
            setError('')
            const res = await fetch('http://localhost:8000/api/analyze/benchmark', {
                method: 'POST',
                body: JSON.stringify({ query1, query2 }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const resJson = await res.json()
            if (resJson.error) {
                setError(resJson.error)
            } else {
                setData(resJson)
            }
        } catch (error) {
            setError(String(error))
        }
        setRunningBenchmark(false)
    }

    return (
        <>
            <Row gutter={4}>
                <Col span={12}>
                    <p style={{ textAlign: 'center' }}><b>Control</b></p>
                    <Editor
                        value={query1}
                        onValueChange={(code) => setQuery1(code)}
                        highlight={(code) => highlight(code, languages.sql)}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 16,
                            minHeight: 400,
                            border: '1px solid rgb(216, 216, 216)',
                            borderRadius: 4,
                            boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            marginBottom: 5,

                        }}

                    />
                </Col>
                <Col span={12}>
                    <p style={{ textAlign: 'center' }}><b>Test</b></p>
                    <Editor
                        value={query2}
                        onValueChange={(code) => setQuery2(code)}
                        highlight={(code) => highlight(code, languages.sql)}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 16,
                            minHeight: 400,
                            border: '1px solid rgb(216, 216, 216)',
                            borderRadius: 4,
                            boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            marginBottom: 5,
                        }}

                    />
                </Col>
            </Row>

            <Button
                type="primary"
                style={{ width: '100%', boxShadow: 'none' }}
                onClick={query}
                disabled={runningBenchmark}
            >
                {runningBenchmark ? <Spin /> : 'Benchmark'}
            </Button>
            <br />
            <br />
            {data && data.benchmarking_result ? (
                <>
                    <Row gutter={8} style={{ marginBottom: 4, height: 350 }}>
                        <Col span={12}>
                            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }} title="Duration (ms)">

                                <Column data={data.benchmarking_result || []} xField="query_version"
                                    yField="duration_ms" height={250} color={({ query_version }) => query_version === 'Control' ? '#6495F9' : '#F7DA46'}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }} title="Read bytes">
                                <Column data={data.benchmarking_result || []} xField="query_version"
                                    yField="read_bytes" height={250} color={({ query_version }) => query_version === 'Control' ? '#6495F9' : '#F7DA46'} />
                            </Card>
                        </Col>

                    </Row>


                    <Row gutter={8} style={{ marginBottom: 4, height: 350 }}>
                        <Col span={12}>
                            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }} title="CPU usage">

                                <Column data={data.benchmarking_result || []} xField="query_version"
                                    yField="cpu" height={250} color={({ query_version }) => query_version === 'Control' ? '#6495F9' : '#F7DA46'}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }} title="Memory usage">
                                <Column data={data.benchmarking_result || []} xField="query_version"
                                    yField="memory_usage" height={250} color={({ query_version }) => query_version === 'Control' ? '#6495F9' : '#F7DA46'}
                                />
                            </Card>
                        </Col>

                    </Row>

                    <Row gutter={8} style={{ marginBottom: 4, height: 350 }}>
                        <Col span={12}>
                            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }} title="Bytes received from network">

                                <Column data={data.benchmarking_result || []} xField="query_version"
                                    yField="network_receive_bytes" height={250} color={({ query_version }) => query_version === 'Control' ? '#6495F9' : '#F7DA46'}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }} title="Read bytes from other shards">

                                <Column data={data.benchmarking_result || []} xField="query_version"
                                    yField="read_bytes_from_other_shard" height={250} color={({ query_version }) => query_version === 'Control' ? '#6495F9' : '#F7DA46'}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            ) : null}


        </>
    )
}
