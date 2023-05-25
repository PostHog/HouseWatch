import { Table, Button, ConfigProvider } from 'antd'
import React, { useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'


export default function QueryEditor() {
    const [sql, setSql] = useState(
        'SELECT type, query, query_duration_ms, formatReadableSize(memory_usage)\nFROM system.query_log\nWHERE type > 1 AND is_initial_query\nORDER BY event_time DESC\nLIMIT 10'
    )
    const [error, setError] = useState('')
    const [data, setData] = useState([{}])

    const columns = data.length > 0 ? Object.keys(data[0]).map((column) => ({ title: column, dataIndex: column })) : []

    const query = async (sql = '') => {
        try {
            setData([])
            const res = await fetch('http://localhost:8000/api/analyze/query', {
                method: 'POST',
                body: JSON.stringify({ sql }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const resJson = await res.json()
            if (resJson.error) {
                setError(resJson.error)
            } else {
                setData(resJson)
            }
        } catch (error) {
            setError(String(error))
        }
    }

    return (
        <>
            <h1 style={{ textAlign: 'left' }}>Query editor</h1>
            <p>
                <i>Note that HouseWatch does not add limits to queries automatically.</i>
            </p>

            <Editor
                value={sql}
                onValueChange={(code) => setSql(code)}
                highlight={(code) => highlight(code, languages.sql)}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    minHeight: 200,
                    border: '1px solid rgb(216, 216, 216)',
                    borderRadius: 4,
                    boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                    marginBottom: 5,
                }}
            />
            <Button type="primary" style={{ width: '100%', boxShadow: 'none' }} onClick={() => query(sql)}>
                Run
            </Button>
            <br />
            <br />

            <ConfigProvider renderEmpty={() => <p style={{ color: '#c40000', fontFamily: 'monospace' }}>{error}</p>}>
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={!error && data.length < 1}
                    scroll={{ x: 400 }}
                />
            </ConfigProvider>
        </>
    )
}
