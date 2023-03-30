// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { Button, LinearProgress, Tab, Tabs, TextField } from '@mui/material'
import {
    useHistory
 } from 'react-router-dom'

const ASYNC_MIGRATION_STATUS_TO_HUMAN = {
    0: 'Not started',
    1: 'Running',
    2: 'Completed successfully',
    3: 'Errored',
    4: 'Rolled back',
    5: 'Starting',
    6: 'Failed at startup'
}

const ASYNC_MIGRATION_STATUS_TO_FONT_COLOR = {
    0: 'black',
    1: 'black',
    2: 'green',
    3: 'red',
    4: 'orange',
    5: 'black',
    6: 'red'
}


export function AsyncMigrationControls({ status, progress, id, triggerAsyncMigration }: { status: number, progress: number, id: number, triggerAsyncMigration: () => Promise<void> }): JSX.Element {

    return (
        <div style={{ width: 100 }}>
            {[0, 4, 6].includes(status) ? (
                <Button variant="contained" onClick={() => triggerAsyncMigration(id)}>Run</Button>
            ) : status === 3 ? (
                <Button variant="contained" color='warning'>Rollback</Button>
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

    const triggerAsyncMigration = async (id) => {
        await fetch(`http://localhost:8000/api/async_migrations/${id}/trigger`, { method: 'POST' })
        await fetchAndUpdateAsyncMigrationsIfNeeded()
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
                            <TableCell align="right" style={{ color: ASYNC_MIGRATION_STATUS_TO_FONT_COLOR[migration.status] }}>
                                <b>{ASYNC_MIGRATION_STATUS_TO_HUMAN[migration.status]}</b>
                            </TableCell>
                            <TableCell align="right">{migration.progress}</TableCell>
                            <TableCell align="right">{migration.started_at ? migration.started_at.split('.')[0] : ''}</TableCell>
                            <TableCell align="right">{migration.finished_at ? migration.finished_at.split('.')[0] : ''}</TableCell>
                            <TableCell align="right"><AsyncMigrationControls status={migration.status} progress={migration.progress} id={migration.id} triggerAsyncMigration={triggerAsyncMigration} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export function CreateNewAsyncMigration(): JSX.Element {

    const history = useHistory()

    const [asyncMigrationOperationsCount, setAsyncMigrationOperationsCount] = useState(1)

    const createAsyncMigration = async () => {
        const form = document.getElementById('create-migration-form')
        const formData = new FormData(form)

        const operations = []
        const rollbackOperations = []
        const asyncMigrationData = {
            name: '',
            description: '',
            operations: operations,
            rollbackOperations: rollbackOperations
        }
        for (const [key, value] of formData.entries()) {
            if (key.includes('operation')) {
                operations.push(value)
                continue
            }
            if (key.includes('rollback')) {
                rollbackOperations.push(value)
                continue
            }
            asyncMigrationData[key] = value

        }

        await fetch('http://localhost:8000/api/async_migrations', {
            method: 'POST',
            body: JSON.stringify(asyncMigrationData),
            headers: {
                "Content-Type": "application/json",
            },
        })

        history.go(0)

    }


    return (
        <div>

            <form style={{ textAlign: 'left', marginLeft: 20, overflowY: 'auto' }} id='create-migration-form'>
                <h3>Details</h3>

                <TextField id='create-migration-form-name' name='name' placeholder='Name' style={{ width: 400 }} /><br /><br />
                <TextField id='create-migration-form-description' name='description' placeholder='Description' multiline style={{ width: 800 }} rows={3} /><br /><br />

                <h3>Operations</h3>

                {[...Array(asyncMigrationOperationsCount)].map((_, i) => (
                    <span key={i}>
                        <h4>#{i + 1}</h4>
                        <TextField id={`create-migration-form-operation-${i + 1}`} name={`operation-${i + 1}`} placeholder='Operation SQL' multiline style={{ width: 800 }} rows={5} /><br /><br />
                        <TextField id={`create-migration-form-rollback-${i + 1}`} name={`rollback-${i + 1}`} placeholder='Rollback SQL' multiline style={{ width: 800 }} rows={5} /><br /><br />
                    </span>
                ))}
                {asyncMigrationOperationsCount > 1 ? (
                    <>
                        <Button variant='outlined' color='error' onClick={() => setAsyncMigrationOperationsCount(asyncMigrationOperationsCount - 1)}>-</Button>{' '}
                    </>
                ) : null}
                <Button variant='outlined' onClick={() => setAsyncMigrationOperationsCount(asyncMigrationOperationsCount + 1)}>+</Button>


            </form>
            <div style={{ textAlign: 'center' }}>
                <Button variant='contained' onClick={createAsyncMigration}>Save</Button>
            </div>

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