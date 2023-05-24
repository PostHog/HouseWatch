import React, { useEffect, useState } from 'react'
// @ts-ignore
import {  Spin, Tabs, TabsProps, notification } from 'antd'
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

export const copyToClipboard = (value: string) => {
    notification.info({ message: 'Copied to clipboard!', placement: 'bottomRight', duration: 1.5, style: { fontSize: 10 }})
    navigator.clipboard.writeText(value)
}


export default function QueryDetail({ match }: { match: { params: { query_hash: string } } }) {
    const [data, setData] = useState<QueryDetailData | null>(null)
    const history = useHistory()


    const loadData = async () => {
        const res = await fetch(`http://localhost:8000/api/analyze/${match.params.query_hash}/query_detail`)
        const resJson = await res.json()
        setData(resJson)
    }

    useEffect(() => {
        loadData()
    }, [])

    const NoDataSpinner = (
        <div style={{ height: 500 }}>
            <Spin size='large' style={{ margin: 'auto', display: 'block', marginTop: 50 }} />
        </div>
    )

    const items: TabsProps['items'] = [
        {
            key: 'query',
            label: `Query`,
            children: data ? <NormalizedQueryTab data={data} /> : NoDataSpinner,
        },
        {
            key: 'metrics',
            label: `Metrics`,
            children: data ? <MetricsTab data={data} /> : NoDataSpinner,
        },
        {
            key: 'explain',
            label: `Explain`,
            children: data ? <ExplainTab data={data} /> : NoDataSpinner,
        },
        {
            key: 'examples',
            label: `Example queries`,
            children: data ? <ExampleQueriesTab data={data} /> : NoDataSpinner,
        },
    ]

    
    return (
        <>
            <a onClick={() => history.push(`/query_performance/`)}>← Return to queries list</a>
            <h1>Query analyzer</h1>
            <Tabs items={items} defaultActiveKey='query' />

            <br />
            <br />
        </>
    )
}
