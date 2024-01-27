import React, { useEffect, useState } from 'react'
import { Table, notification } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { isoTimestampToHumanReadable } from '../../utils/dateUtils'

import useSWR from 'swr'

interface ErrorData {
    name: string
    count: number
    max_last_error_time: string
}

export default function CollapsibleTable() {
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
            render: (_, item) => isoTimestampToHumanReadable(item.max_last_error_time),
        },
    ]

    const loadData = async (url: string) => {
        try {
            const res = await fetch(url)
            const resJson = await res.json()

            const slowQueriesData = resJson.map((error: ErrorData, idx: number) => ({ key: idx, ...error }))
            return slowQueriesData
        } catch {
            notification.error({ message: 'Failed to load data' })
        }
    }

    const { data, error, isLoading, mutate } = useSWR('/api/analyze/errors', loadData)

    return isLoading ? (
        <div>loading...</div>
    ) : error ? (
        <div>error</div>
    ) : (
        <div>
            <h1 style={{ textAlign: 'left' }}>Errors</h1>
            <br />
            <div>
                <Table columns={slowQueriesColumns} dataSource={data} size="small" loading={isLoading} />
            </div>
        </div>
    )
}
