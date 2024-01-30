import React, { useEffect, useState } from 'react'
import { Pie } from '@ant-design/plots'
import { Card, Spin, Row, Col, notification } from 'antd'

import useSWR from 'swr'

interface NodeData {
    node: string
    space_used: number
    free_space: number
}

export function DiskUsage(): JSX.Element {
    const loadData = async (url: string) => {
        try {
            const res = await fetch(url)
            const resJson = await res.json()
            return resJson
        } catch {
            notification.error({ message: 'Failed to load data' })
        }
    }

    const { data, error, isLoading } = useSWR('/api/analyze/cluster_overview', loadData)

    const rows = []
    if (!isLoading) {
        for (let i = 0; i < data.length; i += 2) {
            rows.push(data.slice(i, i + 2))
        }
    }

    return isLoading ? (
        <div>loading...</div>
    ) : error ? (
        <div>error</div>
    ) : (
        <div style={{ textAlign: 'left' }}>
            <h1>Disk usage</h1>
            <br />
            <div style={{ display: 'block' }}>
                {data.length === 0 ? (
                    <Spin />
                ) : (
                    <>
                        {rows.map((row, i) => (
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
                                            angleField="value"
                                            colorField="type"
                                            radius={0.9}
                                            label={{
                                                type: 'inner',
                                                offset: '-30%',
                                                content: ({ percent }: { percent: number }) =>
                                                    `${(percent * 100).toFixed(0)}%`,
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
                                                display: 'block',
                                            }}
                                            color={['#FFB816', '#175FFF']}
                                            tooltip={{
                                                formatter: (v: any) => {
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
                                                angleField="value"
                                                colorField="type"
                                                radius={0.9}
                                                label={{
                                                    type: 'inner',
                                                    offset: '-30%',
                                                    content: ({ percent }: { percent: number }) =>
                                                        `${(percent * 100).toFixed(0)}%`,
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
                                                    display: 'block',
                                                }}
                                                color={['#FFB816', '#175FFF']}
                                                tooltip={{
                                                    formatter: (v: any) => {
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
