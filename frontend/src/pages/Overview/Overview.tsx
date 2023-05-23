import React, { useEffect, useState } from 'react'
import { Line } from '@ant-design/charts'
import { Card, Col, Row, Tooltip, notification } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { clickhouseTips } from './tips'

interface MetricData {
    day_start: string
    total: number
}

interface QueryGraphsData {
    execution_count: MetricData[]
    memory_usage: MetricData[]
    read_bytes: MetricData[]
    cpu: MetricData[]
}

export default function Overview() {
    const [queryGraphs, setQueryGraphs] = useState<QueryGraphsData>({
        execution_count: [],
        memory_usage: [],
        read_bytes: [],
        cpu: [],
    })

    const loadData = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/analyze/query_graphs')
            const resJson = await res.json()
            const execution_count = resJson.execution_count
            const memory_usage = resJson.memory_usage
            const read_bytes = resJson.read_bytes
            const cpu = resJson.cpu
            setQueryGraphs({ execution_count, memory_usage, read_bytes, cpu })
        } catch (err) {
            notification.error({ message: 'Failed to load data' })
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const now = new Date()
    const dayOfTheYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Overview</h1>
            <Card title="💡 ClickHouse tip of the day">{clickhouseTips[dayOfTheYear % clickhouseTips.length]}</Card>
            <br />
            <Row gutter={8} style={{ paddingBottom: 8 }}>
                <Col span={12}>
                    <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }} title="Number of queries">
                        <Line
                            data={queryGraphs.execution_count.map((dataPoint) => ({
                                ...dataPoint,
                                day_start: dataPoint.day_start.split('T')[0],
                            }))}
                            xField={'day_start'}
                            yField={'total'}
                            xAxis={{ tickCount: 5 }}
                            style={{ padding: 20, height: 300 }}
                            color="#ffb200"
                            loading={queryGraphs.execution_count.length < 1}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }} title="Data read (GB)">
                        <Line
                            data={queryGraphs.read_bytes.map((dataPoint) => ({
                                day_start: dataPoint.day_start.split('T')[0],
                                total: dataPoint.total / 1000000000,
                            }))}
                            xField={'day_start'}
                            yField={'total'}
                            xAxis={{ tickCount: 5 }}
                            style={{ padding: 20, height: 300 }}
                            color="#ffb200"
                            loading={queryGraphs.read_bytes.length < 1}
                        />
                    </Card>
                </Col>
            </Row>
            <Row gutter={8}>
                <Col span={12}>
                    <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }} title="Memory usage (GB)">
                        <Line
                            data={queryGraphs.memory_usage.map((dataPoint) => ({
                                day_start: dataPoint.day_start.split('T')[0],
                                total: dataPoint.total / 1000000000,
                            }))}
                            xField={'day_start'}
                            yField={'total'}
                            style={{ padding: 20, height: 300 }}
                            color="#ffb200"
                            loading={queryGraphs.memory_usage.length < 1}

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
                                    <InfoCircleOutlined rev={undefined} />
                                </Tooltip>
                            </>
                        }
                    >
                        <Line
                            data={queryGraphs.cpu.map((dataPoint) => ({
                                day_start: dataPoint.day_start.split('T')[0],
                                total: dataPoint.total,
                            }))}
                            xField={'day_start'}
                            yField={'total'}
                            style={{ padding: 20, height: 300 }}
                            color="#ffb200"
                            loading={queryGraphs.cpu.length < 1}

                        />
                    </Card>
                </Col>
            </Row>
            <br />
        </div>
    )
}
