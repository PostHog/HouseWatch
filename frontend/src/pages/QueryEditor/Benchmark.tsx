import { Button, Row, Col, Card, Divider, Spin } from 'antd'
import React, { useState } from 'react'
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-sql'
import 'prismjs/themes/prism.css'
import Editor from 'react-simple-code-editor'
import { Column } from '@ant-design/charts'

export interface BenchmarkingData {
    benchmarking_result: {
        query_version: string
        cpu: number
        read_bytes: number
        memory_usage: number
        duration_ms: number
        network_receive_bytes: number
        read_bytes_from_other_shards: number
    }[]
}

const DEFAULT_QUERY1 = `SELECT number FROM system.errors errors
JOIN (
    SELECT * FROM system.numbers LIMIT 1000
) numbers
ON numbers.number = toUInt64(errors.code)
SETTINGS join_algorithm = 'default'
`

const DEFAULT_QUERY2 = `SELECT number FROM system.errors errors
JOIN (
    SELECT * FROM system.numbers LIMIT 1000
) numbers
ON numbers.number = toUInt64(errors.code)
SETTINGS join_algorithm = 'parallel_hash'
`

export default function QueryBenchmarking() {
    const [query1, setQuery1] = useState(DEFAULT_QUERY1)
    const [query2, setQuery2] = useState(DEFAULT_QUERY2)
    const [runningBenchmark, setRunningBenchmark] = useState(false)
    const [error, setError] = useState<{ error_location: string; error: string } | null>(null)
    const [data, setData] = useState<BenchmarkingData | null>(null)

    const runBenchmark = async () => {
        setRunningBenchmark(true)
        try {
            setData(null)
            setError(null)
            const res = await fetch('http://localhost:8000/api/analyze/benchmark', {
                method: 'POST',
                body: JSON.stringify({ query1, query2 }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const resJson = await res.json()
            if (resJson.error) {
                setError(resJson)
            } else {
                setData(resJson)
            }
        } catch (error) {
            setError({ error: String(error), error_location: '' })
        }
        setRunningBenchmark(false)
    }

    return (
        <>
            <p>
                A simple benchmarking tool for analyzing how one query performs against another. Useful for testing
                different approaches to writing the same query when optimizing for performance. Note that this tool only
                runs each query once, and page cache is not cleared (this requires manual action on the node itself), so
                results are best taken as an indication of direction than a full-on benchmark.
            </p>
            <Divider />
            <Row gutter={4}>
                <Col span={12}>
                    <p style={{ textAlign: 'center' }}>
                        <b>Control</b>
                    </p>
                    <Editor
                        value={query1}
                        onValueChange={(code) => setQuery1(code)}
                        highlight={(code) => highlight(code, languages.sql)}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 16,
                            minHeight: 350,
                            border: '1px solid rgb(216, 216, 216)',
                            borderRadius: 4,
                            boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            marginBottom: 5,
                        }}
                    />
                </Col>
                <Col span={12}>
                    <p style={{ textAlign: 'center' }}>
                        <b>Test</b>
                    </p>
                    <Editor
                        value={query2}
                        onValueChange={(code) => setQuery2(code)}
                        highlight={(code) => highlight(code, languages.sql)}
                        padding={10}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 16,
                            minHeight: 350,
                            border: '1px solid rgb(216, 216, 216)',
                            borderRadius: 4,
                            boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)',
                            marginBottom: 5,
                        }}
                    />
                </Col>
            </Row>

            <Button
                type="primary"
                style={{ width: '100%', boxShadow: 'none' }}
                onClick={runBenchmark}
                disabled={runningBenchmark}
            >
                Benchmark
            </Button>
            <br />
            <br />
            {error ? (
                <>
                    <Card
                        style={{ textAlign: 'center' }}
                        title={
                            <>
                                {error.error_location === 'benchmark'
                                    ? 'Error loading benchmark results'
                                    : `Error on ${error.error_location} query`}
                            </>
                        }
                    >
                        <code style={{ color: '#c40000' }}>{error.error}</code>
                    </Card>
                </>
            ) : data && data.benchmarking_result ? (
                <>
                    <Row gutter={8} style={{ marginBottom: 4, height: 350 }}>
                        <Col span={12}>
                            <Card
                                style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }}
                                title="Duration (ms)"
                            >
                                <Column
                                    data={data.benchmarking_result || []}
                                    xField="query_version"
                                    yField="duration_ms"
                                    height={250}
                                    color={({ query_version }) => (query_version === 'Control' ? '#6495F9' : '#F7DA46')}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }}
                                title="Read bytes"
                            >
                                <Column
                                    data={data.benchmarking_result || []}
                                    xField="query_version"
                                    yField="read_bytes"
                                    height={250}
                                    color={({ query_version }) => (query_version === 'Control' ? '#6495F9' : '#F7DA46')}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={8} style={{ marginBottom: 4, height: 350 }}>
                        <Col span={12}>
                            <Card
                                style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }}
                                title="CPU usage"
                            >
                                <Column
                                    data={data.benchmarking_result || []}
                                    xField="query_version"
                                    yField="cpu"
                                    height={250}
                                    color={({ query_version }) => (query_version === 'Control' ? '#6495F9' : '#F7DA46')}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }}
                                title="Memory usage"
                            >
                                <Column
                                    data={data.benchmarking_result || []}
                                    xField="query_version"
                                    yField="memory_usage"
                                    height={250}
                                    color={({ query_version }) => (query_version === 'Control' ? '#6495F9' : '#F7DA46')}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={8} style={{ marginBottom: 4, height: 350 }}>
                        <Col span={12}>
                            <Card
                                style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }}
                                title="Bytes received from network"
                            >
                                <Column
                                    data={data.benchmarking_result || []}
                                    xField="query_version"
                                    yField="network_receive_bytes"
                                    height={250}
                                    color={({ query_version }) => (query_version === 'Control' ? '#6495F9' : '#F7DA46')}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                style={{ boxShadow: '2px 2px 2px 2px rgb(217 208 208 / 20%)', height: 350 }}
                                title="Read bytes from other shards"
                            >
                                <Column
                                    data={data.benchmarking_result || []}
                                    xField="query_version"
                                    yField="read_bytes_from_other_shards"
                                    height={250}
                                    color={({ query_version }) => (query_version === 'Control' ? '#6495F9' : '#F7DA46')}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            ) : runningBenchmark ? (
                <div style={{ margin: 0, textAlign: 'center' }}>
                    <Spin />
                </div>
            ) : null}
        </>
    )
}
