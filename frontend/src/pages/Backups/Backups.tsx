import React, { useEffect, useState } from 'react'
import { ColumnType } from 'antd/es/table'
import { Table, Button, Col, Row, Tooltip, notification } from 'antd'

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

export default function Backups() {
    const [backups, setBackups] = useState<Backups>({
        backups: [],
    })
    const [loadingBackups, setLoadingBackups] = useState(false)

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
        { title: 'Status', dataIndex: 'status' },
        { title: 'Error', dataIndex: 'error' },
        { title: 'Start', dataIndex: 'start_time' },
        { title: 'End', dataIndex: 'end_time' },
        { title: 'Size', dataIndex: 'total_size' },
        { title: 'Entries', dataIndex: 'num_entries' },
        { title: 'Uncompressed Size', dataIndex: 'uncompressed_size' },
        { title: 'Compressed Size', dataIndex: 'compressed_size' },
        { title: 'Files Read', dataIndex: 'files_read' },
        { title: 'Bytes Read', dataIndex: 'bytes_read' },
    ]

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Backups</h1>
            <br />
            <Button
                onClick={() => {
                    console.log('hi')
                }}
            >
                Create Backup
            </Button>
            <br />
            <Row gutter={8} style={{ paddingBottom: 8 }}>
                <ul>
                    <Table columns={columns} dataSource={backups.backups} loading={loadingBackups} />
                </ul>
            </Row>
            <br />
        </div>
    )
}
