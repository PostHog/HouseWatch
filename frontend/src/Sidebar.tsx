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
import SchemaTable from './SchemaTable';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useHistory

  } from "react-router-dom";

import { AsyncMigrations } from './AsyncMigrations';

const drawerWidth = 240;

export default function PermanentDrawerLeft(): JSX.Element {
  const [page, setPage] = useState('Home')
  const history = useHistory()

  return (
    <div>
      <CssBaseline />
      <AppBar
        position='absolute'
        sx={{ width: `calc(100% - ${drawerWidth}px)`, backgroundColor: 'white', color: 'black' }}
      >
        <Toolbar sx={{backgroundColor: '#151515', color: 'white'}}>
          <Typography variant="h5" noWrap component="div" sx={{fontWeight: 700}}>
            HouseWatch
          </Typography>
        </Toolbar>
        <div>
        <Switch>
          <Route exact path="/">
            Welcome to HouseWatch
          </Route>
          <Route exact path="/page_cache">
            <PageCacheHits />
          </Route>
          <Route exact path="/slow_queries" component={SlowQueries}>
          </Route>
          <Route exact path="/schema" component={Schema}>
          </Route>
          <Route exact path="/schema/:table" component={SchemaTable}>
          </Route>
            <Route exact path="/async_migrations" component={AsyncMigrations}>
          </Route>
        </Switch>
        </div>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <Divider />
        <List>
          {[
            {'path': '/', 'text': 'Home'},
            {'path': '/slow_queries', 'text': 'Slow queries'},
            {'path': '/schema', 'text': 'Schema'},
            {'path': '/', 'text': 'Errors'},
            {'path': '/page_cache', 'text': 'Page cache hits'},
            {'path': '/async_migrations', 'text': 'Async Migrations'},
        ].map((item, index) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => history.push({pathname: item.path})} selected={false}>
                <ListItemIcon>
                  {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

        <Toolbar />
    </div> 
  );
}