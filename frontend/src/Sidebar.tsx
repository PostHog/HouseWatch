import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { PageCacheHits } from './PageCacheHits';
import SlowQueries from './SlowQueries';
import Schema from './Schema';
import QueryDetail from './QueryDetail';
import SchemaTable from './SchemaTable';
import AllQueryGraphs from './AllQueryGraphs';
import Errors from './Errors';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory

} from "react-router-dom";

import { AsyncMigrations } from './AsyncMigrations';
import RunningQueries from './RunningQueries';
import {
  ApartmentOutlined,
  CodeOutlined,
  DashboardOutlined,
  DesktopOutlined,
  FileOutlined,
  HddOutlined,
  HomeOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { ConfigProvider, MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme } from 'antd';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  { key: '', icon: <HomeOutlined />, label: 'Overview' },
  { key: 'slow_queries', label: 'Slow queries', icon: <ClockCircleOutlined /> },
  { key: 'running_queries', label: 'Running queries', icon: <DashboardOutlined /> },
  { key: 'schema', label: 'Table sizes', icon: <HddOutlined />},
  { key: 'cluster_overview', label: 'Cluster overview', icon: <ApartmentOutlined />},
  { key: 'errors', label: 'Errors', icon: <WarningOutlined />},
  { key: 'async_migrations', label: 'Async migrations', icon: <CodeOutlined />},
  
            // {'path': '/', 'text': 'Home'},
            // {'path': '/slow_queries', 'text': 'Slow queries'},
            // {'path': '/running_queries', 'text': 'Running queries'},
            // {'path': '/schema', 'text': 'Table sizes'},
            // {'path': '/cluster_overview', 'text': 'Cluster overview'},
            // {'path': '/async_migrations', 'text': 'Async migrations'},
            // {'path': '/errors', 'text': 'ErrorWes'},
];


const drawerWidth = 240;

export default function PermanentDrawerLeft(): JSX.Element {
  const history = useHistory()
  const openPage = history.location.pathname.split('/')[1]

  console.log(openPage)
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#ffb200', colorPrimaryBg: 'black' }}}>
    <Layout style={{ minHeight: '100vh' }}>
      <Sider >
        <div >
          <h1 style={{fontSize: 20, color: '#ffb200', textAlign: 'center', fontFamily: 'Hind Siliguri' }}>HouseWatch</h1>
        </div>
        <Menu defaultSelectedKeys={[openPage]} theme="dark"  mode="inline" items={items} onClick={(info) => history.push(`/${info.key}`)} />
      </Sider>
      <Layout className="site-layout">
        <Content style={{ margin: 'auto', display: 'block', width: '85%', marginTop: 20 }}>
        <Switch>
          <Route exact path="/" component={AllQueryGraphs}>
          </Route>
          <Route exact path="/cluster_overview">
            <PageCacheHits />
          </Route>
          <Route exact path="/slow_queries" component={SlowQueries}>
          </Route>
          <Route exact path="/schema" component={Schema}>
          </Route>
          <Route exact path="/schema/:table" component={SchemaTable}>
          </Route>

          <Route exact path="/query/:query_hash" component={QueryDetail}>
          </Route>
          <Route exact path="/async_migrations" component={AsyncMigrations}>
          </Route>
          <Route exact path="/running_queries" component={RunningQueries}>
          </Route>
          <Route exact path="/errors" component={Errors}>
          </Route>
        </Switch>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Created by PostHog</Footer>
      </Layout>
    </Layout>
    </ConfigProvider>
  );
}