
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { Line } from '@ant-design/plots';



export default function QueryDetail({match}) {
    const [queryDetail, setQueryDetail] = React.useState([]);
    const [querySQL, setQuerySQL] = React.useState('')

    const defaultConfig = {
        data: queryDetail,
        padding: 'auto',
        xField: 'day_start',
        yField: 'total',
        xAxis: {
          tickCount: 10,
        },
        slider: {
          start: 0.1,
          end: 0.5,
        },
      };
    const [config, setConfig] = React.useState(defaultConfig)

    const url = `http://localhost:8000/api/analyze/${match.params.query_hash}/query_detail`

    usePollingEffect(
    async () => setQueryDetail(await fetch(url)
    .then(response => {
        return response.json()
    })
    .then(data => {
        const mappedData = data.execution_count
        .splice(0, 200)
        setConfig({...config, data: mappedData})
        setQuerySQL(data.query)
        return mappedData
    })
    .catch(err => {
        return []
    })),
    [],
    { interval: 5000 } // optional
    )

    let index = 0
    return (
    <div style={{ height: 300, width: '100%', paddingTop: '5rem', marginBottom: '10rem', textAlign: 'left' }}>
        <h1>Execution count</h1>
        <code style={{textAlign: 'left'}}>{querySQL.replace(/(\?)/g, () => {
            index = index + 1
            return '$'+index
        })}</code>
        <Line {...config} />
    </div>
  );
}