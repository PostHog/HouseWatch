import { Table, Button, Row, Col, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import { ColumnType } from 'antd/es/table'
import SavedQuery from './SavedQuery'
import ReloadOutlined from '@ant-design/icons'
import { useHistory } from 'react-router-dom'
import { isoTimestampToHumanReadable } from '../../utils/dateUtils'

export interface SavedQueryData {
    id: number
    name: string
    query: string
}

export default function SavedQueries({ match }: { match: { params: { id: string } } }) {
    const [savedQueries, setSavedQueries] = useState([])
    const [activeQuery, setActiveQuery] = useState<SavedQueryData | null>(null)
    const history = useHistory()

    const loadData = async () => {
        const res = await fetch('/api/saved_queries')
        const resJson = await res.json()
        setSavedQueries(resJson.results)
        if (match && match.params && match.params.id) {
            setActiveQuery(resJson.results.find((q: SavedQueryData) => q.id === Number(match.params.id)) || null)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const columns: ColumnType<{ name: string; id: number; query: string; created_at: string }>[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            render: (_, item) => (
                <span
                    style={{ color: '#1677ff', cursor: 'pointer' }}
                    onClick={() => {
                        setActiveQuery(item)
                        history.push(`/query_editor/saved_queries/${item.id}`)
                    }}
                >
                    {item.name}
                </span>
            ),
        },
        {
            title: 'Created at',
            render: (_, item) => (item.created_at ? isoTimestampToHumanReadable(item.created_at) : ''),
        },
    ]

    return (
        <>
            {activeQuery ? (
                <>
                    <a
                        onClick={() => {
                            setActiveQuery(null)
                            history.push(`/query_editor/saved_queries`)
                        }}
                        style={{ float: 'right' }}
                    >
                        ← Return to saved queries list
                    </a>
                    <SavedQuery {...activeQuery} />
                </>
            ) : (
                <>
                    <Row style={{ marginBottom: 2 }}>
                        <Col span={23}></Col>
                        <Col span={1}>
                            <Tooltip title="Refresh list">
                                <Button style={{ background: 'transparent' }} onClick={loadData}>
                                    <ReloadOutlined />
                                </Button>
                            </Tooltip>
                        </Col>
                    </Row>
                    <Table columns={columns} dataSource={savedQueries} />
                </>
            )}
        </>
    )
}
