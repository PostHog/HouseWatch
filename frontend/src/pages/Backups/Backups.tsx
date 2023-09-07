import React, { useEffect, useState } from 'react'
import { usePollingEffect } from '../../utils/usePollingEffect'
import { ColumnType } from 'antd/es/table'
import { Table, Button, Form, Input, Modal, Tag, Col, Progress, Row, Tooltip, notification } from 'antd'

interface BackupRow {
    id: string
    name: string
    status: string
    error: string
    start_time: string
    end_time: string
    num_files: number
    total_size: number
    num_entries: number
    uncompressed_size: number
    compressed_size: number
    files_read: number
    bytes_read: number
}

interface Backups {
    backups: BackupRow[]
}

type FieldType = {
    database?: string
    table?: string
    bucket?: string
    path?: string
    aws_access_key_id?: string
    aws_secret_access_key?: string
}

export default function Backups() {
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
            const res = await fetch(`/api/backups`, {
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
            const res = await fetch('/api/backups')
            const resJson = await res.json()
            const backups = { backups: resJson }
            console.log(backups)
            setBackups(backups)
        } catch (err) {
            notification.error({ message: 'Failed to load data' })
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const columns: ColumnType<BackupRow>[] = [
        { title: 'UUID', dataIndex: 'id' },
        { title: 'Name', dataIndex: 'name' },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (_, { status }) => {
                var color = 'volcano'
                switch (status) {
                    case 'CREATING_BACKUP' || 'RESTORING':
                        color = 'black'
                        break
                    case 'BACKUP_CREATED' || 'RESTORED':
                        color = 'green'
                        break
                    case 'BACKUP_FAILED' || 'RESTORE_FAILED':
                        color = 'volcano'
                        break
                }
                return (
                    <Tag color={color} key={status}>
                        {status.toUpperCase()}
                    </Tag>
                )
            },
        },
        { title: 'Error', dataIndex: 'error' },
        { title: 'Start', dataIndex: 'start_time' },
        { title: 'End', dataIndex: 'end_time' },
        { title: 'Size', dataIndex: 'total_size' },
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
            <h1 style={{ textAlign: 'left' }}>Backups</h1>
            <Button onClick={showModal}>Create Backup</Button>
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
                    <Form.Item<FieldType>
                        label="AWS Access Key ID"
                        name="aws_access_key_id"
                        initialValue="AKIAIOSFODNN7EXAMPLE"
                        rules={[{ required: false, message: 'AWS Access Key ID to use for access to the S3 bucket' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="AWS Secret Access Key"
                        name="aws_secret_access_key"
                        initialValue="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        rules={[{ required: false, message: 'AWS Secret Access Key used to access S3 bucket' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
            <Table columns={columns} dataSource={backups.backups} loading={loadingBackups} />
        </div>
    )
}
