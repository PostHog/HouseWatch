import { Table, Button, ConfigProvider, Row, Col, Tooltip, Modal, Input, notification } from 'antd'
import React, { useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { v4 as uuidv4 } from 'uuid'
import { SaveOutlined } from '@ant-design/icons'

function CreateSavedQueryModal({
    modalOpen = false,
    setModalOpen,
    saveQuery,
}: {
    modalOpen: boolean
    setModalOpen: (open: boolean) => void
    saveQuery: (name: string) => Promise<void>
}) {
    const [queryName, setQueryName] = useState<string>('')

    return (
        <>
            <Modal
                title="Query name"
                open={modalOpen}
                onOk={() => saveQuery(queryName)}
                onCancel={() => setModalOpen(false)}
            >
                <Input value={queryName} onChange={(e) => setQueryName(e.target.value)} />
            </Modal>
        </>
    )
}

export default function QueryEditor() {
    const [sql, setSql] = useState(
        'SELECT type, query, query_duration_ms, formatReadableSize(memory_usage)\nFROM system.query_log\nWHERE type > 1 AND is_initial_query\nORDER BY event_time DESC\nLIMIT 10'
    )
    const [error, setError] = useState('')
    const [data, setData] = useState([{}])
    const [runningQueryId, setRunningQueryId] = useState<null | string>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const columns = data.length > 0 ? Object.keys(data[0]).map((column) => ({ title: column, dataIndex: column })) : []

    const saveQuery = async (queryName: string) => {
        try {
            const res = await fetch('http://localhost:8000/api/saved_queries', {
                method: 'POST',
                body: JSON.stringify({ name: queryName, query: sql }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            if (String(res.status)[0] !== '2') {
                throw new Error()
            }
            setModalOpen(false)
            notification.success({ message: 'Query saved successfully' })
        } catch (error) {
            notification.error({ message: `Couldn't save query` })
        }
    }

    const query = async (sql = '') => {
        const queryId = uuidv4()
        setRunningQueryId(queryId)
        try {
            setData([])
            setError('')
            const res = await fetch('http://localhost:8000/api/analyze/query', {
                method: 'POST',
                body: JSON.stringify({ sql, query_id: queryId }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const resJson = await res.json()
            if (resJson.error) {
                setError(resJson.error)
            } else {
                setData(resJson.result)
            }
        } catch (error) {
            setError(String(error))
        }
        setRunningQueryId(null)
    }

    const cancelRunningQuery = async () => {
        if (runningQueryId) {
            await fetch(`http://localhost:8000/api/analyze/${runningQueryId}/kill_query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    query_id: runningQueryId,
                }),
            })
            setRunningQueryId(null)
            setData([{}])
        }
    }

    return (
        <>
            <Row>
                <Col span={23}>
                    {' '}
                    <p>
                        <i>Note that HouseWatch does not add limits to queries automatically.</i>
                    </p>
                </Col>
                <Col span={1}>
                    {data && Object.keys(data[0] || {}).length > 0 ? (
                        <Tooltip title="Save query">
                            <Button style={{ background: 'transparent' }} onClick={() => setModalOpen(true)}>
                                <SaveOutlined rev={undefined} />
                            </Button>
                        </Tooltip>
                    ) : null}
                </Col>
            </Row>

            <Editor
                value={sql}
                onValueChange={(code) => setSql(code)}
                highlight={(code) => highlight(code, languages.sql)}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 16,
                    minHeight: 200,
                    border: '1px solid rgb(216, 216, 216)',
                    borderRadius: 4,
                    boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                    marginBottom: 5,
                }}
            />
            <Button
                type="primary"
                style={{ width: '100%', boxShadow: 'none' }}
                onClick={() => (runningQueryId ? cancelRunningQuery() : query(sql))}
            >
                {runningQueryId ? 'Cancel' : 'Run'}
            </Button>
            <br />
            <br />

            <ConfigProvider renderEmpty={() => <p style={{ color: '#c40000', fontFamily: 'monospace' }}>{error}</p>}>
                <Table columns={columns} dataSource={data} loading={!error && data.length < 1} scroll={{ x: 400 }} />
            </ConfigProvider>
            <CreateSavedQueryModal setModalOpen={setModalOpen} saveQuery={saveQuery} modalOpen={modalOpen} />
        </>
    )
}
