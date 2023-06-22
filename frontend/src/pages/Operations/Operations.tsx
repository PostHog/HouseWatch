// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Editor from 'react-simple-code-editor'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import { Button, Input, Progress, Table, Tabs, notification } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { ColumnType } from 'antd/es/table'
import { isoTimestampToHumanReadable } from '../../utils/dateUtils'

const OPERATION_STATUS_TO_HUMAN = {
    0: 'Not started',
    1: 'Running',
    2: 'Completed successfully',
    3: 'Errored',
    4: 'Rolled back',
    5: 'Starting',
    6: 'Failed at startup',
}

const statusSortOrder = [5, 1, 0, 4, 6, 3, 2]

const OPERATION_STATUS_TO_FONT_COLOR = {
    0: 'black',
    1: 'black',
    2: 'green',
    3: 'red',
    4: 'orange',
    5: 'black',
    6: 'red',
}

interface AsyncMigrationData {
    id: number
    name: string
    description: string
    status: number
    progress: number
    started_at: string
    finished_at: string
}

export function OperationControls({
    status,
    progress,
    id,
    triggerOperation,
}: {
    status: number
    progress: number
    id: number
    triggerOperation: () => Promise<void>
}): JSX.Element {
    return (
        <div style={{ width: 100 }}>
            {[0, 4, 6].includes(status) ? (
                <Button
                    className="run-async-migration-btn"
                    style={{ color: 'white', background: '#1677ff' }}
                    onClick={() => triggerOperation(id)}
                >
                    Run
                </Button>
            ) : status === 3 ? (
                <Button danger>Rollback</Button>
            ) : (
                <Progress percent={progress} />
            )}
        </div>
    )
}

export function OperationsList(): JSX.Element {
    const [operations, setOperations] = useState([])

    const fetchAndUpdateOperationsIfNeeded = async () => {
        const response = await fetch('http://localhost:8000/api/async_migrations')
        const responseJson = await response.json()
        const results = responseJson.results
        if (JSON.stringify(results) !== JSON.stringify(operations)) {
            setOperations(results)
        }
    }

    const triggerOperation = async (id) => {
        await fetch(`http://localhost:8000/api/async_migrations/${id}/trigger`, { method: 'POST' })
        await fetchAndUpdateOperationsIfNeeded()
    }

    useEffect(() => {
        fetchAndUpdateOperationsIfNeeded()
        const intervalId = setInterval(fetchAndUpdateOperationsIfNeeded, 5000)
        return () => {
            try {
                clearInterval(intervalId)
            } catch {}
        }
    }, [])

    const columns: ColumnType<AsyncMigrationData>[] = [
        {
            title: 'Name',
            render: (_, migration) => migration.name,
        },
        {
            title: 'Description',
            render: (_, migration) => migration.description,
        },
        {
            title: 'Status',
            render: (_, migration) => (
                <span style={{ color: OPERATION_STATUS_TO_FONT_COLOR[migration.status] }}>
                    {OPERATION_STATUS_TO_HUMAN[migration.status]}
                </span>
            ),
            sorter: (a, b) => statusSortOrder.indexOf(a.status) - statusSortOrder.indexOf(b.status),
            defaultSortOrder: 'ascend',
        },
        {
            title: 'Started at',
            render: (_, migration) => migration.started_at ? isoTimestampToHumanReadable(migration.started_at) : '',
        },
        {
            title: 'Finished at',
            render: (_, migration) => migration.finished_at ? isoTimestampToHumanReadable(migration.finished_at) : '',
        },
        {
            title: '',
            render: (_, migration) => (
                <OperationControls
                    status={migration.status}
                    progress={migration.progress}
                    id={migration.id}
                    triggerOperation={triggerOperation}
                />
            ),
        },
    ]

    return <Table columns={columns} dataSource={operations} />
}

