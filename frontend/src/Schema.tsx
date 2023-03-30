
// @ts-nocheck
import React, { useState } from 'react';
import { usePollingEffect } from './PageCacheHits';
import { Treemap } from '@ant-design/charts';
import { Table } from 'antd'

import {
  useHistory
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
    style: { cursor: 'pointer' },
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
        )
        .then(async (res) => {
          const filteredRes = res.filter(r => r.total_bytes > 0)
          const filteredResUrls = filteredRes.map(fr => `http://localhost:8000/api/analyze/${fr.name}/schema`).slice(0, 1)

          const nestedRes = await Promise.all(filteredResUrls.map(e => fetch(e).then(res2 => res2.json())))
          return [filteredRes, nestedRes]
        })
        .then(data => {
          const res = data[0]
          const nestedRes = data[1]
          const configDataChildren = res.map(table => ({ name: table.name, value: table.total_bytes, ...table }))
          const configDataChildrenWithDrilldown = configDataChildren.map(child => {
            if (nestedRes[0][0].table == child.name) {
              const nestedChildren = nestedRes[0].map(nR => ({ name: nR.column, category: nR.table, value: nR.compressed }))
              return { ...child, children: nestedChildren }
            }
            return child
          })
          const newConfigData = { ...config.data, children: configDataChildrenWithDrilldown }
          setConfig({ ...config, data: newConfigData })
          return res
        })
        .catch(err => {
          return []
        }))
    },
    []
  )

  return (
    <div>
      <h2 style={{ textAlign: 'left', fontWeight: 500 }}>Largest tables by data size</h2>
      <div style={{ marginBottom: 50}}>
        <Treemap {...config} onEvent={(node, event) => {
          if (event.type === 'element:click') {
            history.push(`/schema/${event.data.data.name}`)
          }
        }} />
      </div>
      <div>
        <h2 style={{textAlign: 'left', fontWeight: 500}}>All tables</h2>
        <Table
          dataSource={schema}
          onRow={(table, rowIndex) => {
            return {
              onClick: (event) => {
                history.push(`/schema/${table.name}`)
              }
            }
          }}
          rowClassName={() => 'cursor-pointer'}
          columns={[
            { dataIndex: 'name', title: 'Name', },
            { dataIndex: 'readable_bytes', title: 'Size', sorter: (a, b) => a.total_bytes - b.total_bytes },
            { dataIndex: 'total_rows', title: 'Rows', defaultSortOrder: "descend", sorter: (a, b) => a.total_rows - b.total_rows },
            { dataIndex: 'engine', title: 'Engine', },
            { dataIndex: 'partition_key', title: 'Partition Key', },
          ]}
        />
      </div>
    </div>
  );
}