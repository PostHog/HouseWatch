// @ts-nocheck
import { Table, Button, notification, Typography, Input, Card } from 'antd'
import { usePollingEffect } from './PageCacheHits'
import React, { useEffect, useState } from 'react'
import { Bar, Column } from '@ant-design/charts'
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor';

const { Paragraph } = Typography



export default function QueryEditor() {
    const [sql, setSql] = useState('SELECT type, query, query_duration_ms, formatReadableSize(memory_usage)\nFROM system.query_log\nWHERE type > 1 AND is_initial_query\nORDER BY event_time DESC\nLIMIT 10')
    const [data, setData] = useState([])


    const columns = data.length > 0 ? Object.keys(data[0]).map(column => ({ title: column, dataIndex: column })) : []
    // const columns = [
    //     { title: 'Time', dataIndex: 'event_time' },
    //     { title: 'Level', dataIndex: 'level' },
    //     { title: 'Host', dataIndex: 'hostname' },
    //     {
    //         title: 'Message',
    //         dataIndex: 'message',
    //         key: 'message',
    //         render: (_: any, item: any) => {
    //             let index = 0
    //             return (
    //                 <Paragraph
    //                     style={{ maxWidth: '100%', fontFamily: 'monospace' }}
    //                     ellipsis={{
    //                         rows: 2,
    //                         expandable: true,
    //                         title: item.query,
    //                     }}
    //                 >
    //                     {item.message}
    //                 </Paragraph>
    //             )
    //         },
    //     },
    // ]

    const url = 'http://localhost:8000/api/analyze/query'


    const query = (sql = '') => {
        fetch(url, {
            method: 'POST', body: JSON.stringify({ sql }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                return response.json()
            })
            .then((data) => {
                setData(data)
                return data
            })
            .catch((err) => {
                return []
            })
    }

    console.log(columns, data)

    // const fetchLogsFrequency = (messageIlike = '') => {
    //     fetch('http://localhost:8000/api/analyze/logs_frequency', {
    //         method: 'POST', body: JSON.stringify({ message_ilike: messageIlike }),
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //     })
    //         .then((response) => {
    //             return response.json()
    //         })
    //         .then((data) => {
    //             setLogsFrequency(data)
    //             return data
    //         })
    //         .catch((err) => {
    //             return []
    //         })
    // }

    // useEffect(() => {
    //     fetchLogs(logMessageFilter)
    //     fetchLogsFrequency(logMessageFilter)
    // },[logMessageFilter])

    return (
        <>
            <h1 style={{ textAlign: 'left' }}>Query editor</h1>
            <br />
            <Editor
                value={sql}
                onValueChange={code => setSql(code)}
                highlight={code => highlight(code, languages.sql)}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    minHeight: 200,
                    border: '1px solid rgb(216, 216, 216)',
                    borderRadius: 4,
                    boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                    marginBottom: 5
                }}
                multiline
                rows={10}
                />      
                <Button type='primary' style={{ width: '100%', boxShadow: 'none', }} onClick={() => query(sql)}>Run</Button>
                <br />

                <br />


            <Table columns={columns} dataSource={data} />
        </>
    )
}
