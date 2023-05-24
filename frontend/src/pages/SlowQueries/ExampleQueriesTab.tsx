import React from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { Table } from 'antd'
import { QueryDetailData } from './QueryDetail'


export default function ExampleQueriesTab({ data }: { data: QueryDetailData }) {
    return (
        <Table
            columns={[
                {
                    title: 'Query',
                    dataIndex: 'query',
                    render: (_, item) => (
                        <Editor
                            value={item.query}
                            onValueChange={() => { }}
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
    )
}
