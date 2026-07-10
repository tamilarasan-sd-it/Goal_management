import * as React from 'react';
import { Skeleton, Box, Stack } from '@mui/material';

const TableLoader = ({ rows = 5 }) => {
    return (
        <Stack spacing={1} sx={{ width: '100%', p: 2 }}>
            {[...Array(rows)].map((_, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="80%" height={20} />
                        <Skeleton variant="text" width="50%" height={20} />
                    </Box>
                    <Skeleton variant="rounded" width={80} height={30} />
                </Box>
            ))}
        </Stack>
    );
};

export default TableLoader;
