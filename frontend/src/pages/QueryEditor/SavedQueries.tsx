import { Table, Button, ConfigProvider, Spin, Row, Col, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { v4 as uuidv4 } from 'uuid'
import { ColumnType } from 'antd/es/table'
import QueryEditor from './QueryEditor'
import SavedQuery from './SavedQuery'
import { ReloadOutlined } from '@ant-design/icons'
import { useHistory } from 'react-router-dom'

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
        const res = await fetch('http://localhost:8000/api/saved_queries')
        const resJson = await res.json()
        setSavedQueries(resJson.results)
        if (match && match.params && match.params.id) {
            setActiveQuery(resJson.results.find((q: SavedQueryData) => q.id === Number(match.params.id)) || null)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const columns: ColumnType<{ name: string; id: number; query: string }>[] = [
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
        { title: 'Created at', dataIndex: 'created_at' },
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
                                    <ReloadOutlined rev={undefined} />
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
