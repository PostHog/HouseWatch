import { Table, Button, notification, Typography } from 'antd';
import { usePollingEffect } from './PageCacheHits';
import React, { useState } from 'react';

const { Paragraph } = Typography

function KillQueryButton({ queryId }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [isKilled, setIsKilled] = useState(false);

  const killQuery = async () => {
    setIsLoading(true)
    await fetch(`http://localhost:8000/api/analyze/${queryId}/kill_query`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        query_id: queryId
      })
    })
      .then(response => {
        setIsKilled(true)
        setIsLoading(false)
        return response.json()
      })
      .catch(err => {
        setIsLoading(false)
        notification.error({
          message: "Killing query failed",
          description: err
        })

        return []
      })
  }
  return <>
    {isKilled ? <Button disabled>Query killed</Button> : <Button danger onClick={killQuery} loading={isLoading}>Kill query</Button>}
  </>
}

export default function RunningQueries() {

  const [runningQueries, setRunningQueries] = useState([]);

  const columns = [
    { title: 'Query', dataIndex: 'normalized_query', key: 'query', render: (_, item ) =>  {
            let index = 0
        return <Paragraph
        style={{ maxWidth: '100%'}} 
        ellipsis={{
            rows: 2, 
          expandable: true, title: item.query}}
          >{item.query.replace(/(\?)/g, ()=>{
            index = index + 1
            return '$'+index
        })}</Paragraph>
        }
    },
    { title: 'Elapsed time', dataIndex: 'elapsed' },
    { title: 'Rows read', dataIndex: 'read_rows', render: (_: any, item: any) => `~${item.read_rows}/${item.total_rows_approx}` },
    { title: 'Memory Usage', dataIndex: 'memory_usage' },
    {
      title: 'Actions', render: (_: any, item: any) =>
        <KillQueryButton queryId={item.query_id} />
    }
  ]


  const url = 'http://localhost:8000/api/analyze/running_queries'

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

  return (
    <>
      <h2 style={{ textAlign: 'left' }}>Running queries</h2>
      <br />
      <Table columns={columns} dataSource={runningQueries} />;
    </>
  )
}