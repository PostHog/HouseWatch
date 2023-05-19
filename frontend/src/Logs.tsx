// @ts-nocheck
import { Table, Button, notification, Typography, Input, Card, ConfigProvider, Empty } from 'antd'
import { usePollingEffect } from './PageCacheHits'
import React, { useEffect, useState } from 'react'
import { Bar, Column } from '@ant-design/charts'

const { Paragraph } = Typography

export default function Logs() {
    // very simplistic error handling where both requests set this property
    // mostly because the only error we expect is that the table doesn't exist
    const [error, setError] = useState('')
    const [logs, setLogs] = useState([])
    const [logsFrequency, setLogsFrequency] = useState([])
    const [logMessageFilter, setLogMessageFilter] = useState('')

    const columns = [
        { title: 'Time', dataIndex: 'event_time' },
        { title: 'Level', dataIndex: 'level' },
        { title: 'Host', dataIndex: 'hostname' },
        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            render: (_: any, item: any) => {
                let index = 0
                return (
                    <Paragraph
                        style={{ maxWidth: '100%', fontFamily: 'monospace' }}
                        ellipsis={{
                            rows: 2,
                            expandable: true,
                            title: item.query,
                        }}
                    >
                        {item.message}
                    </Paragraph>
                )
            },
        },
    ]

    const url = 'http://localhost:8000/api/analyze/logs'

    const fetchLogs = async (messageIlike = '') => {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ message_ilike: messageIlike }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const resJson = await res.json()
        if (resJson.error) {
            setError(resJson.error)
        } else {
            setLogs(resJson)
        }
    }

    const fetchLogsFrequency = async (messageIlike = '') => {
        const res = await fetch('http://localhost:8000/api/analyze/logs_frequency', {
            method: 'POST',
            body: JSON.stringify({ message_ilike: messageIlike }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const resJson = await res.json()
        if (resJson.error) {
            setError(resJson.error)
        } else {
            setLogsFrequency(resJson)
        }
    }

    useEffect(() => {
        fetchLogs(logMessageFilter)
        fetchLogsFrequency(logMessageFilter)
    }, [logMessageFilter])

    return (
        <>
            <h1 style={{ textAlign: 'left' }}>Logs</h1>
            <Input
                style={{ boxShadow: 'none' }}
                onChange={(e) => setLogMessageFilter(e.target.value)}
                value={logMessageFilter}
            />
            <br />
            <br />
            <Card style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)' }}>
                <Column xField="hour" yField="total" color="#ffb200" style={{ height: 150 }} data={logsFrequency} loading={!error && logs.length < 1} />
            </Card>
            <br />
            <ConfigProvider renderEmpty={
                () => <Empty description={error === 'text_log table does not exist' ?  <>Your ClickHouse instance does not have the <code>text_log</code> table. See <a href="https://clickhouse.com/docs/en/operations/system-tables/text_log" target="_blank" rel="noreferrer noopener">these docs</a> on how to configure it.</> : ''}/>}
            >
                <Table columns={columns} dataSource={logs} loading={!error && logs.length < 1} />
            </ConfigProvider>
        </>
    )
}
