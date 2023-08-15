import React, { useEffect, useState } from 'react'
import { Line } from '@ant-design/charts'
import { Card, Col, Row, Tooltip, notification } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

interface Cluster {
    cluster: string
}

interface Clusters {
    clusters: Cluster[]
}

export default function Clusters() {
    const [clusters, setClusters] = useState<Clusters>({
        clusters: [],
    })

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

    const now = new Date()
    const dayOfTheYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Clusters</h1>
            <br />
            <Row gutter={8} style={{ paddingBottom: 8 }}>
                <ul>
                    {clusters.clusters.map((cluster) => (
                        <li key={cluster.cluster}>{cluster.cluster}</li>
                    ))}
                </ul>
            </Row>
            <br />
        </div>
    )
}
