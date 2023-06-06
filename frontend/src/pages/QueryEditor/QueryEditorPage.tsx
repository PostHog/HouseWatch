import React from 'react'
import SavedQueries from './SavedQueries'
import QueryEditor from './QueryEditor'
import { Tabs } from 'antd'
import QueryBenchmarking from './Benchmark'
import { useHistory } from 'react-router-dom'

export default function QueryEditorPage({ match }: { match: { params: { tab: string; id: string } } }) {
    const history = useHistory()

    let defaultActiveTab = 'run'

    if (['run', 'saved_queries', 'benchmark'].includes(match.params.tab)) {
        defaultActiveTab = match.params.tab
    } else {
        history.push('/query_editor/run')
    }

    return (
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
                    {
                        key: 'benchmark',
                        label: `Query benchmarking`,
                        children: <QueryBenchmarking />,
                    },
                ]}
                defaultActiveKey={defaultActiveTab}
                onChange={(tab) => history.push(`/query_editor/${tab}`)}
            />
        </>
    )
}
