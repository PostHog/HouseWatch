
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { DataGrid } from '@mui/x-data-grid';
import { Line } from '@ant-design/plots';
import { Typography } from 'antd'
import { Code } from '@mui/icons-material';
const { Text, Paragraph } = Typography



export default function QueryDetail({match}) {
    const [queryDetail, setQueryDetail] = React.useState([]);

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
        return mappedData
    })
    .catch(err => {
        return []
    })),
    [],
    { interval: 5000 } // optional
    )

  return (
    <div style={{ height: 300, width: '100%', paddingTop: '5rem', marginBottom: '10rem', textAlign: 'left' }}>
        <code style={{textAlign: 'left'}}>{queryDetail.query.replace(/(\?)/g, ()=>{
            index = index + 1
            return '$'+index
        })}</code>
        {queryDetail.execution_count && <Line data={queryDetail.execution_count}
            padding='auto'
        xField='day_start'
        yField='total'
        xAxis={{tickCount: 10}}
        
        />}
    </div>
  );
}