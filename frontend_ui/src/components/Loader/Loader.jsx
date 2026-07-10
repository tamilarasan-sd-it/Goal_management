import React from 'react';
import { Box, CircularProgress } from '@mui/material';

// project import
// import Progress from './Progress';

// ==============================|| LOADER ||============================== //

const Loader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 2001
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  );
};

export default Loader;
