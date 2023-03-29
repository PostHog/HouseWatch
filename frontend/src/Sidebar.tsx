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
import { AsyncMigrations } from './AsyncMigrations';
// import InboxIcon from '@mui/icons-material/MoveToInbox';
// import MailIcon from '@mui/icons-material/Mail';

const drawerWidth = 240;

export default function PermanentDrawerLeft(): JSX.Element {
  const [page, setPage] = useState('Home')

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, backgroundColor: 'white', color: 'black' }}
      >
        <Toolbar sx={{backgroundColor: '#151515', color: 'white'}}>
          <Typography variant="h5" noWrap component="div" sx={{fontWeight: 700}}>
            HouseWatch
          </Typography>
        </Toolbar>
        <div>
        {page === 'Page cache hits' && <PageCacheHits />}
        {page === 'Slow queries' && <SlowQueries />}
        {page === 'Async migrations' && <AsyncMigrations />}
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
          {['Home', 'Async migrations', 'Slow queries', 'Schema', 'Errors', 'Page cache hits'].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton onClick={() => setPage(text)} selected={page === text}>
                <ListItemIcon>
                  {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
      </Box>
    </Box>
  );
}