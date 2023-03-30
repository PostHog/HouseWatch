// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { Button, Input, LinearProgress, Tab, Tabs, TextField } from '@mui/material'


const ASYNC_MIGRATION_STATUS_TO_HUMAN = {
    0: 'Not started',
    1: 'Running',
    2: 'Completed successfully',
    3: 'Errored',
    4: 'Rolled back',
    5: 'Starting',
    6: 'Failed at startup'
}

const triggerAsyncMigration = () => {

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

export function AsyncMigrationsList(): JSX.Element {
    const [asyncMigrations, setAsyncMigrations] = useState([])


    const fetchAndUpdateAsyncMigrationsIfNeeded = async () => {
        const response = await fetch('http://localhost:8000/api/async_migrations')
        const responseJson = await response.json()
        const results = responseJson.results
        if (JSON.stringify(results) !== JSON.stringify(asyncMigrations)) {
            setAsyncMigrations(results)
        }
    }


    useEffect(() => {
        fetchAndUpdateAsyncMigrationsIfNeeded()
    }, [])

    setInterval(fetchAndUpdateAsyncMigrationsIfNeeded, 5000)

    return (
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
    )
}

export function CreateNewAsyncMigration(): JSX.Element {


    const [asyncMigrationOperationsCount, setAsyncMigrationOperationsCount] = useState(1)



    return (
        <div>
            <form style={{ textAlign: 'left', marginLeft: 20, overflowY: 'auto' }}>
                <h3>Details</h3>

                <TextField placeholder='Name' style={{ width: 400 }}/><br/><br/>
                <TextField placeholder='Description' multiline style={{ width: 800 }} rows={3} /><br/><br/>

                <h3>Operations</h3>

                {[...Array(asyncMigrationOperationsCount)].map((_, i) => (
                    <span key={i}>
                        <h4>#{i+1}</h4>
                        <TextField placeholder='Operation SQL' multiline style={{ width: 800 }} rows={5}  /><br/><br/>
                        <TextField placeholder='Rollback SQL' multiline style={{ width: 800 }} rows={5}  /><br/><br/>
                    </span>
                ))}
                {asyncMigrationOperationsCount > 1 ? (
                    <>
                <Button variant='outlined' color='error' onClick={() => setAsyncMigrationOperationsCount(asyncMigrationOperationsCount - 1)}>-</Button>{' '}
                </>
                ): null}
                <Button variant='outlined'  onClick={() => setAsyncMigrationOperationsCount(asyncMigrationOperationsCount + 1)}>+</Button>

                
            </form>

        </div>

    )
}

export function AsyncMigrations(): JSX.Element {

    const [tab, setTab] = useState("list")


    return (
        <div style={{ display: 'block', margin: 'auto', width: '90%' }}>
            <br />
            <Tabs
                value={tab}
                textColor="primary"
                indicatorColor="primary"
                onChange={(_, value) => setTab(value)}
            >
                <Tab value="list" label="My migrations" />
                <Tab value="create" label="Create migration" />
            </Tabs>
            <br />
            {tab === "list" ? <AsyncMigrationsList /> : tab === "create" ? <CreateNewAsyncMigration /> : null}
            <br />
            <br />
        </div>
    )
}