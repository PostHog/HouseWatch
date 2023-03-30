// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Gauge, Pie } from '@ant-design/plots';
import { RingProgress } from '@ant-design/plots'
import { Statistic, Card as AntdCard } from 'antd';

interface NodeData {
  node: string
  page_cache_read_ratio: number
  total_bytes_transferred: number
  readable_bytes_transferred: number
  space_used: number
  free_space: number
  total_space_available: number
  readable_total_space_available: number
  readable_space_used: number
  readable_free_space: number
}



function BasicCard({ nodeData }: { nodeData: NodeData }): JSX.Element {

  const gaugeConfig = {
    percent: nodeData.page_cache_read_ratio,
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
          fontSize: '24px',
          lineHeight: '24px',
        },
      },
    },
    style: {
      height: 200,
      float: 'left'
    }
  }

  const ringConfig = {
    height: 100,
    width: 100,
    autoFit: false,
    percent: nodeData.space_used / nodeData.total_space_available,
    color: ['#5B8FF9', '#E8EDF3'],
  }

  const data = [
    {
      type: 'Used disk space',
      value: nodeData.space_used
    },
    {
      type: 'Free disk space',
      value: nodeData.free_space,
      // alias: nodeData.readable_free_space
    },
  ];
  const pieConfig = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    style: {
      height: 225,
      float: 'left'
    }
  };

  return (
    <Card sx={{ width: '95%', height: 350, display: 'block' }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {nodeData.node}
        </Typography>
        <div style={{ display: 'flex' }}>

          <Gauge {...gaugeConfig} />
          <AntdCard bordered={true} style={{ marginTop: 'auto', marginBottom: 'auto', marginLeft: 20 }}>
            <Statistic title="Data transferred to other shards" value={nodeData.readable_bytes_transferred}

              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </AntdCard>
          <Pie {...pieConfig} />


        </div>

        {/* <RingProgress {...ringConfig} /> */}
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

  const [clusterOverviewData, setClusterOverviewData] = useState([]);

  const url = 'http://localhost:8000/api/analyze/cluster_overview'

  usePollingEffect(
    async () => setClusterOverviewData(await fetch(url)
      .then(response => response.json())),
    [],
    { interval: 5000 } // optional
  )


  return (
    <div style={{ textAlign: 'left' }}>
      <h2>Cluster overview</h2>
      <br />
      <div style={{ display: 'block' }}>
        {clusterOverviewData.map(nodeData => (
          <>
          <BasicCard nodeData={nodeData} />
          <br />
          </>
        ))}
      </div>
    </div>

  )
}