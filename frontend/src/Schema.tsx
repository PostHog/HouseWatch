
// @ts-nocheck
import React, { useState } from 'react';
import { usePollingEffect } from './PageCacheHits';
import { Treemap } from '@ant-design/charts';


export default function Schema() {
  const testSchemaData = {
    name: "root",
    children: []
    // children: [
    //   {
    //     "name": "办公用品",
    //     "children": [
    //       {
    //         "name": "容器，箱子",
    //         "value": 1111987,
    //         "children": [
    //           {
    //             "date": "2010/10/13",
    //             "value": 261,
    //             "category": "办公用品",
    //             "subcategory": "容器，箱子",
    //             "name": "Eldon Base for stackable storage shelf, platinum"
    //           },
    //           {
    //             "date": "2012/5/7",
    //             "value": 236,
    //             "category": "办公用品",
    //             "subcategory": "容器，箱子",
    //             "name": "Filing/Storage Totes and Swivel Casters"
    //           },
    //         ]
    //       },
    //       {
    //         "name": "家具产品",
    //         "children": [
    //           {
    //             "name": "办公装饰品",
    //             "value": 708875,
    //             "children": [
    //               {
    //                 "date": "2011/7/15",
    //                 "value": 2808,
    //                 "category": "家具产品",
    //                 "subcategory": "办公装饰品",
    //                 "name": "\"Tenex Contemporary Contur Chairmats for Low and Medium Pile Carpet, Computer, 39\"\" x 49\"\"\""
    //               },
    //             ]
    //           }
    //         ]}
    //       ]
    //     }]
  }

  const [schema, setSchema] = useState([]);
  const defaultConfig = {
    data: testSchemaData,
    colorField: 'name',
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
      <Treemap {...config} />
    </div>
  );
}