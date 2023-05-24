import React from 'react'
import { Line } from '@ant-design/plots'
// @ts-ignore
import { Card, Col, Row, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { QueryDetailData } from './QueryDetail'

export default function MetricsTab({ data }: { data: QueryDetailData }) {

    return (
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
    )
}
