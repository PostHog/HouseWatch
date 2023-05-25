import { Table, ConfigProvider } from 'antd'
import React, { useEffect, useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { SavedQueryData } from './SavedQueries'


export default function SavedQuery({ id, query, name }: SavedQueryData) {
    const [error, setError] = useState('')
    const [data, setData] = useState([{}])

    const columns = data.length > 0 ? Object.keys(data[0]).map((column) => ({ title: column, dataIndex: column })) : []

    const loadData = async () => {
        try {
            setData([])
            setError('')
            const res = await fetch('http://localhost:8000/api/analyze/query', {
                method: 'POST',
                body: JSON.stringify({ sql: query }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })            
            const resJson = await res.json()
            if (resJson.error) {
                setError(resJson.error)
            } else {
                setData(resJson.result)
            }
        } catch (error) {
            setError(String(error))
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <>
            <h2 style={{ textAlign: 'left' }}>{name}</h2>
            <Editor
                value={query}
                onValueChange={() => {}}
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
                disabled
            />
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
