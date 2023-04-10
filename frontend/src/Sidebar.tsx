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
  { key: 'home', icon: <HomeOutlined />, label: 'Home' },
  { key: 'slow-queries', label: 'Slow queries', icon: <ClockCircleOutlined /> },
  { key: 'running-queries', label: 'Running queries', icon: <DashboardOutlined /> },
  { key: 'table-sizes', label: 'Table sizes', icon: <HddOutlined />},
  { key: 'cluster-overview', label: 'Cluster overview', icon: <ApartmentOutlined />},
  { key: 'errors', label: 'Errors', icon: <WarningOutlined />},
  { key: 'async-migrations', label: 'Async migrations', icon: <CodeOutlined />},
  
            // {'path': '/', 'text': 'Home'},
            // {'path': '/slow_queries', 'text': 'Slow queries'},
            // {'path': '/running_queries', 'text': 'Running queries'},
            // {'path': '/schema', 'text': 'Table sizes'},
            // {'path': '/cluster_overview', 'text': 'Cluster overview'},
            // {'path': '/async_migrations', 'text': 'Async migrations'},
            // {'path': '/errors', 'text': 'Errors'},
];


const drawerWidth = 240;

export default function PermanentDrawerLeft(): JSX.Element {
  const [page, setPage] = useState('Home')
  const history = useHistory()

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#ffb200' }}}>
    <Layout style={{ minHeight: '100vh' }}>
      <Sider >
        <div >
          <h1 style={{fontSize: 20, color: '#ffb200', textAlign: 'center', fontFamily: 'sans-serif' }}>HouseWatch</h1>
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
      </Sider>
      <Layout className="site-layout">
        <Content style={{ margin: '0 16px' }}>
        <Switch>
          <Route exact path="/" component={AllQueryGraphs}>
            {/* Welcome to HouseWatch */}
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
        <Footer style={{ textAlign: 'center' }}>Ant Design ©2023 Created by Ant UED</Footer>
      </Layout>
    </Layout>
    </ConfigProvider>
    // <div>
    //   <CssBaseline />
    //   <AppBar
    //     position='absolute'
    //     sx={{ width: `calc(100% - ${drawerWidth}px)`, height: '100%', backgroundColor: '#f4f5ed', color: 'black' }}
    //   >
    //     <Toolbar sx={{ backgroundColor: '#151515', color: '#f4f5ed', position: 'fixed', width: '100%', zIndex: 10 }}>
    //       <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 700 }}>
    //         HouseWatch
    //       </Typography>
    //     </Toolbar>
    //     <div style={{padding: 12, backgroundColor: '#f4f5ed', marginTop: 75 }}>
        // <Switch>
        //   <Route exact path="/" component={AllQueryGraphs}>
        //     {/* Welcome to HouseWatch */}
        //   </Route>
        //   <Route exact path="/cluster_overview">
        //     <PageCacheHits />
        //   </Route>
        //   <Route exact path="/slow_queries" component={SlowQueries}>
        //   </Route>
        //   <Route exact path="/schema" component={Schema}>
        //   </Route>
        //   <Route exact path="/schema/:table" component={SchemaTable}>
        //   </Route>

        //   <Route exact path="/query/:query_hash" component={QueryDetail}>
        //   </Route>
        //   <Route exact path="/async_migrations" component={AsyncMigrations}>
        //   </Route>
        //   <Route exact path="/running_queries" component={RunningQueries}>
        //   </Route>
        //   <Route exact path="/errors" component={Errors}>
        //   </Route>
        // </Switch>
    //     </div>
    //   </AppBar>
    //   <Drawer
    //     sx={{
    //       width: drawerWidth,
    //       flexShrink: 0,
    //       '& .MuiDrawer-paper': {
    //         width: drawerWidth,
    //         boxSizing: 'border-box',
    //         backgroundColor: "#f4f5ed"
    //       },
    //     }}
    //     variant="permanent"
    //     anchor="left"
    //   >
    //     <Toolbar sx={{backgroundColor: '#151515'}}/>
    //     {/* <Divider /> */}
    //     <List sx={{ color: "black" }}>
    //       {[
    //         {'path': '/', 'text': 'Home'},
    //         {'path': '/slow_queries', 'text': 'Slow queries'},
    //         {'path': '/running_queries', 'text': 'Running queries'},
    //         {'path': '/schema', 'text': 'Table sizes'},
    //         {'path': '/cluster_overview', 'text': 'Cluster overview'},
    //         {'path': '/async_migrations', 'text': 'Async migrations'},
    //         {'path': '/errors', 'text': 'Errors'},
    //     ].map((item, index) => (
    //         <ListItem key={item.text} disablePadding>
    //           <ListItemButton onClick={() => history.push({pathname: item.path})} selected={false}>
    //             <ListItemIcon>
    //               {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
    //             </ListItemIcon>
    //             <ListItemText disableTypography primary={item.text} />
    //           </ListItemButton>
    //         </ListItem>
    //       ))}
    //     </List>
    //   </Drawer>

    //   <Toolbar />
    // </div>
  );
}