import React, { useEffect, useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { format } from 'sql-formatter-plus'
import { NoDataSpinner, copyToClipboard } from './QueryDetail'
import { notification } from 'antd'

export default function NormalizedQueryTab({ query_hash }: { query_hash: string }) {
    const [data, setData] = useState<{ query: string } | null>(null)

    const loadData = async () => {
        try {
            const res = await fetch(`/api/analyze/${query_hash}/query_normalized`)
            const resJson = await res.json()
            setData(resJson)
        } catch {
            notification.error({ message: 'Failed to load data' })
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    let index = 0
    return data ? (
        <div onClick={() => copyToClipboard(data.query)}>
            <Editor
                value={format(
                    data.query.replace(/(\?)/g, () => {
                        index = index + 1
                        return '$' + index
                    })
                )}
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
        </div>
    ) : (
        NoDataSpinner
    )
}
