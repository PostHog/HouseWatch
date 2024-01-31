import React, { useEffect, useState } from 'react'
import { usePollingEffect } from '../../utils/usePollingEffect'
import { ColumnType } from 'antd/es/table'
import {
    Switch,
    Select,
    Table,
    Button,
    Form,
    Input,
    Checkbox,
    Modal,
    Tag,
    Col,
    Progress,
    Row,
    Tooltip,
    notification,
} from 'antd'
import DeleteOutlined from '@ant-design/icons/DeleteOutlined'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { Clusters } from '../Clusters/Clusters'
import useSWR, { mutate } from 'swr'

interface ScheduleRow {
    id: string
    created_at: string
    enabled: boolean
    last_run_time: string
    cluster: string
    schedule: string
    incremental_schedule: string
    table: string
    is_sharded: boolean
    database: string
    bucket: string
    path: string
    last_run: string
}

interface Backups {
    backups: ScheduleRow[]
}

type FieldType = {
    cluster?: string
    schedule?: string
    incremental_schedule?: string
    database?: string
    table?: string
    is_sharded?: boolean
    bucket?: string
    path?: string
    aws_access_key_id?: string
    aws_secret_access_key?: string
}

export default function ScheduledBackups() {
    const [open, setOpen] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false)

    const [form] = Form.useForm() // Hook to get form API

    const [editingRow, setEditingRow] = useState<ScheduleRow | null>(null) // <-- New state to hold the editing row data

    const handleSubmit = async () => {
        try {
            const method = editingRow ? 'PATCH' : 'POST'
            const url = editingRow ? `/api/scheduled_backups/${editingRow.id}` : '/api/scheduled_backups'
            const values = await form.validateFields()
            setConfirmLoading(true)
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })
            setOpen(false)
            setConfirmLoading(false)
            setEditingRow(null)
            mutate('/api/scheduled_backups')
            return await res.json()
        } catch (error) {
            notification.error({
                message: 'Creating backup failed',
            })
        }
    }

    const handleCancel = () => {
        console.log('Clicked cancel button')
        setOpen(false)
        form.resetFields()
        setEditingRow(null)
    }

    const showModal = (rowData: ScheduleRow | null = null) => {
        setEditingRow(rowData)
        if (rowData) {
            form.setFieldsValue(rowData)
        } else {
            form.resetFields()
        }
        setOpen(true)
    }

    const handleEdit = (rowData: ScheduleRow) => {
        showModal(rowData)
    }

    const fetchBackups = async (url: string) => {
        try {
            const res = await fetch(url)
            const resJson = await res.json()
            const backups = { backups: resJson.results }
            return backups
        } catch (err) {
            notification.error({ message: 'Failed to load data' })
        }
    }
    const fetchClusters = async (url: string) => {
        try {
            const res = await fetch(url)
            const resJson = await res.json()
            const clusters = { clusters: resJson }
            return clusters
        } catch (err) {
            notification.error({ message: 'Failed to load data' })
        }
    }

    const { data: backups, error: backupsError, isLoading: backupsIsLoading } = useSWR(
        '/api/scheduled_backups',
        fetchBackups
    )
    const { data: clusters, error: clustersError, isLoading: clustersIsLoading } = useSWR(
        '/api/clusters',
        fetchClusters
    )

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
                        mutate('/api/scheduled_backups')
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
        { title: 'Cluster', dataIndex: 'cluster' },
        { title: 'Schedule', dataIndex: 'schedule' },
        { title: 'Incremental Schedule', dataIndex: 'incremental_schedule' },
        { title: 'Last Run Time', dataIndex: 'last_run_time' },
        { title: 'Database', dataIndex: 'database' },
        { title: 'Table', dataIndex: 'table' },
        { title: 'Is Sharded', dataIndex: 'is_sharded', render: (_, sched) => (sched.is_sharded ? 'Yes' : 'No') },
        { title: 'S3 Location', dataIndex: 'bucket', render: (_, sched) => 's3://' + sched.bucket + '/' + sched.path },
        {
            title: 'Actions',
            dataIndex: 'id',
            render: (id: string, rowData: ScheduleRow) => {
                const deleteBackup = async () => {
                    try {
                        const res = await fetch(`/api/scheduled_backups/${id}`, {
                            method: 'DELETE',
                        })
                        mutate('/api/scheduled_backups')
                        return await res.text()
                    } catch (error) {
                        notification.error({
                            message: 'Failed to delete backup',
                        })
                    }
                }

                return (
                    <>
                        <EditOutlined onClick={() => handleEdit(rowData)} />
                        <DeleteOutlined onClick={() => deleteBackup()} style={{ marginLeft: '15px' }} />
                    </>
                )
            },
        },
    ]

    usePollingEffect(
        async () => {
            mutate('/api/scheduled_backups')
        },
        [],
        { interval: 5000 }
    )

    const default_form_values = {
        schedule: '0 0 * * *',
        incremental_schedule: '0 0 * * *',
        database: 'default',
        table: 'test_backup',
        bucket: 'posthog-clickhouse',
        path: 'testing/test_backup/7',
        aws_access_key_id: 'AKIAIOSFODNN7EXAMPLE',
        aws_secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    }
    return backupsIsLoading || clustersIsLoading ? (
        <div>loading...</div>
    ) : backupsError || clustersError ? (
        <div>error</div>
    ) : (
        <div>
            <h1 style={{ textAlign: 'left' }}>Scheduled Backups</h1>
            <p style={{ textAlign: 'left' }}>
                It's a bit of a hack, but if you want to backup a database just omit the table when you create the
                scheduled backup.
            </p>
            <Button onClick={() => showModal()}>Create Backup</Button>
            <Modal
                title={editingRow ? 'Edit Backup' : 'Create Backup'}
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
                    initialValues={editingRow ? editingRow : default_form_values}
                    autoComplete="on"
                >
                    <Form.Item name="id" hidden={true}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="cluster" label="Cluster">
                        <Select>
                            {clusters!.clusters.map((cluster: any) => (
                                <Select.Option value={cluster.cluster}>{cluster.cluster}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item<FieldType>
                        label="Schedule"
                        name="schedule"
                        rules={[{ required: true, message: 'Please provide a cron schedule for the backup' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="Incremental Schedule"
                        name="incremental_schedule"
                        rules={[
                            { required: true, message: 'Please provide a cron schedule for the incremental backup' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="Database"
                        name="database"
                        rules={[{ required: true, message: 'Please select a database to back up from' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="Table"
                        name="table"
                        rules={[{ required: false, message: 'Please select a table to back up' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="Is Sharded"
                        name="is_sharded"
                        initialValue="false"
                        valuePropName="checked"
                        rules={[{ required: true, message: 'Is this table sharded?' }]}
                    >
                        <Checkbox defaultChecked={false} />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="S3 Bucket"
                        name="bucket"
                        rules={[{ required: true, message: 'What S3 bucket to backup into' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="S3 Path"
                        name="path"
                        rules={[{ required: true, message: 'What is the path in the bucket to backup to' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="AWS Access Key ID"
                        name="aws_access_key_id"
                        rules={[{ required: true, message: 'AWS Access Key ID to use for access to the S3 bucket' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="AWS Secret Access Key"
                        name="aws_secret_access_key"
                        rules={[{ required: true, message: 'AWS Secret Access Key used to access S3 bucket' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
            <Table columns={columns} dataSource={backups!.backups} loading={backupsIsLoading} />
        </div>
    )
}
