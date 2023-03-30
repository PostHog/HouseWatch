
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
              const nestedChildren = nestedRes[0].map(nR => ({name: nR.column, category: nR.table, value: nR.data_compressed_bytes}))
              return {...child, children: nestedChildren}
            }
            return child
          })
          const newConfigData = { ...config.data, children: configDataChildrenWithDrilldown }
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