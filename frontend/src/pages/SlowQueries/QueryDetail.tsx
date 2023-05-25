import React, { useEffect, useState } from 'react'
// @ts-ignore
import { Spin, Tabs, TabsProps, notification } from 'antd'
import { useHistory } from 'react-router-dom'
import NormalizedQueryTab from './NormalizedQueryTab'
import MetricsTab from './MetricsTab'
import ExplainTab from './ExplainTab'
import ExampleQueriesTab from './ExampleQueriesTab'

interface MetricData {
    day_start: string
    total: number
}

export interface QueryDetailData {
    query: string
    explain: {
        explain: string
    }[]
    example_queries: {
        query: string
    }[]
    execution_count: MetricData[]
    memory_usage: MetricData[]
    read_bytes: MetricData[]
    cpu: MetricData[]
}

export const NoDataSpinner = (
    <div style={{ height: 500 }}>
        <Spin size="large" style={{ margin: 'auto', display: 'block', marginTop: 50 }} />
    </div>
)

export const copyToClipboard = (value: string) => {
    notification.info({
        message: 'Copied to clipboard!',
        placement: 'bottomRight',
        duration: 1.5,
        style: { fontSize: 10 },
    })
    navigator.clipboard.writeText(value)
}

export default function QueryDetail({ match }: { match: { params: { query_hash: string } } }) {
    const history = useHistory()

    const items: TabsProps['items'] = [
        {
            key: 'query',
            label: `Query`,
            children: <NormalizedQueryTab query_hash={match.params.query_hash} />,
        },
        {
            key: 'metrics',
            label: `Metrics`,
            children: <MetricsTab query_hash={match.params.query_hash} />,
        },
        {
            key: 'explain',
            label: `Explain`,
            children: <ExplainTab query_hash={match.params.query_hash} />,
        },
        {
            key: 'examples',
            label: `Example queries`,
            children: <ExampleQueriesTab query_hash={match.params.query_hash} />,
        },
    ]

    return (
        <>
            <a onClick={() => history.push(`/query_performance/`)}>← Return to queries list</a>
            <h1>Query analyzer</h1>
            <Tabs items={items} defaultActiveKey="query" />

            <br />
            <br />
        </>
    )
}
