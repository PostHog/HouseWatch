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
        { title: 'Error', dataIndex: 'name', render: (_, item) => <>{item.name}</>},
        { title: 'Occurrences', dataIndex: 'count', render: (_, item) => <>{item.count}</>},
        { title: 'Most recent occurence', dataIndex: 'max_last_error_time', render: (_, item) => <>{item.max_last_error_time}</>},
      ]

    const [slowQueries, setSlowQueries] = useState([]);

    const url = 'http://localhost:8000/api/analyze/errors'

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
        dataSource={slowQueries}
        size="small"
      />
      </div>
    </div>
  );
}
