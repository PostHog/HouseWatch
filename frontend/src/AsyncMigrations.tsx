// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { Button, LinearProgress } from '@mui/material'


const ASYNC_MIGRATION_STATUS_TO_HUMAN = {
    0: 'Not started',
    1: 'Running',
    2: 'Completed successfully',
    3: 'Errored',
    4: 'Rolled back',
    5: 'Starting',
    6: 'Failed at startup'
}

export function AsyncMigrationControls({ status, progress }: { status: number, progress: number }): JSX.Element {

    return (
        <div style={{ width: 100 }}>
            {[0, 4, 6].includes(status) ? (
                <Button variant="contained" >Run</Button>
            ) : status === 3 ? (
                <Button variant="contained" color='yellow'>Rollback</Button>
            ) : (
                <LinearProgress variant="determinate" value={progress} />
            )}
        </div>

    )
}

export function AsyncMigrations(): JSX.Element {

    const [asyncMigrations, setAsyncMigrations] = useState([])

    const url = 'http://localhost:8000/api/async_migrations'

    useEffect(() => {
        const fetchAndUpdateAsyncMigrations = async () => {
            const response = await fetch(url)
            const responseJson = await response.json()
            setAsyncMigrations(responseJson.results)
        }
        fetchAndUpdateAsyncMigrations()
    }, [])



    return (
        <div style={{ display: 'flex' }}>
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
                            <TableCell align="right"></TableCell>
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
                                <TableCell align="right">{ASYNC_MIGRATION_STATUS_TO_HUMAN[migration.status]}</TableCell>
                                <TableCell align="right">{migration.progress}</TableCell>
                                <TableCell align="right">{migration.started_at}</TableCell>
                                <TableCell align="right">{migration.finished_at}</TableCell>
                                <TableCell align="right"><AsyncMigrationControls status={migration.status} progress={migration.progress} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}