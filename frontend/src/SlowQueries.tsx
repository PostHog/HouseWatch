// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { usePollingEffect } from './PageCacheHits';
// import { DataGrid } from '@mui/x-data-grid';
import { Table, Typography } from 'antd';
import {useHistory} from "react-router-dom";
const { Text, Paragraph } = Typography



export default function CollapsibleTable() {
    const history = useHistory()
      const slowQueriesColumns = [
<<<<<<< HEAD
        { title: 'Query', dataIndex: 'normalized_query', key: 'query', render: (_, item ) =>  {
            let index = 0
        return <Paragraph
        style={{ maxWidth: '100%'}} 
        ellipsis={{
            rows: 2, 
          expandable: false, title: item.normalized_query}}
          >{item.normalized_query.replace(/SELECT.*FROM/g, 'SELECT ... FROM').replace(/(\?)/g, ()=>{
            index = index + 1
            return '$'+index
        })}</Paragraph>
        }
    },
        { title: 'Avg time (ms)', dataIndex: 'avg_duration', render: (_, item) => <>{item.percentage_iops.toFixed(0)}ms</>},
        { title: 'Calls / min', dataIndex: 'calls_per_minute', render: (_, item) => <>{item.percentage_iops.toFixed(3)}</>},
        { title: '% of all iops', render: (_, item) => <>{item.percentage_iops.toFixed(1)}%</>},
        { title: '% of runtime', render: (_, item) => <>{item.percentage_runtime.toFixed(1)}%</>, dataIndex: 'percentage_runtime'},
        { title: 'Total iops', dataIndex: 'total_read_bytes'},
=======
        { title: 'Query type', dataIndex: 'query_type', key: 'query_type', width: 70, align: 'center'},
        { title: 'Query', dataIndex: 'query', key: 'query', width: 700},
        { title: 'Query duration (ms)', dataIndex: 'query_duration_ms', width: 200, key: 'query_duration_ms', sorter: (a, b) => a.query_duration_ms - b.query_duration_ms},
        { title: 'Readable Bytes', dataIndex: 'readable_bytes', width: 100, key: 'readable_bytes', sorter: (a, b) => a.total_bytes - b.total_bytes }
>>>>>>> 9374818d56ab7e697e341921cdf853d3ec7a0c0f
      ]

    const [slowQueries, setSlowQueries] = useState([]);

    const url = 'http://localhost:8000/api/analyze/slow_queries'

    usePollingEffect(
        async () => setSlowQueries(await fetch(url)
    .then(response => response.json())
    .then(data => data.map((d, idx) => ({key: idx, ...d})))),
    [],
    { interval: 5000 } // optional
  )


  return (
    <div >
      <h2 style={{ textAlign: 'left' }}>Slow queries</h2>
      <br />
      <div>
      <Table
        columns={slowQueriesColumns}
        onRow={(query, rowIndex) => {
            return {
              onClick: (event) => {
                history.push(`/query/${query.normalized_query_hash}`)
              }
            }
        }}
        rowClassName={() => 'cursor-pointer'}
        dataSource={slowQueries}
        size="small"
      />
      </div>
    </div>
  );
}
