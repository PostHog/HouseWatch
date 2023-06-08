// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { DiskUsage } from './pages/DiskUsage/DiskUsage'
import SlowQueries from './pages/SlowQueries/SlowQueries'
import Schema from './pages/SchemaStats/SchemaStats'
import QueryDetail from './pages/SlowQueries/QueryDetail'
import SchemaTable from './pages/SchemaStats/SchemaTable'
import Overview from './pages/Overview/Overview'
import Errors from './pages/Errors/Errors'
import { Switch, Route, useHistory } from 'react-router-dom'

import { Operations } from './pages/Operations/Operations'
import RunningQueries from './pages/RunningQueries/RunningQueries'
import Logs from './pages/Logs/Logs'
import {
    ApartmentOutlined,
    CodeOutlined,
    DashboardOutlined,
    HddOutlined,
    HomeOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    GithubFilled,
    BarsOutlined,
    FormOutlined,
    RobotOutlined,
} from '@ant-design/icons'
import { ConfigProvider, MenuProps } from 'antd'
import { Layout, Menu } from 'antd'
import QueryEditorPage from './pages/QueryEditor/QueryEditorPage'
import AIToolsPage from './pages/AITools/AIToolsPage'

const { Header, Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
    { key: '', icon: <HomeOutlined />, label: 'Overview' },
    { key: 'query_performance', label: 'Query performance', icon: <ClockCircleOutlined /> },
    { key: 'running_queries', label: 'Running queries', icon: <DashboardOutlined /> },
    { key: 'schema', label: 'Schema stats', icon: <HddOutlined /> },
    { key: 'disk_usage', label: 'Disk usage', icon: <ApartmentOutlined /> },
    { key: 'logs', label: 'Logs', icon: <BarsOutlined /> },
    { key: 'errors', label: 'Errors', icon: <WarningOutlined /> },
    { key: 'query_editor', label: 'Query editor', icon: <FormOutlined /> },
    { key: 'operations', label: 'Operations', icon: <CodeOutlined /> },
    { key: 'ai_tools', label: 'AI Tools', icon: <RobotOutlined /> },
]

export default function AppLayout(): JSX.Element {
    const [hostname, setHostname] = useState('')

    const fetchHostname = async () => {
        const response = await fetch(`http://localhost:8000/api/analyze/hostname`)
        const responseJson = await response.json()
        setHostname(responseJson.hostname)
    }

    useEffect(() => {
        fetchHostname()
    }, [])

    const history = useHistory()
    const openPage = history.location.pathname.split('/')[1]

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#ffb200', colorPrimaryBg: 'black' } }}>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider className="sidebar">
                    <div className="clickable" onClick={() => history.push('')}>
                        <h1
                            style={{ fontSize: 20, color: '#ffb200', textAlign: 'center', fontFamily: 'Hind Siliguri' }}
                        >
                            HouseWatch
                        </h1>
                    </div>
                    <Menu
                        defaultSelectedKeys={[openPage]}
                        theme="dark"
                        mode="inline"
                        items={items}
                        onClick={(info) => history.push(`/${info.key}`)}
                    />
                </Sider>
                <Layout>
                    <Header
                        style={{
                            background: 'rgb(231 231 231)',
                            borderBottom: '1px solid #c7c7c7',
                            display: 'inline-block',
                        }}
                    >
                        <p style={{ textAlign: 'center', margin: 0 }}>
                            <b>{hostname}</b>
                        </p>
                    </Header>

                    <Content style={{ margin: 'auto', display: 'block', width: '85%', marginTop: 20 }}>
                        <Switch>
                            <Route exact path="/" component={Overview}></Route>
                            <Route exact path="/disk_usage">
                                <DiskUsage />
                            </Route>
                            <Route exact path="/query_performance" component={SlowQueries}></Route>
                            <Route exact path="/schema" component={Schema}></Route>
                            <Route exact path="/schema/:table" component={SchemaTable}></Route>

                            <Route exact path="/query_performance/:query_hash" component={QueryDetail}></Route>
                            <Route exact path="/operations" component={Operations}></Route>
                            <Route exact path="/running_queries" component={RunningQueries}></Route>
                            <Route exact path="/logs" component={Logs}></Route>
                            <Route exact path="/errors" component={Errors}></Route>
                            <Route exact path="/query_editor" component={QueryEditorPage}></Route>
                            <Route exact path="/query_editor/:tab" component={QueryEditorPage}></Route>
                            <Route exact path="/query_editor/:tab/:id" component={QueryEditorPage}></Route>
                            <Route exact path="/ai_tools" component={AIToolsPage}></Route>
                        </Switch>
                    </Content>
                    <Footer style={{ textAlign: 'center' }}>
                        <p style={{ lineHeight: 2 }}>
                            Created by{' '}
                            <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">
                                PostHog
                            </a>
                        </p>
                        <a
                            href="https://github.com/PostHog/HouseWatch"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'black' }}
                        >
                            <GithubFilled />
                        </a>
                    </Footer>
                </Layout>
            </Layout>
        </ConfigProvider>
    )
}
