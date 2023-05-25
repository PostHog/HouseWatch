import React, { useEffect, useState } from 'react'
import { Pie } from '@ant-design/plots'
import { Card, Spin, Row, Col } from 'antd'

interface NodeData {
    node: string
    space_used: number
    free_space: number
}


export function DiskUsage(): JSX.Element {
    const [clusterOverviewData, setClusterOverviewData] = useState<NodeData[]>([])

    const loadData = async () => {
        const res = await fetch('http://localhost:8000/api/analyze/cluster_overview')
        const resJson = await res.json()
        setClusterOverviewData(resJson)
    }

    useEffect(() => {
        loadData()
    }, [])

    const rows = []
    for (let i = 0; i < clusterOverviewData.length; i += 2) {
        rows.push(clusterOverviewData.slice(i, i + 2))
    }

    return (
        <div style={{ textAlign: 'left' }}>
            <h1>Disk usage</h1>
            <br />
            <div style={{ display: 'block' }}>
                {clusterOverviewData.length === 0 ? (
                    <Spin />
                ) : (
                    <>
                        {rows.map((row, i)=> (
                            <Row key={`disk-usage-row-${i}`} gutter={8} style={{ marginBottom: 8 }}>
                                <Col span={12}>
                                    <Card>
                                        <h2 style={{ textAlign: 'center' }}>{row[0].node}</h2>
                                        <Pie
                                            data={[
                                                {
                                                    type: 'Used disk space',
                                                    value: row[0].space_used,
                                                },
                                                {
                                                    type: 'Free disk space',
                                                    value: row[0].free_space,
                                                },
                                            ]}

                                            appendPadding={10}
                                            angleField='value'
                                            colorField='type'
                                            radius={0.9}
                                            label={{
                                                type: 'inner',
                                                offset: '-30%',
                                                content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                                                style: {
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                },
                                            }}
                                            interactions={[
                                                {
                                                    type: 'element-active',
                                                },
                                            ]}
                                            style={{
                                                display: 'block'
                                            }}
                                            color={["#FFB816", "#175FFF"]}
                                            tooltip={{
                                                formatter: (v) => {
                                                    return {
                                                        name: v.type,
                                                        value: `${(v.value / 1000000000).toFixed(2)}GB`,
                                                    }
                                                },
                                            }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    {row[1] ? (
                                        <Card>
                                            <h2 style={{ textAlign: 'center' }}>{row[1].node}</h2>
                                            <Pie
                                                data={[
                                                    {
                                                        type: 'Used disk space',
                                                        value: row[1].space_used,
                                                    },
                                                    {
                                                        type: 'Free disk space',
                                                        value: row[1].free_space,
                                                    },
                                                ]}

                                                appendPadding={10}
                                                angleField='value'
                                                colorField='type'
                                                radius={0.9}
                                                label={{
                                                    type: 'inner',
                                                    offset: '-30%',
                                                    content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                                                    style: {
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                    },
                                                }}
                                                interactions={[
                                                    {
                                                        type: 'element-active',
                                                    },
                                                ]}
                                                style={{
                                                    display: 'block'
                                                }}
                                                color={["#FFB816", "#175FFF"]}
                                                tooltip={{
                                                    formatter: (v) => {
                                                        return {
                                                            name: v.type,
                                                            value: `${(v.value / 1000000000).toFixed(2)}GB`,
                                                        }
                                                    },
                                                }}
                                            />

                                        </Card>
                                    ) : null}

                                </Col>
                            </Row>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}
