// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { usePollingEffect } from './PageCacheHits';
// import { DataGrid } from '@mui/x-data-grid';
import { Table } from 'antd';
import {useHistory} from "react-router-dom";



export default function CollapsibleTable() {
    const history = useHistory()
      const slowQueriesColumns = [
        { title: 'Query type', dataIndex: 'query_type', key: 'query_type', width: 70, align: 'center'},
        { title: 'Query', dataIndex: 'query', key: 'query', width: 700},
        { title: 'Query duration (ms)', dataIndex: 'query_duration_ms', width: 200, key: 'query_duration_ms', sorter: (a, b) => a.query_duration_ms - b.query_duration_ms},
        { title: 'Readable Bytes', dataIndex: 'readable_bytes', width: 100, key: 'readable_bytes', sorter: (a, b) => a.total_bytes - b.total_bytes }
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
