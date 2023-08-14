import React, { useEffect, useState } from 'react'
import { Select, Checkbox, Button, Table, ConfigProvider } from 'antd'
import TextArea from 'antd/es/input/TextArea'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { format } from 'sql-formatter-plus'

export interface TableData {
    table: string
    database: string
}

export default function NaturalLanguageQueryEditor() {
    const [query, setQuery] = useState('')
    const [tables, setTables] = useState<TableData[] | null>(null)
    const [tablesToQuery, setTablesToQuery] = useState([])
    const [readonly, setReadonly] = useState(true)
    const [data, setData] = useState([{}])
    const [sql, setSql] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const columns = data.length > 0 ? Object.keys(data[0]).map((column) => ({ title: column, dataIndex: column })) : []

    const runQuery = async () => {
        setLoading(true)
        setSql(null)
        const res = await fetch('/api/analyze/natural_language_query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                tables_to_query: tablesToQuery,
                readonly: readonly || false,
            }),
        })
        const resJson = await res.json()
        if (resJson.error) {
            setError(resJson.error)
            setData([])
        } else {
            setData(resJson.result)
        }
        setSql(resJson.sql)
        setLoading(false)
    }
    const loadTableData = async () => {
        const res = await fetch('/api/analyze/tables')
        const resJson = await res.json()
        setTables(resJson)
    }

    useEffect(() => {
        loadTableData()
    }, [])

    const selectOptions = (tables || []).map((t) => ({
        value: [t.database, t.table].join('>>>>>'),
        label: [t.database, t.table].join('.'),
    }))

    return (
        <>
            <div id="nl-form">
                <div>
                    <p>Select the tables you'd like to query:</p>
                    <Select
                        placeholder="system.query_log"
                        optionFilterProp="children"
                        options={selectOptions}
                        style={{ width: 600 }}
                        onChange={(value) => {
                            setTablesToQuery(value)
                        }}
                        mode="multiple"
                        showSearch={false}
                    />
                </div>
                <br />
                <div>
                    <Checkbox checked={readonly} onChange={(e) => setReadonly(e.target.value)}>
                        Read-only
                    </Checkbox>
                </div>
                <br />
                <div>
                    <p>Describe what you'd like to query (the more specific the better):</p>
                    <TextArea id="nl-query-textarea" onChange={(e) => setQuery(e.target.value)} placeholder='give me the 10 slowest queries over the last hour and their memory usage in gb' />
                </div>
                <br />
                <Button
                    type="primary"
                    style={{ width: '100%', boxShadow: 'none' }}
                    onClick={runQuery}
                    disabled={loading || tablesToQuery.length < 1 || !query}
                >
                    Run
                </Button>
            </div>
            <br />
            {sql ? (
                <details>
                    <summary style={{ color: '#1677ff', cursor: 'pointer' }}>Show SQL</summary>
                    <br />
                    <Editor
                        value={format(sql)}
                        onValueChange={() => {}}
                        highlight={(code) => highlight(code, languages.sql)}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 16,
                            border: '1px solid rgb(216, 216, 216)',
                            borderRadius: 4,
                            boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            marginBottom: 5,
                        }}
                        disabled
                        className="code-editor"
                    />
                </details>
            ) : null}

            <br />
            <ConfigProvider renderEmpty={() => <p style={{ color: '#c40000', fontFamily: 'monospace' }}>{error}</p>}>
                <Table columns={columns} dataSource={data} scroll={{ x: 400 }} loading={loading} />
            </ConfigProvider>
        </>
    )
}
