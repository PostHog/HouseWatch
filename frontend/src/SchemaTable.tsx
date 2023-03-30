
// @ts-nocheck
import * as React from 'react';
import { usePollingEffect } from './PageCacheHits';
import { DataGrid } from '@mui/x-data-grid';


export default function CollapsibleTable({match}) {

    const [slowQueries, setSlowQueries] = React.useState([]);


    const url = `http://localhost:8000/api/analyze/${match.params.table}/schema`

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
        { field: 'column', headerName: 'Name', width: 100,},
        { field: 'compressed', headerName: 'Compressed', width: 200},
        { field: 'uncompressed', headerName: 'Uncompressed', width: 200}
    ]
    console.log('slow queries123', slowQueries)
  return (
    <div style={{ height: 800, width: '100%' }}>
        <h2>Table: {match.params.table}</h2>
      <DataGrid
        rows={slowQueries.map(d => ({id: d.column, ...d}))}
        columns={slowQueriesCols}
        pageSize={100}
        rowsPerPageOptions={[5]}
      />
    </div>
  );
}