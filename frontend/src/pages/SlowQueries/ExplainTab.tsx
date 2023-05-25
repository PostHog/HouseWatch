import React, { useEffect, useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { NoDataSpinner, QueryDetailData, copyToClipboard } from './QueryDetail'
import { notification } from 'antd'

export default function ExplainTab({ query_hash }: { query_hash: string }) {
    const [data, setData] = useState<{ explain: QueryDetailData['explain'] } | null>(null)

    const loadData = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/analyze/${query_hash}/query_explain`)
            const resJson = await res.json()
            setData(resJson)
        } catch {
            notification.error({ message: 'Failed to load data' })
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return data ? (
        <div onClick={() => copyToClipboard((data.explain || [{ explain: '' }]).map((row) => row.explain).join('\n'))}>
            <Editor
                value={(data.explain || [{ explain: '' }]).map((row) => row.explain).join('\n')}
                onValueChange={() => {}}
                highlight={(code) => highlight(code, languages.yaml)}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    border: '1px solid rgb(216, 216, 216)',
                    borderRadius: 4,
                    boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                    marginBottom: 5,
                }}
                disabled
                className="code-editor"
            />
        </div>
    ) : (
        NoDataSpinner
    )
}
