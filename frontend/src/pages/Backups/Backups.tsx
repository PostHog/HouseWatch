import React, { useEffect, useState } from 'react'
import { ColumnType } from 'antd/es/table'
import { Table, Col, Row, Tooltip, notification } from 'antd'

interface ClusterNode {
    cluster: string
    shard_num: number
    shard_weight: number
    replica_num: number
    host_name: string
    host_address: string
    port: number
    is_local: boolean
    user: string
    default_database: string
    errors_count: number
    slowdowns_count: number
    estimated_recovery_time: number
}

interface Cluster {
    cluster: string
    nodes: ClusterNode[]
}

interface Clusters {
    clusters: Cluster[]
}

export default function Backups() {
    const [clusters, setClusters] = useState<Clusters>({
        clusters: [],
    })
    const [loadingClusters, setLoadingClusters] = useState(false)

    const loadData = async () => {
        try {
            const res = await fetch('/api/clusters')
            const resJson = await res.json()
            const clusters = { clusters: resJson }
            setClusters(clusters)
        } catch (err) {
            notification.error({ message: 'Failed to load data' })
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const columns: ColumnType<ClusterNode>[] = [
        { title: 'Cluster', dataIndex: 'cluster' },
        { title: 'Shard Number', dataIndex: 'shard_num' },
        { title: 'Shard Weight', dataIndex: 'shard_weight' },
        { title: 'Replica Number', dataIndex: 'replica_num' },
        { title: 'Host Name', dataIndex: 'host_name' },
        { title: 'Host Address', dataIndex: 'host_address' },
        { title: 'Port', dataIndex: 'port' },
        { title: 'Is Local', dataIndex: 'is_local' },
        { title: 'User', dataIndex: 'user' },
        { title: 'Default Database', dataIndex: 'default_database' },
        { title: 'Errors Count', dataIndex: 'errors_count' },
        { title: 'Slowdowns Count', dataIndex: 'slowdowns_count' },
        { title: 'Recovery Time', dataIndex: 'estimated_recovery_time' },
    ]

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Clusters</h1>
            <br />
            <Row gutter={8} style={{ paddingBottom: 8 }}>
                <ul>
                    {clusters.clusters.map((cluster) => (
                        <>
                            <h1 key={cluster.cluster}>{cluster.cluster}</h1>
                            <Table columns={columns} dataSource={cluster.nodes} loading={loadingClusters} />
                        </>
                    ))}
                </ul>
            </Row>
            <br />
        </div>
    )
}
