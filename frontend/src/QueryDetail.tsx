// @ts-nocheck
import * as React from 'react'
import { usePollingEffect } from './PageCacheHits'
import { Line } from '@ant-design/plots'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { Tab, Tabs } from '@mui/material'


export default function QueryDetail({ match }) {
    const [tab, setTab] = React.useState('query')
    const [queryDetail, setQueryDetail] = React.useState([])
    const [querySQL, setQuerySQL] = React.useState('')
    const [data, setData] = React.useState({})

    const defaultConfig = {
        data: queryDetail,
        padding: 'auto',
        xField: 'day_start',
        yField: 'total',
    }
    const [config, setConfig] = React.useState(defaultConfig)

    const url = `http://localhost:8000/api/analyze/${match.params.query_hash}/query_detail`

    usePollingEffect(
        async () =>
            setQueryDetail(
                await fetch(url)
                    .then((response) => {
                        return response.json()
                    })
                    .then((data) => {
                        setData(data)
                        const mappedData = data.execution_count
                        setConfig({ ...config, data: mappedData })
                        setQuerySQL(data.query)
                        return mappedData
                    })
                    .catch((err) => {
                        return []
                    })
            ),
        [],
        { interval: 5000 } // optional
    )

    console.log((data.explain || [{explain: ''}]).map(row => row.explain))
    let index = 0
    return (
        <>
            <h1>Query analyzer</h1>
            <Tabs value={tab} textColor="primary" indicatorColor="primary" onChange={(_, value) => setTab(value)}>
                <Tab value="query" label="Query" />
                <Tab value="frequency" label="Frequency" />
                <Tab value="explain" label="EXPLAIN" />
                <Tab value="Example queries" label="Example queries" />
            </Tabs>
            <br />
            {tab === 'query' ? (

                <Editor
                    value={querySQL.replace(/(\?)/g, () => {
                        index = index + 1
                        return '$' + index
                    })}
                    onValueChange={code => setSql(code)}
                    highlight={code => highlight(code, languages.sql)}
                    padding={10}
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 16,
                        border: '1px solid rgb(216, 216, 216)',
                        borderRadius: 4,
                        boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                        marginBottom: 5
                    }}
                    multiline
                    disabled
                />
            )
                : tab === 'frequency' ? (<Line {...config} />) : tab === 'explain' ?
                <Editor
                value={(data.explain || [{explain: ''}]).map(row => row.explain).join('\n')}
                onValueChange={() => {}}
                highlight={code => highlight(code, languages.yaml)}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    border: '1px solid rgb(216, 216, 216)',
                    borderRadius: 4,
                    boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                    marginBottom: 5
                }}
                multiline
                disabled
            />
                 : null
            }
            <br />

        </>
    )
}
