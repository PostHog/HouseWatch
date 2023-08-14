// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Treemap } from '@ant-design/charts'
import { Spin, Table } from 'antd'

import { useHistory } from 'react-router-dom'

export default function Schema() {
    const history = useHistory()
    const testSchemaData = {
        name: 'root',
        children: [],
    }

    const [schema, setSchema] = useState([])
    const defaultConfig: React.ComponentProps<typeof Treemap> = {
        data: testSchemaData,
        colorField: 'name',
        style: { cursor: 'pointer' },
        label: {
            style: {
                fill: 'black',
                fontSize: 14,
                fontWeight: 600,
            },
        },
        drilldown: {
            enabled: true,
            breadCrumb: {
                rootText: 'Start over',
                position: 'top-left',
            },
        },
        tooltip: {
            formatter: (v) => {
                const root = v.path[v.path.length - 1]
                return {
                    name: v.name,
                    value: `${(v.value / 1000000).toFixed(2)}mb (${((v.value / root.value) * 100).toFixed(2)}%)`,
                }
            },
        },
    }
    const [config, setConfig] = useState(defaultConfig)

    const loadData = async () => {
        try {
            const res = await fetch('/api/analyze/tables')
            const resJson = await res.json()

            const filteredRes = resJson.filter((r: { total_bytes: number }) => r.total_bytes > 0)
            const filteredResUrls = filteredRes
                .map((fr: { name: string }) => `/api/analyze/${fr.name}/schema`)
                .slice(0, 1)

            const nestedRes = await Promise.all(
                filteredResUrls.map((_url: string) => fetch(_url).then((res2) => res2.json()))
            )

            const configDataChildren = filteredRes.map((table: { name: string; total_bytes: number }) => ({
                value: table.total_bytes,
                ...table,
            }))
            const configDataChildrenWithDrilldown = configDataChildren.map((child) => {
                if (nestedRes[0][0].table == child.name) {
                    const nestedChildren = nestedRes[0].map((nR) => ({
                        name: nR.column,
                        category: nR.table,
                        value: nR.compressed,
                    }))
                    return { ...child, children: nestedChildren }
                }
                return child
            })
            const newConfigData = { ...config.data, children: configDataChildrenWithDrilldown }
            setConfig({ ...config, data: newConfigData })
            setSchema(filteredRes)
        } catch {
            notification.error({ message: 'Failed to load data' })
            return
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Schema stats</h1>
            <h2>Largest tables</h2>
            <p>
                Click on the rectangles to get further information about parts and columns for the table. Note that this
                only covers data stored on the connected node, not the whole cluster.
            </p>
            <div style={{ marginBottom: 50 }}>
                {config.data.children.length < 1 ? (
                    <Spin />
                ) : (
                    <Treemap
                        {...config}
                        onEvent={(node, event) => {
                            if (event.type === 'element:click') {
                                history.push(`/schema/${event.data.data.name}`)
                            }
                        }}
                        rectStyle={{ cursor: 'pointer ' }}
                    />
                )}
            </div>
            <div>
                <h2 style={{ textAlign: 'left' }}>All tables</h2>
                <Table
                    dataSource={schema}
                    onRow={(table, rowIndex) => {
                        return {
                            onClick: (event) => {
                                history.push(`/schema/${table.name}`)
                            },
                        }
                    }}
                    rowClassName={() => 'cursor-pointer'}
                    columns={[
                        { dataIndex: 'name', title: 'Name' },
                        { dataIndex: 'readable_bytes', title: 'Size', sorter: (a, b) => a.total_bytes - b.total_bytes },
                        {
                            dataIndex: 'total_rows',
                            title: 'Rows',
                            defaultSortOrder: 'descend',
                            sorter: (a, b) => a.total_rows - b.total_rows,
                        },
                        { dataIndex: 'engine', title: 'Engine' },
                        { dataIndex: 'partition_key', title: 'Partition Key' },
                    ]}
                    loading={config.data.children.length < 1}
                />
            </div>
        </div>
    )
}
