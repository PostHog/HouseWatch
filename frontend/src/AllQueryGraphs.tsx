
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { Line } from '@ant-design/charts';



export default function AllQueryGraphs() {
    const [queryGraphs, setQueryGraphs] = React.useState({execution_count: [], memory_usage: [], read_bytes: []});

    const url = `http://localhost:8000/api/analyze/query_graphs`

    usePollingEffect(
    async () => setQueryGraphs(await fetch(url)
    .then(response => {
        return response.json()
    })
    .then(data => {
        const execution_count = data.execution_count.splice(0, 200)
        const memory_usage = data.memory_usage.splice(0, 200)
        const read_bytes = data.read_bytes.splice(0, 200)
        return { execution_count, memory_usage, read_bytes }
    })
    .catch(err => {
        return {execution_count: [], memory_usage: [], read_bytes: []}
    })),
    [],
    { interval: 5000 } // optional
    )
  return (
    <div 
    style={{ width: '100%', paddingTop: '1rem', marginBottom: '10rem' }}>
        Welcome to HoUsEwAtCh
        <h3>Execution count</h3>
        <Line data={queryGraphs.execution_count} xField={'day_start'} yField={'total'} xAxis={{tickCount: 5}} slider={{start: 0.1, end: 0.5}}/>

        <h3 style={{marginTop: 16}}>Memory usage</h3>
        <Line data={queryGraphs.memory_usage} xField={'day_start'} yField={'total'} xAxis={{tickCount: 5}} slider={{start: 0.1, end: 0.5}}/>

        <h3 style={{marginTop: 16}}>Read bytes</h3>
        <Line data={queryGraphs.read_bytes} xField={'day_start'} yField={'total'} xAxis={{tickCount: 5}} slider={{start: 0.1, end: 0.5}}/>
      
    </div>
  );
}