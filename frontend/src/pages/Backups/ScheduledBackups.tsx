import React, { useEffect, useState } from 'react'
import { usePollingEffect } from '../../utils/usePollingEffect'
import { ColumnType } from 'antd/es/table'
import { Switch, Table, Button, Form, Input, Modal, Tag, Col, Progress, Row, Tooltip, notification } from 'antd'

interface ScheduleRow {
    id: string
    created_at: string
    enabled: boolean
    last_run_time: string
    schedule: string
    table: string
    database: string
    bucket: string
    path: string
    last_run: string
}

interface Backups {
    backups: ScheduleRow[]
}

type FieldType = {
    schedule?: string
    database?: string
    table?: string
    bucket?: string
    path?: string
}

export default function ScheduledBackups() {
    const [backups, setBackups] = useState<Backups>({
        backups: [],
    })
    const [loadingBackups, setLoadingBackups] = useState(false)
    const [open, setOpen] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false)

    const [form] = Form.useForm() // Hook to get form API

    const handleSubmit = async () => {
        try {
            // Validate and get form values
            const values = await form.validateFields()
            setConfirmLoading(true)
            const res = await fetch(`/api/scheduled_backups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })
            setOpen(false)
            setConfirmLoading(false)
            loadData()
            return await res.json()
        } catch (error) {
            notification.error({
                message: 'Creating backup failed',
            })
        }
    }

    const showModal = () => {
        setOpen(true)
    }
    const handleCancel = () => {
        console.log('Clicked cancel button')
        setOpen(false)
    }

    const loadData = async () => {
        try {
            const res = await fetch('/api/scheduled_backups')
            const resJson = await res.json()
            const backups = { backups: resJson.results }
            console.log(backups)
            setBackups(backups)
        } catch (err) {
            notification.error({ message: 'Failed to load data' })
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const columns: ColumnType<ScheduleRow>[] = [
        {
            title: 'Enabled',
            dataIndex: 'enabled',
            render: (_, sched) => {
                const toggleEnabled = async () => {
                    try {
                        const res = await fetch(`/api/scheduled_backups/${sched.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ enabled: !sched.enabled }),
                        })
                        loadData()
                        return await res.json()
                    } catch (error) {
                        notification.error({
                            message: 'Failed to toggle backup',
                        })
                    }
                }
                return <Switch defaultChecked={sched.enabled} onChange={toggleEnabled} />
            },
        },
        { title: 'Enabled', dataIndex: 'enabled' },
        { title: 'Schedule', dataIndex: 'schedule' },
        { title: 'Last Run Time', dataIndex: 'last_run_time' },
        { title: 'Database', dataIndex: 'database' },
        { title: 'Table', dataIndex: 'table' },
        { title: 'Bucket', dataIndex: 'bucket' },
        { title: 'Path', dataIndex: 'path' },
        { title: 'Created At', dataIndex: 'created_at' },
    ]

    usePollingEffect(
        async () => {
            loadData()
        },
        [],
        { interval: 5000 }
    )

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Scheduled Backups</h1>
            <Button onClick={showModal}>Create Backup</Button>
            <br />
            <Modal
                title="Create Backup"
                open={open}
                onOk={handleSubmit}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                <Form
                    name="basic"
                    form={form}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}
                    autoComplete="on"
                >
                    <Form.Item<FieldType>
                        label="Schedule"
                        name="schedule"
                        initialValue="0 0 * * *"
                        rules={[{ required: true, message: 'Please provide a cron schedule for the backup' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="Database"
                        name="database"
                        initialValue="default"
                        rules={[{ required: true, message: 'Please select a database to back up from' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="Table"
                        name="table"
                        initialValue="test_backup"
                        rules={[{ required: true, message: 'Please select a table to back up' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="S3 Bucket"
                        name="bucket"
                        initialValue="posthog-clickhouse"
                        rules={[{ required: true, message: 'What S3 bucket to backup into' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="S3 Path"
                        name="path"
                        initialValue="testing/test_backup/7"
                        rules={[{ required: true, message: 'What is the path in the bucket to backup to' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
            <Row gutter={8} style={{ paddingBottom: 8 }}>
                <ul>
                    <Table columns={columns} dataSource={backups.backups} loading={loadingBackups} />
                </ul>
            </Row>
            <br />
        </div>
    )
}
