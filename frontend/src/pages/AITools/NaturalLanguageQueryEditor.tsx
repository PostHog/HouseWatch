import React, { useEffect, useState } from 'react'
import { Select, Checkbox, Button, Table } from 'antd'
import { useHistory } from 'react-router-dom'
import QueryEditor from '../QueryEditor/QueryEditor';
import SavedQueries from '../QueryEditor/SavedQueries';
import { WarningFilled } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';

export interface TableData {
    table: string
    database: string

}

// { match }: { match: { params: { tab: string; id: string } } }

export default function NaturalLanguageQueryEditor() {
    const history = useHistory()
    const [tables, setTables] = useState<TableData[] | null>(null)
    const [tablesToQuery, setTablesToQuery] = useState([])
    const [readonly, setReadonly] = useState(true)
    const [data, setData] = useState([{}])

    const columns = data.length > 0 ? Object.keys(data[0]).map((column) => ({ title: column, dataIndex: column })) : []

    const runQuery = async () => {
        const res = await fetch('http://localhost:8000/api/analyze/natural_language_query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // hacky af cause I'm a bit lazy to do forms rn woop
                // @ts-ignore
                query: document.getElementById('nl-query-textarea').value,
                tables_to_query: tablesToQuery,
                readonly: readonly || false

            })
        })
        const resJson = await res.json()
        setData(resJson.result)
    }
    const loadTableData = async () => {
        const res = await fetch('http://localhost:8000/api/analyze/tables')
        const resJson = await res.json()
        setTables(resJson)
    }

    useEffect(() => {
        loadTableData()
    }, [])

    const selectOptions = (tables || []).map(t => ({ value: [t.database, t.table].join(">>>>>"), label: [t.database, t.table].join(".") }))


    return (
        <>
            <div id="nl-form">
                <div>
                    <p>Select the tables you'd like to query:</p>
                    <Select
                        placeholder=""
                        optionFilterProp="children"
                        options={selectOptions}
                        style={{ width: 600 }}
                        onChange={(value) => {
                            setTablesToQuery(value)
                        }}
                        mode='multiple'
                    />
                </div>
                <br />
                <div>
                    <Checkbox checked={readonly} onChange={e => setReadonly(e.target.value)}>Read-only</Checkbox>
                </div>
                <br />
                <div>
                    <p>Describe what you'd like to query (the more specific the better):</p>
                    <TextArea id="nl-query-textarea" />
                </div>
                <br />
                <Button type="primary"
                    style={{ width: '100%', boxShadow: 'none' }} onClick={runQuery}>Run</Button>
            </div>
            <br />
            <details>
                <summary style={{ color: '#1677ff', cursor: 'pointer' }}>Show SQL</summary>

            </details>
            <br />
            <Table columns={columns} dataSource={data} scroll={{ x: 400 }} />
        </>
    )
}
