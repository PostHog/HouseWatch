import React from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { format } from 'sql-formatter-plus'
import { notification } from 'antd'
import { QueryDetailData } from './QueryDetail'


export default function NormalizedQueryTab({ data }: { data: QueryDetailData }) {


    const copyToClipboard = (value: string) => {
        notification.info({ message: 'Copied to clipboard!', placement: 'bottomRight', duration: 1.5, style: { fontSize: 10 } })
        navigator.clipboard.writeText(value)
    }

    let index = 0
    return (

        <div onClick={() => copyToClipboard(data.query)}
        >
            <Editor
                value={format(
                    data.query.replace(/(\?)/g, () => {
                        index = index + 1
                        return '$' + index
                    })
                )}
                onValueChange={() => { }}
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
                className='code-editor'
            />
        </div>

    )
}
