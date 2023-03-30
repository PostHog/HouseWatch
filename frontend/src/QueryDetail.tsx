
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { DataGrid } from '@mui/x-data-grid';
import { Line } from '@ant-design/plots';



export default function CollapsibleTable({match}) {

    const [queryDetail, setQueryDetail] = React.useState([]);


    const url = `http://localhost:8000/api/analyze/${match.params.query_hash}/query_detail`

    usePollingEffect(
    async () => setQueryDetail(await fetch(url)
    .then(response => {
        return response.json()
    }
    )
    .catch(err => {
        return []
    })),
    [],
    { interval: 3000 } // optional
    )
  return (
    <div style={{ height: 300, width: '100%', paddingTop: '5rem', marginBottom: '10rem' }}>
        {queryDetail.execution_count && <Line data={queryDetail.execution_count}
            padding='auto'
        xField='day_start'
        yField='total'
        xAxis={{tickCount: 10}}
        
        />}



        {/* {JSON.stringify(slowQueries)} */}
      
    </div>
  );
}