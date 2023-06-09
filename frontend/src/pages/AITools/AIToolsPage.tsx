import React, { useEffect, useState } from 'react'
import { Tabs } from 'antd'
import { useHistory } from 'react-router-dom'
import NaturalLanguageQueryEditor from './NaturalLanguageQueryEditor'

export default function AIToolsPage() {
    const history = useHistory()
    const [error, setError] = useState<string | null>(null)

    const loadData = async () => {
        const res = await fetch('http://localhost:8000/api/analyze/ai_tools_available')
        const resJson = await res.json()
        if ('error' in resJson) {
            setError(resJson['error'])
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <>
            <h1>AI Tools (Alpha)</h1>
            {error ? (
                <p style={{ marginTop: 50 }}>{error}</p>
            ) : (
                <>
                    <Tabs
                        items={[
                            {
                                key: 'natural_language',
                                label: `Natural language query editor`,
                                children: <NaturalLanguageQueryEditor />,
                            },
                        ]}
                        defaultActiveKey="natural_language"
                        onChange={(tab) => history.push(`/query_editor/${tab}`)}
                    />
                </>
            )}
        </>
    )
}
