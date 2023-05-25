import React, { useEffect, useState } from 'react'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'

interface ErrorData {
    name: string
    count: number
    max_last_error_time: string
}

export default function CollapsibleTable() {
    const [slowQueries, setSlowQueries] = useState([])

    const slowQueriesColumns: ColumnsType<ErrorData> = [
        {
            title: 'Error',
            dataIndex: 'name',
            render: (_, item) => (
                <p style={{}}>
                    <b>{item.name}</b>
                </p>
            ),
        },
        { title: 'Occurrences', dataIndex: 'count', render: (_, item) => <>{item.count}</> },
        {
            title: 'Most recent occurence',
            dataIndex: 'max_last_error_time',
            render: (_, item) => <>{item.max_last_error_time}</>,
        },
    ]

    const loadData = async () => {
        const res = await fetch('http://localhost:8000/api/analyze/errors')
        const resJson = await res.json()

        const slowQueriesData = resJson.map((error: ErrorData, idx: number) => ({ key: idx, ...error }))
        setSlowQueries(slowQueriesData)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Errors</h1>
            <br />
            <div>
                <Table
                    columns={slowQueriesColumns}
                    dataSource={slowQueries}
                    size="small"
                    loading={slowQueries.length < 1}
                />
            </div>
        </div>
    )
}
