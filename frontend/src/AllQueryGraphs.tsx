// @ts-nocheck
import * as React from 'react'
import { usePollingEffect } from './PageCacheHits'
import { Line } from '@ant-design/charts'

export default function AllQueryGraphs() {
    const [queryGraphs, setQueryGraphs] = React.useState({ execution_count: [], memory_usage: [], read_bytes: [] })

    const url = `http://localhost:8000/api/analyze/query_graphs`

    usePollingEffect(
        async () =>
            setQueryGraphs(
                await fetch(url)
                    .then((response) => {
                        return response.json()
                    })
                    .then((data) => {
                        const execution_count = data.execution_count
                        const memory_usage = data.memory_usage
                        const read_bytes = data.read_bytes
                        return { execution_count, memory_usage, read_bytes }
                    })
                    .catch((err) => {
                        return { execution_count: [], memory_usage: [], read_bytes: [] }
                    })
            ),
        [],
        { interval: 5000 } // optional
    )

    console.log(
        queryGraphs.memory_usage.map((dataPoint) => ({
            total: dataPoint.total / 1000000000,
            day_start: dataPoint.day_start,
        }))
    )

    return (
        <div>
            <h1 style={{ textAlign: 'left' }}>Overview</h1>
            <h2>Execution count</h2>
            <Line
                data={queryGraphs.memory_usage.map((dataPoint) => ({
                    ...dataPoint,
                    day_start: dataPoint.day_start.split('T')[0],
                }))}
                xField={'day_start'}
                yField={'total'}
                xAxis={{ tickCount: 5 }}
            />
            <br />
            <h2 style={{ marginTop: 16 }}>Memory usage (GB)</h2>
            <Line
                data={queryGraphs.memory_usage.map((dataPoint) => ({
                    day_start: dataPoint.day_start.split('T')[0],
                    total: dataPoint.total / 1000000000,
                }))}
                xField={'day_start'}
                yField={'total'}
            />
            <br />
            <h2 style={{ marginTop: 16 }}>Read bytes (GB)</h2>
            <Line
                data={queryGraphs.read_bytes.map((dataPoint) => ({
                    day_start: dataPoint.day_start.split('T')[0],
                    total: dataPoint.total / 1000000000,
                }))}
                xField={'day_start'}
                yField={'total'}
                xAxis={{ tickCount: 5 }}
            />
        </div>
    )
}
