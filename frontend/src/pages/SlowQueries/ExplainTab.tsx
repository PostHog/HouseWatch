import React from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core' // @ts-ignore
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { notification } from 'antd'
import { QueryDetailData } from './QueryDetail'


export default function ExplainTab({ data }: { data: QueryDetailData }) {

    const copyToClipboard = (value: string) => {
        notification.info({ message: 'Copied to clipboard!', placement: 'bottomRight', duration: 1.5, style: { fontSize: 10 }})
        navigator.clipboard.writeText(value)
    }

    return (
        <div onClick={() => copyToClipboard((data.explain || [{ explain: '' }]).map((row) => row.explain).join('\n'))}>

            <Editor
                value={(data.explain || [{ explain: '' }]).map((row) => row.explain).join('\n')}
                onValueChange={() => { }}
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
                className='code-editor'
            />
        </div>

    )
}
