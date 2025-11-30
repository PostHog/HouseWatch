import React, { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { notification, Card, Spin, Tabs, Descriptions, Tag, Drawer, Select, Space } from 'antd'
import { Graphin, GraphinData, IUserNode, IUserEdge } from '@antv/graphin'
import {  DatabaseOutlined, CloudServerOutlined, TableOutlined, PartitionOutlined } from '@ant-design/icons'
import '@antv/graphin/dist/index.css'

const { TabPane } = Tabs

interface ClusterNode {
    cluster: string
    shard_num: number
    replica_num: number
    host_name: string
    host_address: string
    port: number
    is_local: number
    errors_count: number
    slowdowns_count: number
}

interface TableInfo {
    database: string
    table: string
    engine: string
    total_rows: number
    total_bytes: number
    total_bytes_readable: string
}

interface ReplicationStatus {
    database: string
    table: string
    replica_name: string
    total_replicas: number
    active_replicas: number
    is_leader: number
    is_readonly: number
    queue_size: number
}

interface TopologyData {
    cluster_nodes: ClusterNode[]
    tables: TableInfo[]
    replication_status: ReplicationStatus[]
    dependencies: any[]
    parts_distribution: any[]
}

interface NodeDetail {
    id: string
    type: string
    data: any
}

export default function Topology() {
    const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null)
    const [drawerVisible, setDrawerVisible] = useState(false)
    const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'cluster' | 'tables' | 'combined'>('cluster')

    const loadData = async (url: string) => {
        try {
            const res = await fetch(url)
            const resJson = await res.json()
            return resJson
        } catch (err) {
            notification.error({ message: 'Failed to load topology data' })
        }
    }

    const { data, error, isLoading } = useSWR<TopologyData>('/api/clusters/topology', loadData)

    // Get unique clusters
    const clusters = useMemo(() => {
        if (!data?.cluster_nodes) return []
        const uniqueClusters = [...new Set(data.cluster_nodes.map((n) => n.cluster))]
        return uniqueClusters
    }, [data])

    // Set default cluster
    useEffect(() => {
        if (clusters.length > 0 && !selectedCluster) {
            setSelectedCluster(clusters[0])
        }
    }, [clusters, selectedCluster])

    // Transform data to graph format
    const graphData: GraphinData = useMemo(() => {
        if (!data || !selectedCluster) return { nodes: [], edges: [] }

        const nodes: IUserNode[] = []
        const edges: IUserEdge[] = []

        if (viewMode === 'cluster' || viewMode === 'combined') {
            // Filter nodes for selected cluster
            const clusterNodes = data.cluster_nodes.filter((n) => n.cluster === selectedCluster)

            // Group by shards
            const shardGroups: { [key: number]: ClusterNode[] } = {}
            clusterNodes.forEach((node) => {
                if (!shardGroups[node.shard_num]) {
                    shardGroups[node.shard_num] = []
                }
                shardGroups[node.shard_num].push(node)
            })

            // Create cluster root node
            nodes.push({
                id: `cluster-${selectedCluster}`,
                label: `Cluster: ${selectedCluster}`,
                type: 'graphin-circle',
                style: {
                    keyshape: {
                        size: 60,
                        fill: '#5B8FF9',
                        stroke: '#3057A0',
                        lineWidth: 2,
                    },
                    label: {
                        value: `Cluster\n${selectedCluster}`,
                        fill: '#000',
                        fontSize: 14,
                        fontWeight: 'bold',
                    },
                    icon: {
                        type: 'text',
                        value: '🖥',
                        size: 30,
                        fill: '#fff',
                    },
                },
                data: {
                    type: 'cluster',
                    cluster: selectedCluster,
                    shardCount: Object.keys(shardGroups).length,
                },
            })

            // Create shard nodes and replica nodes
            Object.entries(shardGroups).forEach(([shardNum, replicas]) => {
                const shardId = `shard-${selectedCluster}-${shardNum}`

                // Create shard node
                nodes.push({
                    id: shardId,
                    label: `Shard ${shardNum}`,
                    type: 'graphin-circle',
                    style: {
                        keyshape: {
                            size: 50,
                            fill: '#5AD8A6',
                            stroke: '#2E8B57',
                            lineWidth: 2,
                        },
                        label: {
                            value: `Shard ${shardNum}`,
                            fill: '#000',
                            fontSize: 12,
                        },
                        icon: {
                            type: 'text',
                            value: '📊',
                            size: 24,
                            fill: '#fff',
                        },
                    },
                    data: {
                        type: 'shard',
                        shard_num: shardNum,
                        replica_count: replicas.length,
                    },
                })

                // Edge from cluster to shard
                edges.push({
                    source: `cluster-${selectedCluster}`,
                    target: shardId,
                    style: {
                        keyshape: {
                            stroke: '#5B8FF9',
                            lineWidth: 2,
                        },
                    },
                })

                // Create replica nodes
                replicas.forEach((replica) => {
                    const replicaId = `replica-${selectedCluster}-${shardNum}-${replica.replica_num}`
                    const hasErrors = replica.errors_count > 0
                    const hasSlow = replica.slowdowns_count > 0

                    nodes.push({
                        id: replicaId,
                        label: replica.host_name,
                        type: 'graphin-circle',
                        style: {
                            keyshape: {
                                size: 40,
                                fill: hasErrors ? '#F5222D' : hasSlow ? '#FAAD14' : '#73D13D',
                                stroke: hasErrors ? '#A8071A' : hasSlow ? '#D46B08' : '#389E0D',
                                lineWidth: 2,
                            },
                            label: {
                                value: `${replica.host_name}\n${replica.host_address}:${replica.port}`,
                                fill: '#000',
                                fontSize: 10,
                            },
                            icon: {
                                type: 'text',
                                value: '🖥',
                                size: 20,
                                fill: '#fff',
                            },
                        },
                        data: {
                            type: 'replica',
                            ...replica,
                        },
                    })

                    // Edge from shard to replica
                    edges.push({
                        source: shardId,
                        target: replicaId,
                        style: {
                            keyshape: {
                                stroke: '#5AD8A6',
                                lineWidth: 1.5,
                            },
                        },
                    })
                })
            })
        }

        if (viewMode === 'tables' || viewMode === 'combined') {
            // Group tables by database
            const databases = [...new Set(data.tables.map((t) => t.database))]

            databases.forEach((dbName, dbIndex) => {
                const dbNodeId = `database-${dbName}`
                const tablesInDb = data.tables.filter((t) => t.database === dbName)

                // Create database node
                nodes.push({
                    id: dbNodeId,
                    label: dbName,
                    type: 'graphin-circle',
                    style: {
                        keyshape: {
                            size: 50,
                            fill: '#9254DE',
                            stroke: '#531DAB',
                            lineWidth: 2,
                        },
                        label: {
                            value: `DB: ${dbName}`,
                            fill: '#000',
                            fontSize: 12,
                        },
                        icon: {
                            type: 'text',
                            value: '💾',
                            size: 24,
                            fill: '#fff',
                        },
                    },
                    data: {
                        type: 'database',
                        database: dbName,
                        table_count: tablesInDb.length,
                    },
                })

                // If in combined mode, connect database to cluster
                if (viewMode === 'combined') {
                    edges.push({
                        source: `cluster-${selectedCluster}`,
                        target: dbNodeId,
                        style: {
                            keyshape: {
                                stroke: '#9254DE',
                                lineWidth: 1,
                                lineDash: [5, 5],
                            },
                        },
                    })
                }

                // Create table nodes (limit to prevent overcrowding)
                tablesInDb.slice(0, 10).forEach((table, tableIndex) => {
                    const tableNodeId = `table-${table.database}-${table.table}`
                    const isReplicated = data.replication_status.some(
                        (r) => r.database === table.database && r.table === table.table
                    )

                    nodes.push({
                        id: tableNodeId,
                        label: table.table,
                        type: 'graphin-circle',
                        style: {
                            keyshape: {
                                size: 30,
                                fill: isReplicated ? '#FF7A45' : '#40A9FF',
                                stroke: isReplicated ? '#D4380D' : '#096DD9',
                                lineWidth: 1.5,
                            },
                            label: {
                                value: `${table.table}\n${table.engine}`,
                                fill: '#000',
                                fontSize: 9,
                            },
                            icon: {
                                type: 'text',
                                value: '📋',
                                size: 16,
                                fill: '#fff',
                            },
                        },
                        data: {
                            type: 'table',
                            ...table,
                            isReplicated,
                        },
                    })

                    edges.push({
                        source: dbNodeId,
                        target: tableNodeId,
                        style: {
                            keyshape: {
                                stroke: '#9254DE',
                                lineWidth: 1,
                            },
                        },
                    })
                })
            })
        }

        return { nodes, edges }
    }, [data, selectedCluster, viewMode])

    const handleNodeClick = (node: any) => {
        const model = node.get('model')
        setSelectedNode({
            id: model.id,
            type: model.data?.type || 'unknown',
            data: model.data,
        })
        setDrawerVisible(true)
    }

    const renderNodeDetails = () => {
        if (!selectedNode) return null

        switch (selectedNode.type) {
            case 'cluster':
                return (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Cluster Name">{selectedNode.data.cluster}</Descriptions.Item>
                        <Descriptions.Item label="Shard Count">{selectedNode.data.shardCount}</Descriptions.Item>
                    </Descriptions>
                )
            case 'shard':
                return (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Shard Number">{selectedNode.data.shard_num}</Descriptions.Item>
                        <Descriptions.Item label="Replica Count">{selectedNode.data.replica_count}</Descriptions.Item>
                    </Descriptions>
                )
            case 'replica':
                return (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Host Name">{selectedNode.data.host_name}</Descriptions.Item>
                        <Descriptions.Item label="Host Address">{selectedNode.data.host_address}</Descriptions.Item>
                        <Descriptions.Item label="Port">{selectedNode.data.port}</Descriptions.Item>
                        <Descriptions.Item label="Shard">{selectedNode.data.shard_num}</Descriptions.Item>
                        <Descriptions.Item label="Replica">{selectedNode.data.replica_num}</Descriptions.Item>
                        <Descriptions.Item label="Is Local">
                            {selectedNode.data.is_local ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Errors">
                            {selectedNode.data.errors_count > 0 ? (
                                <Tag color="error">{selectedNode.data.errors_count}</Tag>
                            ) : (
                                <Tag color="success">0</Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Slowdowns">
                            {selectedNode.data.slowdowns_count > 0 ? (
                                <Tag color="warning">{selectedNode.data.slowdowns_count}</Tag>
                            ) : (
                                <Tag color="success">0</Tag>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                )
            case 'database':
                return (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Database Name">{selectedNode.data.database}</Descriptions.Item>
                        <Descriptions.Item label="Table Count">{selectedNode.data.table_count}</Descriptions.Item>
                    </Descriptions>
                )
            case 'table':
                return (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Database">{selectedNode.data.database}</Descriptions.Item>
                        <Descriptions.Item label="Table">{selectedNode.data.table}</Descriptions.Item>
                        <Descriptions.Item label="Engine">{selectedNode.data.engine}</Descriptions.Item>
                        <Descriptions.Item label="Total Rows">
                            {selectedNode.data.total_rows.toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Size">{selectedNode.data.total_bytes_readable}</Descriptions.Item>
                        <Descriptions.Item label="Replicated">
                            {selectedNode.data.isReplicated ? <Tag color="orange">Yes</Tag> : <Tag color="blue">No</Tag>}
                        </Descriptions.Item>
                    </Descriptions>
                )
            default:
                return <p>Select a node to view details</p>
        }
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Spin size="large" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div style={{ padding: 20 }}>
                <h1>Cluster Topology</h1>
                <Card>
                    <p>Failed to load topology data. Please check your ClickHouse connection.</p>
                </Card>
            </div>
        )
    }

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ textAlign: 'left' }}>Cluster Topology</h1>

            <Card>
                <Space style={{ marginBottom: 16 }}>
                    <span>Cluster:</span>
                    <Select
                        style={{ width: 200 }}
                        value={selectedCluster}
                        onChange={setSelectedCluster}
                        options={clusters.map((c) => ({ label: c, value: c }))}
                    />
                    <span style={{ marginLeft: 20 }}>View Mode:</span>
                    <Select
                        style={{ width: 200 }}
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: 'Cluster Topology', value: 'cluster' },
                            { label: 'Tables & Databases', value: 'tables' },
                            { label: 'Combined View', value: 'combined' },
                        ]}
                    />
                </Space>

                <div style={{ height: 700, border: '1px solid #d9d9d9', borderRadius: 4 }}>
                    {graphData.nodes.length > 0 ? (
                        <Graphin
                            data={graphData}
                            layout={{
                                type: 'dagre',
                                rankdir: 'LR',
                                align: 'UL',
                                nodesep: 60,
                                ranksep: 120,
                            }}
                            fitView
                            style={{ height: '100%' }}
                            defaultNode={{
                                type: 'graphin-circle',
                            }}
                            modes={{
                                default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'click-select'],
                            }}
                            onNodeClick={({ item }: { item: any }) => handleNodeClick(item)}
                        />
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                            }}
                        >
                            <p>No cluster topology data available</p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 20 }}>
                    <h3>Legend:</h3>
                    <Space size="large">
                        <div>
                            <span style={{
                                display: 'inline-block',
                                width: 16,
                                height: 16,
                                backgroundColor: '#73D13D',
                                borderRadius: '50%',
                                marginRight: 8,
                            }}></span>
                            <span>Healthy Replica</span>
                        </div>
                        <div>
                            <span style={{
                                display: 'inline-block',
                                width: 16,
                                height: 16,
                                backgroundColor: '#FAAD14',
                                borderRadius: '50%',
                                marginRight: 8,
                            }}></span>
                            <span>Slowdowns</span>
                        </div>
                        <div>
                            <span style={{
                                display: 'inline-block',
                                width: 16,
                                height: 16,
                                backgroundColor: '#F5222D',
                                borderRadius: '50%',
                                marginRight: 8,
                            }}></span>
                            <span>Errors</span>
                        </div>
                        <div>
                            <span style={{
                                display: 'inline-block',
                                width: 16,
                                height: 16,
                                backgroundColor: '#FF7A45',
                                borderRadius: '50%',
                                marginRight: 8,
                            }}></span>
                            <span>Replicated Table</span>
                        </div>
                    </Space>
                </div>
            </Card>

            <Drawer
                title={`Node Details: ${selectedNode?.type || ''}`}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={450}
            >
                {renderNodeDetails()}
            </Drawer>
        </div>
    )
}
