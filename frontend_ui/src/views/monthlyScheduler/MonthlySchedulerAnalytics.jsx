// src/views/monthlyScheduler/MonthlySchedulerAnalytics.jsx
// ✅ Monthly Scheduler Analytics with FILTERS - COMPLETE WORKING VERSION

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Button, Box, Chip, Grid, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Skeleton, Alert, IconButton, Tooltip, Avatar,
    alpha, useTheme, Tab, Tabs, Badge, Stack, Divider, TablePagination,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Select, FormControl, InputLabel
} from '@mui/material';
import {
    Analytics as AnalyticsIcon, ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon, Warning as WarningIcon,
    Schedule as ScheduleIcon, Refresh as RefreshIcon,
    FileDownload as FileDownloadIcon, Person as PersonIcon,
    TrendingUp as TrendingUpIcon, BusinessCenter as BusinessCenterIcon,
    Error as ErrorIcon, PendingActions as PendingIcon, FilterList as FilterListIcon
} from '@mui/icons-material';
import { fetchByIdAction, addAction } from '../../StoreRedux/actions/commonActions';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import Swal from 'sweetalert2';

const MonthlySchedulerAnalytics = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const { schedulerId } = useParams();

    // ============================================================================
    // ACCESS CONTROL
    // ============================================================================
    const currentUser = useSelector(state => state?.auth?.user);
    const employeeId = currentUser?.id || sessionStorage.getItem('employee_id');
    const isSuperAdmin = employeeId === '12345';

    // ============================================================================
    // REDUX STATE
    // ============================================================================
    const analyticsState = useSelector(state => {
        const monthlyScheduler = state?.dataService?.pages?.monthly_scheduler;
        const analyticsData = monthlyScheduler?.data?.GetAnalytics;
        
        return {
            analytics: analyticsData?.summary || null,
            details: analyticsData?.details || [],
            scheduler: analyticsData?.scheduler || null,
            loading: monthlyScheduler?.loading?.analyticsLoad || false,
            refreshLoading: monthlyScheduler?.loading?.refreshAnalyticsLoad || false,
            AddSuccess: state?.dataService?.AddSuccess,
            message: state?.dataService?.message,
            error: state?.dataService?.error
        };
    });

    const { analytics, details, scheduler, loading, refreshLoading } = analyticsState;

    // ============================================================================
    // LOCAL STATE
    // ============================================================================
    const [selectedTab, setSelectedTab] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        department: '',
        searchQuery: ''
    });

    // ============================================================================
    // FILTERED DATA
    // ============================================================================
    const filteredDetails = useMemo(() => {
        if (!details || details.length === 0) return [];

        let filtered = details;

        // Filter by tab
        switch (selectedTab) {
            case 1: filtered = filtered.filter(d => d.msa_status === 'Not_Started'); break;
            case 2: filtered = filtered.filter(d => d.msa_status === 'Pending'); break;
            case 3: filtered = filtered.filter(d => d.msa_status === 'Completed'); break;
            default: break;
        }

        // Apply additional filters
        if (filters.status) {
            filtered = filtered.filter(d => d.msa_status === filters.status);
        }

        if (filters.department) {
            filtered = filtered.filter(d => 
                d.emp_dept?.toLowerCase().includes(filters.department.toLowerCase())
            );
        }

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(d => 
                d.emp_name?.toLowerCase().includes(query) ||
                d.msa_user_id?.toLowerCase().includes(query) ||
                d.emp_pos?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [details, selectedTab, filters]);

    // Paginated data
    const paginatedDetails = useMemo(() => {
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredDetails.slice(start, end);
    }, [filteredDetails, page, rowsPerPage]);

    const tabCounts = useMemo(() => {
        if (!analytics) return { all: 0, notStarted: 0, pending: 0, completed: 0 };

        return {
            all: analytics.total_users || 0,
            notStarted: analytics.not_started || 0,
            pending: analytics.pending || 0,
            completed: analytics.completed || 0
        };
    }, [analytics]);

    // Get unique departments for filter
    const departments = useMemo(() => {
        if (!details) return [];
        const depts = [...new Set(details.map(d => d.emp_dept).filter(Boolean))];
        return depts.sort();
    }, [details]);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        if (!isSuperAdmin) {
            navigate('/dashboard');
            return;
        }

        if (!schedulerId) {
            navigate('/monthly-scheduler');
            return;
        }

        // Fetch analytics with filters
        dispatch(setLoading('monthly_scheduler', 'analyticsLoad', true));
        const filterQuery = encodeURIComponent(JSON.stringify({ 
            schedulerId: parseInt(schedulerId),
            ...filters 
        }));
        dispatch(fetchByIdAction(
            'application/json',
            'monthly_scheduler',
            'GetAnalytics',
            'analyticsLoad',
            filterQuery
        ));
    }, [dispatch, schedulerId, refreshTrigger, navigate, isSuperAdmin, filters]);

    useEffect(() => {
        if (analyticsState.AddSuccess && analyticsState.message) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: analyticsState.message,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            
            if (analyticsState.message.includes('refreshed')) {
                setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 500);
            }
        }

        if (analyticsState.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: analyticsState.error,
                confirmButtonColor: theme.palette.error.main
            });
        }
    }, [analyticsState.AddSuccess, analyticsState.error, analyticsState.message, theme]);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleRefresh = useCallback(() => {
        Swal.fire({
            title: 'Refresh Analytics?',
            text: 'This will recalculate all statistics based on latest data',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: theme.palette.info.main,
            confirmButtonText: 'Yes, Refresh',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(setLoading('monthly_scheduler', 'refreshAnalyticsLoad', true));
                dispatch(addAction(
                    'application/json',
                    'monthly_scheduler',
                    'RefreshAnalytics',
                    'refreshAnalyticsLoad',
                    { schedulerId: parseInt(schedulerId) }
                ));
            }
        });
    }, [dispatch, schedulerId, theme]);

    const handleExport = useCallback(() => {
        if (!details || details.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No analytics data available to export',
                confirmButtonColor: theme.palette.warning.main
            });
            return;
        }

        const csvContent = [
            ['Employee ID', 'Name', 'Position', 'Department', 'Total Sub Goals', 'Updated Goals', 'Status', 'Completion %', 'Last Update'],
            ...filteredDetails.map(d => [
                d.msa_user_id || 'N/A',
                d.emp_name || 'N/A',
                d.emp_pos || 'N/A',
                d.emp_dept || 'N/A',
                d.msa_total_goals || 0,
                d.msa_updated_goals || 0,
                d.msa_status || 'N/A',
                d.msa_completion_percentage || 0,
                d.msa_last_update_at ? new Date(d.msa_last_update_at).toLocaleDateString() : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monthly-analytics-${scheduler?.msc_month || 'unknown'}-${scheduler?.msc_year || 'unknown'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: `${filteredDetails.length} records exported successfully`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }, [details, filteredDetails, scheduler, theme]);

    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(0);
    }, []);

    const handleApplyFilters = useCallback(() => {
        setFilterDialogOpen(false);
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            status: '',
            department: '',
            searchQuery: ''
        });
        setFilterDialogOpen(false);
        setPage(0);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Pending': return 'warning';
            case 'Not_Started': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return <CheckCircleIcon />;
            case 'Pending': return <PendingIcon />;
            case 'Not_Started': return <ErrorIcon />;
            default: return null;
        }
    };

    const formatStatus = (status) => {
        return status?.replace('_', ' ') || 'Unknown';
    };

    // ============================================================================
    // RENDER
    // ============================================================================
    if (!isSuperAdmin) {
        return null;
    }

    if (loading && !analytics) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Container>
        );
    }

    if (!analytics && !loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    No analytics data available. Please refresh or go back.
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/monthly-scheduler')}
                >
                    Back to Scheduler
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
            {/* HEADER */}
            <Paper elevation={3} sx={{
                p: 3, mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'white',
                borderRadius: 2
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton onClick={() => navigate('/monthly-scheduler')} sx={{ color: 'white' }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                            <AnalyticsIcon sx={{ fontSize: 36 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="700">
                                Monthly Analytics Dashboard
                            </Typography>
                            {scheduler && (
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {new Date(scheduler.year, scheduler.month - 1).toLocaleDateString('default', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Refresh Analytics">
                            <IconButton 
                                onClick={handleRefresh} 
                                sx={{ color: 'white' }}
                                disabled={refreshLoading}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export to CSV">
                            <IconButton 
                                onClick={handleExport} 
                                sx={{ color: 'white' }}
                                disabled={!details || details.length === 0}
                            >
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
            </Paper>

            {/* SUMMARY CARDS */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderLeft: `4px solid ${theme.palette.primary.main}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Total Users
                                    </Typography>
                                    <Typography variant="h3" fontWeight="700" color="primary.main">
                                        {analytics?.total_users || 0}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                                    <PersonIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderLeft: `4px solid ${theme.palette.success.main}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Completed
                                    </Typography>
                                    <Typography variant="h3" fontWeight="700" color="success.main">
                                        {analytics?.completed || 0}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        borderLeft: `4px solid ${theme.palette.warning.main}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Pending
                                    </Typography>
                                    <Typography variant="h3" fontWeight="700" color="warning.main">
                                        {analytics?.pending || 0}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                                    <PendingIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ 
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        borderLeft: `4px solid ${theme.palette.error.main}`
                    }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Not Started
                                    </Typography>
                                    <Typography variant="h3" fontWeight="700" color="error.main">
                                        {analytics?.not_started || 0}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                                    <ErrorIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* OVERALL PROGRESS */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight="600">
                        Overall Progress
                    </Typography>
                    <Chip 
                        label={`${analytics?.average_completion || 0}% Complete`}
                        color="primary"
                        sx={{ fontWeight: 600 }}
                    />
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(analytics?.average_completion || 0)} 
                    sx={{ 
                        height: 12, 
                        borderRadius: 6,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`
                        }
                    }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                        {analytics?.completed || 0} of {analytics?.total_users || 0} users completed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {analytics?.not_started || 0} not started
                    </Typography>
                </Box>
            </Paper>

            {/* DETAILED TABLE */}
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                    <Tabs 
                        value={selectedTab} 
                        onChange={(e, newValue) => {
                            setSelectedTab(newValue);
                            setPage(0);
                        }}
                    >
                        <Tab 
                            label={
                                <Badge badgeContent={tabCounts.all} color="primary" max={999}>
                                    All
                                </Badge>
                            } 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={tabCounts.notStarted} color="error" max={999}>
                                    Not Started
                                </Badge>
                            } 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={tabCounts.pending} color="warning" max={999}>
                                    Pending
                                </Badge>
                            } 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={tabCounts.completed} color="success" max={999}>
                                    Completed
                                </Badge>
                            } 
                        />
                    </Tabs>
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => setFilterDialogOpen(true)}
                        size="small"
                    >
                        Filter
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                <TableCell sx={{ fontWeight: 700 }}>EMPLOYEE ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>NAME</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>POSITION</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>DEPARTMENT</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>GOALS</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>COMPLETION</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedDetails.length > 0 ? (
                                paginatedDetails.map((detail, index) => (
                                    <TableRow key={detail.msa_user_id || index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">
                                                {detail.msa_user_id || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                    {detail.emp_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {detail.emp_name || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {detail.emp_pos || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {detail.emp_dept || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" fontWeight="600">
                                                {detail.msa_updated_goals || 0} / {detail.msa_total_goals || 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Chip
                                                icon={getStatusIcon(detail.msa_status)}
                                                label={formatStatus(detail.msa_status)}
                                                color={getStatusColor(detail.msa_status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="600" color="primary">
                                                    {detail.msa_completion_percentage || 0}%
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={detail.msa_completion_percentage || 0}
                                                    sx={{ 
                                                        mt: 0.5, 
                                                        height: 6, 
                                                        borderRadius: 3,
                                                        width: 80,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No data available
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedTab === 0 
                                                ? 'No analytics data found for this period'
                                                : `No users in ${formatStatus(
                                                    selectedTab === 1 ? 'Not_Started' : 
                                                    selectedTab === 2 ? 'Pending' : 'Completed'
                                                )} status`
                                            }
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINATION */}
                {filteredDetails.length > 0 && (
                    <TablePagination
                        component="div"
                        count={filteredDetails.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    />
                )}
            </Paper>

            {/* FILTER DIALOG */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Filter Analytics</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Search"
                            placeholder="Search by name, ID, or position"
                            value={filters.searchQuery}
                            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Not_Started">Not Started</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={filters.department}
                                label="Department"
                                onChange={(e) => handleFilterChange('department', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {departments.map(dept => (
                                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClearFilters}>Clear</Button>
                    <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleApplyFilters}>Apply Filters</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MonthlySchedulerAnalytics;