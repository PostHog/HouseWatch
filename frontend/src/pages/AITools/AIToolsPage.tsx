import React, { useEffect, useState } from 'react'
import { Tabs } from 'antd'
import { useHistory } from 'react-router-dom'
import QueryEditor from '../QueryEditor/QueryEditor';
import SavedQueries from '../QueryEditor/SavedQueries';
import { WarningFilled } from '@ant-design/icons';

export default function AIToolsPage({ match }: { match: { params: { tab: string; id: string } } }) {
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
                    <h1 style={{ textAlign: 'left' }}>Query editor</h1>

                    <Tabs
                        items={[
                            {
                                key: 'run',
                                label: `Run query`,
                                children: <QueryEditor />,
                            },
                            {
                                key: 'saved_queries',
                                label: `Saved queries`,
                                children: <SavedQueries match={match} />,
                            },
                        ]}
                        defaultActiveKey='run'
                        onChange={(tab) => history.push(`/query_editor/${tab}`)}
                    />
                </>
            )}
        </>
    )
}
