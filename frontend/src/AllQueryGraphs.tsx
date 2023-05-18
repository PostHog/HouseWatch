// @ts-nocheck
import * as React from 'react'
import { usePollingEffect } from './PageCacheHits'
import { Line } from '@ant-design/charts'
import { Card, Col, Divider, Row, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { clickhouseTips } from './tips'

export default function AllQueryGraphs() {
    const [queryGraphs, setQueryGraphs] = React.useState({
        execution_count: [],
        memory_usage: [],
        read_bytes: [],
        cpu: [],
    })

    const url = `http://localhost:8000/api/analyze/query_graphs`

    usePollingEffect(
        async () =>
            setQueryGraphs(
                await fetch(url)
                    .then((response) => {
                        return response.json()
                    })
                    .then((data) => {
                        const execution_count = data.execution_count
                        const memory_usage = data.memory_usage
                        const read_bytes = data.read_bytes
                        const cpu = data.cpu
                        return { execution_count, memory_usage, read_bytes, cpu }
                    })
                    .catch((err) => {
                        return { execution_count: [], memory_usage: [], read_bytes: [], cpu: [] }
                    })
            ),
        []
    )

    const now = new Date()
    const dayOfTheYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))

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
                                    <InfoCircleOutlined />
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
                        />
                    </Card>
                </Col>
            </Row>
            <br />
        </div>
    )
}
