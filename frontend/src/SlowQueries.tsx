// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { usePollingEffect } from "./utils/usePollingEffect"
// import { DataGrid } from '@mui/x-data-grid';
import { Table, Typography } from 'antd'
import { useHistory } from 'react-router-dom'
const { Text, Paragraph } = Typography

export default function CollapsibleTable() {
    const history = useHistory()
    const slowQueriesColumns = [
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
                            title: item.normalized_query,
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
            sorter: (a, b) => a.read_bytes - b.read_bytes,
        },
    ]

    const [slowQueries, setSlowQueries] = useState(false)

    const url = 'http://localhost:8000/api/analyze/slow_queries'

    usePollingEffect(
        async () =>
            setSlowQueries(
                await fetch(url)
                    .then((response) => response.json())
                    .then((data) => data.map((d, idx) => ({ key: idx, ...d })))
            ),
        [],
        { interval: 600000 } // optional
    )

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Slow queries</h1>
            <p>Click on queries to display more details.</p>
            <br />
            <div>
                <Table
                    columns={slowQueriesColumns}
                    onRow={(query, rowIndex) => {
                        return {
                            onClick: (event) => {
                                history.push(`/slow_queries/${query.normalized_query_hash}`)
                            },
                        }
                    }}
                    rowClassName={() => 'cursor-pointer'}
                    dataSource={slowQueries}
                    loading={!slowQueries}
                    size="small"                    
                />
            </div>
        </div>
    )
}
