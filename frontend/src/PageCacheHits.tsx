// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { Gauge, Pie } from '@ant-design/plots'
import { RingProgress } from '@ant-design/plots'
import { Statistic, Card, Spin, Row, Col } from 'antd'

interface NodeData {
    node: string
    page_cache_read_ratio: number
    total_bytes_transferred: number
    readable_bytes_transferred: number
    space_used: number
    free_space: number
    total_space_available: number
    readable_total_space_available: number
    readable_space_used: number
    readable_free_space: number
}


export function usePollingEffect(
    asyncCallback: any,
    dependencies = [],
    {
        interval = 3000, // 3 seconds,
        onCleanUp = () => { },
    } = {}
) {
    const timeoutIdRef = useRef(null)
    useEffect(() => {
        let _stopped = false
            // Side note: preceding semicolon needed for IIFEs.
            ; (async function pollingCallback() {
                try {
                    await asyncCallback()
                } finally {
                    // Set timeout after it finished, unless stopped
                    timeoutIdRef.current = !_stopped && window.setTimeout(pollingCallback, interval)
                }
            })()
        // Clean up if dependencies change
        return () => {
            _stopped = true // prevent racing conditions
            clearTimeout(timeoutIdRef.current)
            onCleanUp()
        }
    }, [...dependencies, interval])
}

export function PageCacheHits(): JSX.Element {
    const [clusterOverviewData, setClusterOverviewData] = useState([])

    const url = 'http://localhost:8000/api/analyze/cluster_overview'

    usePollingEffect(
        async () => setClusterOverviewData(await fetch(url).then((response) => response.json())),
        [],
        { interval: 60000 } // optional
    )

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
                        {rows.map(row => (
                            <Row gutter={8} style={{ marginBottom: 8 }}>
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
                                                    // alias: nodeData.readable_free_space
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
                                                        // alias: nodeData.readable_free_space
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
                                                    float: 'left',
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
