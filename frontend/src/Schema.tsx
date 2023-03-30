
// @ts-nocheck
import React, { useState } from 'react';
import { usePollingEffect } from './PageCacheHits';
import { Treemap } from '@ant-design/charts';
import { Table } from 'antd'

import {useHistory
  } from "react-router-dom";

export default function Schema() {

  const history = useHistory()
  const testSchemaData = {
    name: "root",
    children: []
  }

  const [schema, setSchema] = useState([]);
  const defaultConfig = {
    data: testSchemaData,
    colorField: 'name',
    style: {cursor: 'pointer'},
    label: {
      style: {
        fill: 'black',
        fontSize: 14,
        fontWeight: 600,
        }
    },
    drilldown: {
      enabled: true,
      breadCrumb: {
        rootText: 'Start over',
      },
    },
    onNodeClick: (event, node) => {
        console.log(event, node)

    },
    tooltip: {
      formatter: (v) => {
        const root = v.path[v.path.length - 1];
        return {
          name: v.name,
          value: `${(v.value / 1000000).toFixed(2)}mb (percentage: ${((v.value / root.value) * 100).toFixed(2)}%)`,
        };
      },
    }
  }
  const [config, setConfig] = useState(defaultConfig)


  const url = 'http://localhost:8000/api/analyze/tables'

  usePollingEffect(
    async () => {
      setSchema(await fetch(url)
        .then(response => {
          return response.json()
        }
        ).then(data => {
          const configDataChildren = data.map(table => ({ name: table.name, value: table.total_bytes, ...table }))
          const newConfigData = { ...config.data, children: configDataChildren }
          setConfig({ ...config, data: newConfigData })
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
    <div>
      <Treemap {...config}   onEvent={(node, event) => {
        if(event.type === 'element:click') {
            history.push(`/schema/${event.data.data.name}`)
        }
      }} />
    <Table
        dataSource={schema.map(d => ({id: d.column, ...d}))}
        onRow={(table, rowIndex) => {
            return {
              onClick: (event) => {
                history.push(`/schema/${table.name}`)
              }
            }
        }}
        rowClassName={() => 'cursor-pointer'}
        columns={[
            { dataIndex: 'name', title: 'Name' ,},
            { dataIndex: 'readable_bytes', title: 'Size' },
            { dataIndex: 'total_rows', title: 'Rows' }
        ]}
      />
    </div>
  );
}