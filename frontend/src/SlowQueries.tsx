// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { usePollingEffect } from './PageCacheHits';
// import { DataGrid } from '@mui/x-data-grid';
import { Table } from 'antd';



export default function CollapsibleTable() {
  const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
  ];

  const slowQueriesColumns = [
    { title: 'Query type', dataIndex: 'query_type', key: 'query_type' },
    { title: 'Query', dataIndex: 'query', key: 'query' },
    { title: 'Query duration (ms)', dataIndex: 'query_duration_ms', key: 'query_duration_ms' },
    { title: 'Readable Bytes', dataIndex: 'readable_bytes', key: 'readable_bytes' }
  ]


  const [slowQueries, setSlowQueries] = useState([]);

  const url = 'http://localhost:8000/api/analyze/slow_queries'

  usePollingEffect(
    async () => setSlowQueries(await fetch(url)
      .then(response => response.json())
      .then(data => data.map((d, idx) => ({ key: idx, ...d })))),
    [],
    { interval: 5000 } // optional
  )


  return (
    <div >
      <h2 style={{ textAlign: 'left' }}>Slow queries</h2>
      <br />
      <Table
        columns={slowQueriesColumns}
        dataSource={slowQueries}
      />
    </div>
  );
}
