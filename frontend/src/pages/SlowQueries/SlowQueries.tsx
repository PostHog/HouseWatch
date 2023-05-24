import React, { useEffect, useState } from 'react'
import { Table, Typography } from 'antd'
import { useHistory } from 'react-router-dom'
import { ColumnType } from 'antd/es/table'
const { Paragraph } = Typography

interface SlowQueryData {
    normalized_query: string
    normalized_query_hash: string
    avg_duration: number
    calls_per_minute: number
    percentage_iops: number
    percentage_runtime: number
    read_bytes: number
    total_read_bytes: number
}

export default function CollapsibleTable() {
    const [loadingSlowQueries, setLoadingSlowQueries] = useState(false)
    const [slowQueries, setSlowQueries] = useState<SlowQueryData[]>([])

    const history = useHistory()
    const slowQueriesColumns: ColumnType<SlowQueryData>[] = [
        {
            title: 'Query',
            dataIndex: 'normalized_query',
            key: 'query',
            render: (_, item) => {
                let index = 0
                return (
                    <Paragraph
                        className="clickable"
                        style={{ maxWidth: '100%', fontFamily: 'monospace' }}
                        ellipsis={{
                            rows: 2,
                            expandable: false,
                        }}
                    >
                        {item.normalized_query.replace(/SELECT.*FROM/g, 'SELECT ... FROM').replace(/(\?)/g, () => {
                            index = index + 1
                            return '$' + index
                        })}
                    </Paragraph>
                )
            },
        },
        {
            title: 'Avg time (ms)',
            dataIndex: 'avg_duration',
            defaultSortOrder: 'descend',
            render: (_, item) => <>{item.avg_duration.toFixed(0)}ms</>,
            sorter: (a, b) => a.avg_duration - b.avg_duration,
        },
        {
            title: 'Calls / min',
            dataIndex: 'calls_per_minute',
            render: (_, item) => <>{item.calls_per_minute.toFixed(3)}</>,
            sorter: (a, b) => a.calls_per_minute - b.calls_per_minute,
        },
        { title: '% of all iops', render: (_, item) => <>{item.percentage_iops.toFixed(1)}%</> },
        {
            title: '% of runtime',
            render: (_, item) => <>{item.percentage_runtime.toFixed(1)}%</>,
            dataIndex: 'percentage_runtime',
            sorter: (a, b) => a.percentage_runtime - b.percentage_runtime,
        },
        {
            title: 'Total iops',
            dataIndex: 'total_read_bytes',
            sorter: (a, b) => a.total_read_bytes - b.total_read_bytes,
        },
    ]



    const loadData = async () => {
        setSlowQueries([])
        setLoadingSlowQueries(true)
        const res = await fetch('http://localhost:8000/api/analyze/slow_queries')
        const resJson = await res.json()

        const slowQueriesData = resJson.map((error: SlowQueryData, idx: number) => ({ key: idx, ...error }))
        setSlowQueries(slowQueriesData)
        setLoadingSlowQueries(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Query performance</h1>
            <p>Click on queries to display more details.</p>
            <br />
            <div>
                <Table
                    columns={slowQueriesColumns}
                    onRow={(query, _) => {
                        return {
                            onClick: () => {
                                history.push(`/query_performance/${query.normalized_query_hash}`)
                            },
                        }
                    }}
                    rowClassName={() => 'cursor-pointer'}
                    dataSource={slowQueries}
                    loading={loadingSlowQueries}
                    size="small"                    
                />
            </div>
        </div>
    )
}
