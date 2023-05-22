// @ts-nocheck
import * as React from 'react'
import { usePollingEffect } from "../../utils/usePollingEffect"
import { Treemap } from '@ant-design/charts'
import { Table } from 'antd'

import { useHistory } from 'react-router-dom'
import { Tab, Tabs } from '@mui/material'

function TableTreeMap({ schema, dataIndex }) {

    const config = {
        data: {
            name: 'root',
            children: schema.map((table) => ({ name: table[dataIndex], value: table.compressed, ...table })),
        },
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
            },
        },
        tooltip: {
            formatter: (v) => {
                const root = v.path[v.path.length - 1]
                return {
                    name: v.name,
                    value: `${(v.value / 1000000).toFixed(2)}mb (percentage: ${((v.value / root.value) * 100).toFixed(
                        2
                    )}%)`,
                }
            },
        },
    }

    return (
        <div>
            <Treemap
                {...config}
            />
        </div>
    )
}

export function ColumnsData({ table }: { table: string }): JSX.Element {
    const [schema, setSchema] = React.useState([])

    const url = `http://localhost:8000/api/analyze/${table}/schema`

    usePollingEffect(
        async () =>
            setSchema(
                await fetch(url)
                    .then((response) => {
                        return response.json()
                    })
                    .catch((err) => {
                        return []
                    })
            ),
        [],
        { interval: 3000 } // optional
    )

    const schemaCols = [
        { dataIndex: 'column', title: 'Name' },
        { dataIndex: 'type', title: 'type' },
        { dataIndex: 'compressed_readable', title: 'Compressed' },
        { dataIndex: 'uncompressed', title: 'Uncompressed' },
    ]

    return (
        <>
            {schema && <TableTreeMap schema={schema} dataIndex="column" />}
            <div style={{ marginTop: 50 }}>
                <Table dataSource={schema.map((d) => ({ id: d.column, ...d }))} columns={schemaCols} />
            </div>
        </>
    )
}

export function PartsData({ table }: { table: string }): JSX.Element {
    const [partData, setPartData] = React.useState([])

    const url = `http://localhost:8000/api/analyze/${table}/parts`

    usePollingEffect(
        async () =>
            setPartData(
                await fetch(url)
                    .then((response) => {
                        return response.json()
                    })
                    .catch((err) => {
                        return []
                    })
            ),
        [],
        { interval: 3000 } // optional
    )

    const schemaCols = [
        { dataIndex: 'part', title: 'Name' },
        { dataIndex: 'compressed_readable', title: 'Compressed' },
        { dataIndex: 'uncompressed', title: 'Uncompressed' },
    ]

    return (
        <>
            {partData && <TableTreeMap schema={partData} dataIndex="part" />}
            <div style={{ marginTop: 50 }}>
                <Table dataSource={partData.map((d) => ({ id: d.part, ...d }))} columns={schemaCols} size="middle" />
            </div>
        </>
    )
}

export default function CollapsibleTable({ match }) {
    const [tab, setTab] = React.useState('columns')
    const history = useHistory()

    return (
        <div>
            <a onClick={() => history.push(`/schema/`)}>← Return to tables list</a>
            <h1>Table: {match.params.table}</h1>
            <Tabs value={tab} textColor="primary" indicatorColor="primary" onChange={(_, value) => setTab(value)}>
                <Tab value="columns" label="Columns" key="columns" />
                <Tab value="parts" label="Parts" key="parts" />
            </Tabs>
            <br />
            {tab === 'columns' ? <ColumnsData table={match.params.table} /> : <PartsData table={match.params.table} />}
        </div>
    )
}
