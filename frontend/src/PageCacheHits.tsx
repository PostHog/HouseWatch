// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
const bull = (
    <Box
        component="span"
        sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
    >
        •
    </Box>
);

function BasicCard({ replica, percent }: { replica: string, percent: string }): JSX.Element {
    return (
        <Card sx={{ minWidth: 275 }}>
            <CardContent>
                <Typography variant="h5" sx={{fontWeight: 600}}>
                    {replica}
                </Typography>
                <Typography variant="h2" sx={{fontWeight: 700}}>
                    {(percent * 100).toFixed(2)}%
                </Typography>
            </CardContent>
            {/* <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions> */}
        </Card>
    );
}

export function usePollingEffect(
    asyncCallback: any,
    dependencies = [],
    { 
      interval = 3000, // 3 seconds,
      onCleanUp = () => {}
    } = {},
  ) {
    const timeoutIdRef = useRef(null)
    useEffect(() => {
      let _stopped = false
      // Side note: preceding semicolon needed for IIFEs.
      ;(async function pollingCallback() {
        try {
          await asyncCallback()
        } finally {
          // Set timeout after it finished, unless stopped
              timeoutIdRef.current = !_stopped && window.setTimeout(
                pollingCallback,
                interval
              )
        }
      })()
      // Clean up if dependencies change
      return () => {
        _stopped = true // prevent racing conditions
        clearTimeout(timeoutIdRef.current)
        onCleanUp()
      }
    }, [...dependencies, interval])
  }

export function PageCacheHits(): JSX.Element {

    const [pageCacheHitsPerReplica, setPageCacheHitsPerReplica] = useState([]);

    const url = 'http://localhost:8000/api/analyze/page_cache'

    usePollingEffect(
        async () => setPageCacheHitsPerReplica(await fetch(url)
    .then(response => response.json())),
    [],
    { interval: 5000 } // optional
    )

    return (
        <div style={{display: 'flex'}}>
            {pageCacheHitsPerReplica.map(perReplica => (
                <BasicCard replica={perReplica.replica} percent={perReplica.page_cache_read_ratio} />
            ))}
        </div>
    )
}