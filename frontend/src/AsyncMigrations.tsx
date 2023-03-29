// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';



export function AsyncMigrations(): JSX.Element {

    const [asyncMigrations, setAsyncMigrations] = useState([]);

    const url = 'http://localhost:8000/api/async_migrations'

    useEffect(() => {
        const fetchAndUpdateAsyncMigrations = async () => {
            const response = await fetch(url)
            const responseJson = await response.json()
            setAsyncMigrations(responseJson.results)
        }
        fetchAndUpdateAsyncMigrations()
    }, [])


    console.log(asyncMigrations)

    return (
        <div style={{ display: 'flex'}}>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Description</TableCell>
                            <TableCell align="right">Status</TableCell>
                            <TableCell align="right">Progress</TableCell>
                            <TableCell align="right">Started at</TableCell>
                            <TableCell align="right">Finished at</TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {asyncMigrations.map((migration) => (
                            <TableRow
                                key={migration.name}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {migration.name}
                                </TableCell>
                                <TableCell align="right">{migration.description}</TableCell>
                                <TableCell align="right">{migration.status}</TableCell>
                                <TableCell align="right">{migration.progress}</TableCell>
                                <TableCell align="right">{migration.started_at}</TableCell>
                                <TableCell align="right">{migration.finished_at}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}