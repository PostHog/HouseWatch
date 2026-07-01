import { Table, Button, notification, Typography, Tooltip, Spin } from 'antd'
import { usePollingEffect } from '../../utils/usePollingEffect'
import React, { useState } from 'react'
import { ColumnType } from 'antd/es/table'
import { fetchJson } from '../../utils/api'

const { Paragraph } = Typography

interface RunningQueryData {
    query: string
    read_rows: number
    read_rows_readable: string
    query_id: string
    total_rows_approx: number
    total_rows_approx_readable: string
    elapsed: number
    memory_usage: string
}

function KillQueryButton({ queryId }: any) {
    const [isLoading, setIsLoading] = useState(false)
    const [isKilled, setIsKilled] = useState(false)

    const killQuery = async () => {
        setIsLoading(true)
        try {
            const resJson = await fetchJson(`/api/analyze/${queryId}/kill_query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    query_id: queryId,
                }),
            })
            setIsKilled(true)
            setIsLoading(false)
            return resJson
        } catch (err) {
            setIsLoading(false)
            notification.error({
                message: 'Killing query failed',
            })
        }
    }
    return (
        <>
            {isKilled ? (
                <Button disabled>Query killed</Button>
            ) : (
                <Button danger onClick={killQuery} loading={isLoading}>
                    Kill query
                </Button>
            )}
        </>
    )
}

export default function RunningQueries() {
    const [runningQueries, setRunningQueries] = useState([])
    const [loadingRunningQueries, setLoadingRunningQueries] = useState(false)

    const columns: ColumnType<RunningQueryData>[] = [
        {
            title: 'Query',
            dataIndex: 'normalized_query',
            key: 'query',
            render: (_: any, item) => {
                let index = 0
                return (
                    <Paragraph
                        style={{ maxWidth: '100%', fontFamily: 'monospace' }}
                        ellipsis={{
                            rows: 2,
                            expandable: true,
                        }}
                    >
                        {item.query.replace(/(\?)/g, () => {
                            index = index + 1
                            return '$' + index
                        })}
                    </Paragraph>
                )
            },
        },
        { title: 'User', dataIndex: 'user' },
        { title: 'Elapsed time', dataIndex: 'elapsed' },
        {
            title: 'Rows read',
            dataIndex: 'read_rows',
            render: (_: any, item) => (
                <Tooltip title={`~${item.read_rows}/${item.total_rows_approx}`}>
                    ~{item.read_rows_readable}/{item.total_rows_approx_readable}
                </Tooltip>
            ),
        },
        { title: 'Memory Usage', dataIndex: 'memory_usage' },
        {
            title: 'Actions',
            render: (_: any, item) => <KillQueryButton queryId={item.query_id} />,
        },
    ]

    usePollingEffect(
        async () => {
            setLoadingRunningQueries(true)
            try {
                const resJson = await fetchJson('/api/analyze/running_queries')
                setRunningQueries(resJson)
            } catch (err) {
                notification.error({ message: 'Failed to load running queries' })
            }
            setLoadingRunningQueries(false)
        },
        [],
        { interval: 5000 }
    )

    return (
        <>
            <h1 style={{ textAlign: 'left' }}>Running queries {loadingRunningQueries ? <Spin /> : null}</h1>
            <br />
            <Table
                columns={columns}
                dataSource={runningQueries}
                loading={runningQueries.length == 0 && loadingRunningQueries}
            />
        </>
    )
}
