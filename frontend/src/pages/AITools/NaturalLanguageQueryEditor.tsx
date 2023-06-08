import React, { useEffect, useState } from 'react'
import { Select, Tabs } from 'antd'
import { useHistory } from 'react-router-dom'
import QueryEditor from '../QueryEditor/QueryEditor';
import SavedQueries from '../QueryEditor/SavedQueries';
import { WarningFilled } from '@ant-design/icons';

export interface TableData {
    table: string
    database: string

}

// { match }: { match: { params: { tab: string; id: string } } }

export default function NaturalLanguageQueryEditor() {
    const history = useHistory()
    const [tables, setTables] = useState<TableData[] | null>(null)



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
            <Select
                placeholder="Select a table"
                optionFilterProp="children"
                options={selectOptions}
                style={{ width: 600 }}
                onChange={(value) => {
                    console.log(value)
                }}
                mode='multiple'
            />
        </>
    )
}
