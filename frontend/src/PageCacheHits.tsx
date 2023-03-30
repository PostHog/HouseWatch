// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Gauge } from '@ant-design/plots';


const bull = (
  <Box
    component="span"
    sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
  >
    •
  </Box>
);

function BasicCard({ replica, percent }: { replica: string, percent: string }): JSX.Element {

  const gaugeConfig = {
    percent: percent,
    type: 'meter',
    innerRadius: 0.75,
    range: {
      ticks: [0, 1 / 3, 2 / 3, 1],
      color: ['#F4664A', '#FAAD14', '#30BF78'],
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#D0D0D0',
        },
      },
      pin: {
        style: {
          stroke: '#D0D0D0',
        },
      },
    },
    statistic: {
      content: {
        style: {
          fontSize: '36px',
          lineHeight: '36px',
        },
      },
    },
    style: {
      width: 400
    }
  };
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {replica}
        </Typography>
        <Gauge {...gaugeConfig} />
      </CardContent>
    </Card>
  );
}

export function usePollingEffect(
  asyncCallback: any,
  dependencies = [],
  {
    interval = 3000, // 3 seconds,
    onCleanUp = () => { }
  } = {},
) {
  const timeoutIdRef = useRef(null)
  useEffect(() => {
    let _stopped = false
      // Side note: preceding semicolon needed for IIFEs.
      ; (async function pollingCallback() {
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
    <div style={{ textAlign: 'left' }}>
      <h2>Page cache hit rate percentage per node</h2>
      <br />
      <div style={{ display: 'flex' }}>
        {pageCacheHitsPerReplica.map(perReplica => (
          <BasicCard replica={perReplica.replica} percent={perReplica.page_cache_read_ratio} />
        ))}
      </div>
    </div>

  )
}