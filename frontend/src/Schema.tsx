
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { DataGrid } from '@mui/x-data-grid';


export default function CollapsibleTable() {

    const [slowQueries, setSlowQueries] = React.useState([]);


    const url = 'http://localhost:8000/api/analyze/tables'

    usePollingEffect(
    async () => setSlowQueries(await fetch(url)
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
    const slowQueriesCols = [
        { field: 'name', headerName: 'Name', width: 100,
        renderCell: (params) =>  {
            console.log(params)
            return <a href={'/schema/' + params.id}>{params.id}</a>
        }
        },
        { field: 'readable_bytes', headerName: 'Readable bytes', width: 200},
        { field: 'total_rows', headerName: 'Total rows', width: 200}
    ]
    console.log('slow queries123', slowQueries)
  return (
    <div style={{ height: 800, width: '100%' }}>
      <DataGrid
        rows={slowQueries.map(d => ({id: d.name, ...d}))}
        columns={slowQueriesCols}
        pageSize={100}
        rowsPerPageOptions={[5]}
      />
    </div>
  );
}