// src/views/monthlyUpdates/EmployeeDetailsView.jsx
// ✅ IMPROVED: Admin drill-down view for individual employee's monthly updates

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Button, Box, Chip, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Avatar, alpha, useTheme, Grid, Card, CardContent,
    IconButton, Divider
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon, Person as PersonIcon,
    Lock as LockIcon, Assignment as AssignmentIcon
} from '@mui/icons-material';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction } from '../../StoreRedux/actions/commonActions';

// ============================================================================
// REDUX SELECTOR
// ============================================================================
const getEmployeeDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const page = pages?.monthly_updates;  // ✅ Changed from monthly_update_report
        return {
            loading: page?.loading || {},
            data: page?.data || {}
        };
    }
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const EmployeeDetailsView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const { employeeId, month, year } = useParams();

    const employeeDetails = useSelector(getEmployeeDetails);
    const goalsData = employeeDetails.data.EmployeeDetailsData || [];

    // ============================================================================
    // EFFECT: LOAD DATA
    // ============================================================================
    useEffect(() => {
        if (employeeId && month && year) {
            console.log('🔍 Fetching employee details for:', employeeId, month, year);
            dispatch(setLoading('monthly_updates', 'employeeDetailsLoad', true));
            dispatch(fetchByIdAction(
                'application/json',
                'monthly_updates',  // ✅ Using underscore
                'EmployeeDetailsData',
                'employeeDetailsLoad',
                `${employeeId}/${month}/${year}`
            ));
        }
    }, [dispatch, employeeId, month, year]);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const employeeInfo = goalsData.length > 0 ? {
        name: goalsData[0].emp_name || 'Unknown',
        id: employeeId,
        position: goalsData[0].emp_pos || 'N/A',
        department: goalsData[0].dept_name || 'N/A'
    } : null;

    const isLocked = goalsData.some(goal => goal.mu_is_locked === 1);

    const stats = {
        totalGoals: goalsData.length,
        updatedGoals: goalsData.filter(g => g.mu_pid !== null).length,
        avgCompletion: goalsData.length > 0
            ? (goalsData.reduce((sum, g) => sum + parseFloat(g.mu_completed_weightage || 0), 0) / goalsData.length).toFixed(1)
            : 0
    };

    // ============================================================================
    // HELPERS
    // ============================================================================
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'info';
            case 'Blocked': return 'error';
            default: return 'default';
        }
    };

    const getDetailValue = (detailsArray, columnName) => {
        if (!detailsArray || !Array.isArray(detailsArray)) return '-';
        const detail = detailsArray.find(d => d.column_name === columnName);
        return detail?.value || '-';
    };

    // ============================================================================
    // LOADING STATE
    // ============================================================================
    if (employeeDetails.loading.employeeDetailsLoad) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={150} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Container>
        );
    }

    // ============================================================================
    // MAIN RENDER
    // ============================================================================
    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
            {/* HEADER */}
            <Paper
                elevation={3}
                sx={{
                    p: 3, mb: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    borderRadius: 2
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton
                            onClick={() => navigate(-1)}
                            sx={{ 
                                color: 'white', 
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <PersonIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="700" sx={{ color: 'white' }}>
                                {employeeInfo?.name || 'Employee Details'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                                Monthly Updates for {new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'long' })} {year}
                            </Typography>
                        </Box>
                    </Box>

                    {isLocked && (
                        <Chip
                            icon={<LockIcon sx={{ color: 'white !important' }} />}
                            label="Submitted"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                px: 1
                            }}
                        />
                    )}
                </Box>
            </Paper>

            {/* EMPLOYEE INFO & STATS */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="600">
                                Employee Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                                    <Typography variant="body1" fontWeight="600">{employeeInfo?.id}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Position</Typography>
                                    <Typography variant="body1" fontWeight="600">{employeeInfo?.position}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Department</Typography>
                                    <Typography variant="body1" fontWeight="600">{employeeInfo?.department}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Period</Typography>
                                    <Typography variant="body1" fontWeight="600">
                                        {new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'long' })} {year}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="600">
                                Progress Statistics
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Goals Progress</Typography>
                                    <Typography variant="h5" fontWeight="700" color="primary">
                                        {stats.updatedGoals}/{stats.totalGoals}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Avg Completion</Typography>
                                    <Typography variant="h5" fontWeight="700" color="success.main">
                                        {stats.avgCompletion}%
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* GOALS DETAILS TABLE */}
            <TableContainer
                component={Paper}
                elevation={2}
                sx={{
                    maxHeight: 600,
                    borderRadius: 2,
                    border: `2px solid ${theme.palette.divider}`
                }}
            >
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main', width: 50 }}>#</TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>CATEGORY</TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main', minWidth: 250 }}>GOAL DESCRIPTION</TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>WEIGHTAGE</TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>STATUS</TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>COMPLETION</TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main', minWidth: 300 }}>MONTHLY NOTES</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {goalsData.length > 0 ? (
                            goalsData.map((goal, index) => (
                                <TableRow
                                    key={goal.tg_pid}
                                    sx={{
                                        '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: '700' }}>{index + 1}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={goal.tc_category_name}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {getDetailValue(goal.goal_details, 'Goal Description')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${goal.tg_goal_weightage}%`}
                                            size="small"
                                            sx={{ fontWeight: '700' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={goal.mu_status || 'Not Started'}
                                            size="small"
                                            color={getStatusColor(goal.mu_status)}
                                            sx={{ fontWeight: '600' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${parseFloat(goal.mu_completed_weightage || 0).toFixed(1)}%`}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                            sx={{ fontWeight: '700' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                            {getDetailValue(goal.update_details, 'Monthly Notes') || 
                                             (goal.mu_pid ? 'No notes provided' : 'Not yet updated')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                                    <AssignmentIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
                                    <Typography variant="h6" fontWeight="600" color="text.secondary">
                                        No Goals Found
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        No goals data available for this employee
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* FOOTER */}
            <Paper elevation={2} sx={{ p: 2, mt: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Typography variant="body2" color="text.secondary">
                        Total Sub Goals: <strong>{stats.totalGoals}</strong> | 
                        Updated: <strong>{stats.updatedGoals}</strong> | 
                        Pending: <strong>{stats.totalGoals - stats.updatedGoals}</strong>
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                    >
                        Back to Report
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default EmployeeDetailsView;