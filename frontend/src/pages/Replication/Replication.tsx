import { Table, Button, notification, Typography, Tooltip, Spin, Select, Space } from 'antd'
import { usePollingEffect } from '../../utils/usePollingEffect'
import React, { useState, useEffect } from 'react'
import { ColumnType } from 'antd/es/table'

const { Paragraph } = Typography

interface ClusterNode {
  cluster: string
  shard_num: number
  shard_weight: number
  replica_num: number
  host_name: string
  host_address: string
  port: number
  is_local: number
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

interface ReplicationQueueItem {
  host_name: string
  database: string
  table: string
  position: number
  error: string
  last_attempt_time: string
  num_attempts: number
  type: string
}

export default function Replication() {
  const [replicationQueue, setReplicationQueue] = useState<ReplicationQueueItem[]>([])
  const [loadingReplication, setLoadingReplication] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<string>('')
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loadingClusters, setLoadingClusters] = useState(false)

  useEffect(() => {
    const fetchClusters = async () => {
      setLoadingClusters(true)
      try {
        const res = await fetch('/api/clusters')
        const resJson: Cluster[] = await res.json()
        setClusters(resJson)
        if (resJson.length > 0) {
          setSelectedCluster(resJson[0].cluster)
        }
      } catch (err) {
        notification.error({
          message: 'Failed to fetch clusters',
          description: 'Please try again later',
        })
      }
      setLoadingClusters(false)
    }
    fetchClusters()
  }, [])

  const columns: ColumnType<ReplicationQueueItem>[] = [
    {
      title: 'Host',
      dataIndex: 'host_name',
      key: 'host_name',
    },
    {
      title: 'Database',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: 'Table',
      dataIndex: 'table',
      key: 'table',
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (error: string) => (
        <Paragraph
          style={{ maxWidth: '400px', color: 'red' }}
          ellipsis={{
            rows: 2,
            expandable: true,
          }}
        >
          {error}
        </Paragraph>
      ),
    },
    {
      title: 'Last Attempt',
      dataIndex: 'last_attempt_time',
      key: 'last_attempt_time',
    },
    {
      title: 'Attempts',
      dataIndex: 'num_attempts',
      key: 'num_attempts',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
  ]

  usePollingEffect(
    async () => {
      if (!selectedCluster) return

      setLoadingReplication(true)
      try {
        const res = await fetch(`/api/replication/?cluster=${selectedCluster}`)
        const resJson = await res.json()
        // Filter for failed items only
        const failedItems = resJson.filter((item: ReplicationQueueItem) => item.error)
        setReplicationQueue(failedItems)
      } catch (err) {
        notification.error({
          message: 'Failed to fetch replication queue',
          description: 'Please try again later',
        })
      }
      setLoadingReplication(false)
    },
    [selectedCluster],
    { interval: 5000 }
  )

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space>
          <h1 style={{ margin: 0 }}>
            {`${replicationQueue.length}`} Failed Replication Queue Items
          </h1>
          {loadingReplication && <Spin />}
        </Space>

        <Select
          style={{ width: 200 }}
          value={selectedCluster}
          onChange={setSelectedCluster}
          loading={loadingClusters}
          placeholder="Select a cluster"
        >
          {clusters.map((cluster) => (
            <Select.Option key={cluster.cluster} value={cluster.cluster}>
              {cluster.cluster}
            </Select.Option>
          ))}
        </Select>

        <Table
          columns={columns}
          dataSource={replicationQueue}
          loading={replicationQueue.length === 0 && loadingReplication}
          rowKey={(record) => `${record.host_name}-${record.table}-${record.position}`}
        />
      </Space>
    </>
  )
}
