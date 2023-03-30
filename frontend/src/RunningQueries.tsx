import { Table } from 'antd';
import { usePollingEffect } from './PageCacheHits';
import React, { useState } from 'react';

export default function RunningQueries() {
    const columns = [
        {title: 'query', dataIndex: 'query'},
        {title: 'Elapsed time', dataIndex: 'elapsed'},
        {title: 'Rows read', dataIndex: 'read_rows', render: (_, item: any) => `~${item.read_rows}/${item.total_rows_approx}`},
        {title: 'Memory Usage', dataIndex: 'memory_usage'},
    ]


  const url = 'http://localhost:8000/api/analyze/running_queries'

  const [runningQueries, setRunningQueries] = useState([]);
  usePollingEffect(
    async () => {
      setRunningQueries(await fetch(url)
        .then(response => {
          return response.json()
        }
        ).then(data => {
            setRunningQueries(data)
          return data
        })
        .catch(err => {
          return []
        }))
    },
    [],
    { interval: 10000 } // optional
  )

    return <>
        <Table columns={columns} dataSource={runningQueries} />;
    </>
}