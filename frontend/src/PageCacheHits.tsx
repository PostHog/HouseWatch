import React from 'react'
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
                {/* <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Word of the Day
        </Typography>
        <Typography variant="h5" component="div">
          be{bull}nev{bull}o{bull}lent
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          adjective
        </Typography>
        <Typography variant="body2">
          well meaning and kindly.
          <br />
          {'"a benevolent smile"'}
        </Typography> */}
                <Typography variant="h5" sx={{fontWeight: 600}}>
                    {replica}
                </Typography>
                <Typography variant="h2" sx={{fontWeight: 700}}>
                    {percent}
                </Typography>
            </CardContent>
            {/* <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions> */}
        </Card>
    );
}

export function PageCacheHits(): JSX.Element {
    const pageCacheHitsPerReplica = [
        { replica: 'CH3', read_ratio: '99%' },
        { replica: 'CH4', read_ratio: '98%' },
        { replica: 'CH6', read_ratio: '75%' },
    ]
    return (
        <div style={{display: 'flex'}}>
            {pageCacheHitsPerReplica.map(perReplica => (
                <BasicCard replica={perReplica.replica} percent={perReplica.read_ratio} />
            ))}
        </div>
    )
}