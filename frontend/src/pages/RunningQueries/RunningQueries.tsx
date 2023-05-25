import { Table, Button, notification, Typography } from 'antd'
import { usePollingEffect } from '../../utils/usePollingEffect'
import React, { useState } from 'react'
import { ColumnType } from 'antd/es/table'

const { Paragraph } = Typography

interface RunningQueryData {
    query: string
    read_rows: number
    query_id: string
    total_rows_approx: number
    elapsed: number
    memory_usage: string
}

function KillQueryButton({ queryId }: any) {
    const [isLoading, setIsLoading] = useState(false)
    const [isKilled, setIsKilled] = useState(false)

    const killQuery = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`http://localhost:8000/api/analyze/${queryId}/kill_query`, {
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
            return await res.json()
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
        { title: 'Elapsed time', dataIndex: 'elapsed' },
        {
            title: 'Rows read',
            dataIndex: 'read_rows',
            render: (_: any, item) => `~${item.read_rows}/${item.total_rows_approx}`,
        },
        { title: 'Memory Usage', dataIndex: 'memory_usage' },
        {
            title: 'Actions',
            render: (_: any, item) => <KillQueryButton queryId={item.query_id} />,
        },
    ]

    usePollingEffect(
        async () => {
            setRunningQueries([])
            setLoadingRunningQueries(true)
            const res = await fetch('http://localhost:8000/api/analyze/running_queries')
            const resJson = await res.json()
            setRunningQueries(resJson)
            setLoadingRunningQueries(false)
        },
        [],
        { interval: 5000 }
    )

    return (
        <>
            <h1 style={{ textAlign: 'left' }}>Running queries</h1>
            <br />
            <Table columns={columns} dataSource={runningQueries} loading={loadingRunningQueries} />
        </>
    )
}