export function CreateNewOperation(): JSX.Element {
    const history = useHistory()

    const [operationOperationsCount, setOperationOperationsCount] = useState(1)

    const [code, setCode] = useState({})

    const createOperation = async () => {
        const form = document.getElementById('create-migration-form')
        const formData = new FormData(form)

        const operations: string[] = []
        const rollbackOperations: string[] = []
        const operationData = {
            name: '',
            description: '',
            operations: operations,
            rollbackOperations: rollbackOperations,
        }
        for (const [key, value] of formData.entries()) {
            if (key.includes('operation')) {
                operations.push(value)
                continue
            }
            if (key.includes('rollback')) {
                rollbackOperations.push(value)
                continue
            }
            operationData[key] = value
        }

        const res = await fetch('http://localhost:8000/api/async_migrations', {
            method: 'POST',
            body: JSON.stringify(operationData),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (String(res.status)[0] === '2') {
            history.go(0)
        } else {
            notification.error({
                message: 'Error creating operation! Check if you do not have an operation with the same name already.',
            })
        }
    }

    return (
        <div>
            <form style={{ textAlign: 'left', marginLeft: 20, overflowY: 'auto' }} id="create-migration-form">
                <h3>Details</h3>

                <Input id="create-migration-form-name" name="name" placeholder="Name" style={{ width: 400 }} />
                <br />
                <br />
                <TextArea
                    id="create-migration-form-description"
                    name="description"
                    placeholder="Description"
                    style={{ width: 800 }}
                    rows={3}
                />
                <br />
                <br />

                <h3>Operations</h3>

                {[...Array(operationOperationsCount)].map((_, i) => (
                    <span key={i}>
                        <h4>#{i + 1}</h4>

                        <Editor
                            id={`create-migration-form-operation-${i + 1}`}
                            name={`operation-${i + 1}`}
                            value={
                                code[`operation-${i + 1}`] ||
                                `CREATE TABLE test_table ( foo String ) Engine=MergeTree() ORDER BY foo`
                            }
                            onValueChange={(value) => setCode({ ...code, [`operation-${i + 1}`]: value })}
                            highlight={(code) => highlight(code, languages.sql)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 14,
                                width: 800,
                                minHeight: 200,
                                border: '1px solid #d9d9d9',
                                borderRadius: 4,
                                background: 'white',
                                boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            }}
                            rows={5}
                        />
                        <br />
                        <br />
                        <Editor
                            id={`create-migration-form-rollback-${i + 1}`}
                            name={`rollback-${i + 1}`}
                            value={code[`rollback-${i + 1}`] || `DROP TABLE IF EXISTS test_table`}
                            onValueChange={(value) => setCode({ ...code, [`rollback-${i + 1}`]: value })}
                            highlight={(code) => highlight(code, languages.sql)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 14,
                                width: 800,
                                minHeight: 200,
                                border: '1px solid #d9d9d9',
                                borderRadius: 4,
                                background: 'white',
                                boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            }}
                            rows={5}
                        />
                        <br />
                        <br />
                    </span>
                ))}
                {operationOperationsCount > 1 ? (
                    <>
                        <Button onClick={() => setOperationOperationsCount(operationOperationsCount - 1)} danger>
                            -
                        </Button>{' '}
                    </>
                ) : null}
                <Button
                    onClick={() => setOperationOperationsCount(operationOperationsCount + 1)}
                    style={{ color: 'rgb(22 166 255)', borderColor: 'rgb(22 166 255)' }}
                >
                    +
                </Button>
            </form>
            <div style={{ textAlign: 'center' }}>
                <Button style={{ color: 'white', background: '#1677ff' }} variant="contained" onClick={createOperation}>
                    Save
                </Button>
            </div>
        </div>
    )
}

export function Operations(): JSX.Element {
    return (
        <div style={{ display: 'block', margin: 'auto' }}>
            <h1 style={{ textAlign: 'left' }}>Operations (Alpha)</h1>
            <p>
                Create long-running operations to run in the background in your ClickHouse cluster. Useful for large
                data migrations, specify SQL commands to run in order with corresponding rollbacks, such that if the
                operation fails, you rollback to a safe state.
            </p>
            <p>
                <b>Please exercise caution!</b> This functionality is still in Alpha.
            </p>
            <Tabs
                items={[
                    {
                        key: 'list',
                        label: `Operations`,
                        children: <OperationsList />,
                    },
                    {
                        key: 'create',
                        label: `Create new operation`,
                        children: <CreateNewOperation />,
                    },
                ]}
                defaultActiveKey="list"
            />

            <br />
        </div>
    )
}
