import React, { useEffect, useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { Table } from 'antd'
import { NoDataSpinner, QueryDetailData } from './QueryDetail'

export default function ExampleQueriesTab({ query_hash }: { query_hash: string }) {
    const [data, setData] = useState<{ example_queries: QueryDetailData['example_queries'] } | null>(null)

    const loadData = async () => {
        const res = await fetch(`http://localhost:8000/api/analyze/${query_hash}/query_examples`)
        const resJson = await res.json()
        setData(resJson)
    }

    useEffect(() => {
        loadData()
    }, [])

    return data ? (
        <Table
            columns={[
                {
                    title: 'Query',
                    dataIndex: 'query',
                    render: (_, item) => (
                        <Editor
                            value={item.query}
                            onValueChange={() => {}}
                            highlight={(code) => highlight(code, languages.sql)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                            }}
                            disabled
                        />
                    ),
                },
            ]}
            dataSource={data.example_queries}
        />
    ) : (
        NoDataSpinner
    )
}
