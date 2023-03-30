
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { DataGrid } from '@mui/x-data-grid';
import { Treemap } from '@ant-design/charts';

import {useHistory
  } from "react-router-dom";



function TableTreeMap({schema}) {
  const history = useHistory()
  

  const config = {
    data: {
        name: "root",
        children: schema.map(table => ({ name: table.column, value: table.compressed, ...table })),
    },
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
    tooltip: {
      formatter: (v) => {
        const root = v.path[v.path.length - 1];
        return {
          name: v.name,
          value: `${(v.value / 1000000).toFixed(2)}mb (percentage: ${((v.value / root.value) * 100).toFixed(2)}%)`,
        };
      },
    },
  }


  return (
    <div>
      <Treemap {...config}   onEvent={(node, event) => {
        if(event.type === 'element:click') {
            history.push(`/schema/${event.data.data.name}`)
        }
      }} />
    </div>
  );
}

export default function CollapsibleTable({match}) {

    const [schema, setSchema] = React.useState([]);


    const url = `http://localhost:8000/api/analyze/${match.params.table}/schema`

    usePollingEffect(
    async () => setSchema(await fetch(url)
    .then(response => {
        return response.json()
    }
    )
    .catch(err => {
        return []
    })),
    [],
    { interval: 3000 } // optional
    )
    const schemaCols = [
        { dataIndex: 'column', title: 'Name' ,},
        { dataIndex: 'compressed_readable', title: 'Compressed' },
        { dataIndex: 'uncompressed', title: 'Uncompressed' }
    ]
  return (
    <div style={{ height: 800, width: '100%' }}>
        <h2>Table: {match.params.table}</h2>
        {schema && <TableTreeMap schema={schema} />}
      <DataGrid
        rows={schema.map(d => ({id: d.column, ...d}))}
        columns={schemaCols}
        pageSize={100}
        rowsPerPageOptions={[5]}
      />
    </div>
  );
}