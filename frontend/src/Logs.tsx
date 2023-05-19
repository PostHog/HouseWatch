// @ts-nocheck
import { Table, Button, notification, Typography, Input, Card } from 'antd'
import { usePollingEffect } from './PageCacheHits'
import React, { useEffect, useState } from 'react'
import { Bar, Column } from '@ant-design/charts'

const { Paragraph } = Typography

export default function Logs() {
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

    const fetchLogs = (messageIlike = '') => {
        fetch(url, {
            method: 'POST',
            body: JSON.stringify({ message_ilike: messageIlike }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                return response.json()
            })
            .then((data) => {
                setLogs(data)
                return data
            })
            .catch((err) => {
                return []
            })
    }

    const fetchLogsFrequency = (messageIlike = '') => {
        fetch('http://localhost:8000/api/analyze/logs_frequency', {
            method: 'POST',
            body: JSON.stringify({ message_ilike: messageIlike }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                return response.json()
            })
            .then((data) => {
                setLogsFrequency(data)
                return data
            })
            .catch((err) => {
                return []
            })
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
                <Column xField="hour" yField="total" color="#ffb200" style={{ height: 150 }} data={logsFrequency} loading={logs.length < 1} />
            </Card>
            <br />

            <Table columns={columns} dataSource={logs} loading={logs.length < 1} />
        </>
    )
}
