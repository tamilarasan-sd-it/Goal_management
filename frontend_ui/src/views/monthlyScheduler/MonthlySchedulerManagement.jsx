// src/views/monthlyScheduler/MonthlySchedulerManagement.jsx
// ✅ SUPER ADMIN ONLY - Frontend-Controlled Monthly Scheduler with FILTERS

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Button, Box, Chip, Grid, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert,
    Stepper, Step, StepLabel, StepContent, IconButton, Tooltip, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    alpha, useTheme, Skeleton, Divider, Stack, TextField, MenuItem,
    Select, FormControl, InputLabel
} from '@mui/material';
import {
    Schedule as ScheduleIcon, Send as SendIcon, Analytics as AnalyticsIcon,
    Assessment as AssessmentIcon, Check as CheckIcon, Warning as WarningIcon,
    Notifications as NotificationsIcon, Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon, Lock as LockIcon,
    Visibility as VisibilityIcon, CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon, PlayArrow as PlayArrowIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { fetchByIdAction, addAction } from '../../StoreRedux/actions/commonActions';
import { setLoading } from '../../StoreRedux/constants/actionTypes';

const MonthlySchedulerManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();

    // ============================================================================
    // REDUX STATE
    // ============================================================================
    const schedulerState = useSelector(state => {
        const monthlyScheduler = state?.dataService?.pages?.monthly_scheduler;
        return {
            currentScheduler: monthlyScheduler?.data?.GetOrCreateScheduler || null,
            allSchedulers: monthlyScheduler?.data?.GetAllSchedulers || [],
            loading: monthlyScheduler?.loading || {},
            AddSuccess: state?.dataService?.AddSuccess,
            error: state?.dataService?.error,
            message: state?.dataService?.message
        };
    });

    const currentUser = useSelector(state => state?.auth?.user);
    const employeeId = currentUser?.id || sessionStorage.getItem('employee_id');
    const isSuperAdmin = employeeId === '12345';

    // ============================================================================
    // LOCAL STATE
    // ============================================================================
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        year: '',
        limit: 12
    });

    const { currentScheduler, allSchedulers, loading } = schedulerState;

    // ============================================================================
    // COMPUTED - Workflow Steps Status
    // ============================================================================
    const workflowSteps = useMemo(() => {
        if (!currentScheduler) return [];

        return [
            {
                label: 'Create Scheduler',
                description: `Initialize scheduler for ${selectedMonth}/${selectedYear}`,
                completed: !!currentScheduler.msc_pid,
                action: null,
                icon: <ScheduleIcon />
            },
            {
                label: 'Send Initial Notifications (10th)',
                description: 'Notify all Goal Owners to submit updates',
                completed: currentScheduler.msc_notification_sent === 1,
                action: 'send_initial',
                icon: <NotificationsIcon />,
                canExecute: currentScheduler.msc_status === 'Pending' || currentScheduler.msc_status === 'Active'
            },
            {
                label: 'Goal Owners Submit (10th - 15th)',
                description: 'Goal owners update their progress',
                completed: currentScheduler.msc_status === 'Completed' || currentScheduler.msc_status === 'Closed',
                action: null,
                icon: <PlayArrowIcon />
            },
            {
                label: 'View Analytics (15th - 20th)',
                description: 'Review submission status and progress',
                completed: currentScheduler.msc_analytics_available === 1,
                action: 'view_analytics',
                icon: <AnalyticsIcon />,
                canExecute: true
            },
            {
                label: 'Generate Reports (21st)',
                description: 'Send final reports and close cycle',
                completed: currentScheduler.msc_reports_generated === 1,
                action: 'generate_reports',
                icon: <AssessmentIcon />,
                canExecute: currentScheduler.msc_status !== 'Closed'
            }
        ];
    }, [currentScheduler, selectedMonth, selectedYear]);

    const activeStep = useMemo(() => {
        const firstIncomplete = workflowSteps.findIndex(step => !step.completed);
        return firstIncomplete === -1 ? workflowSteps.length : firstIncomplete;
    }, [workflowSteps]);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        if (!isSuperAdmin) {
            navigate('/dashboard');
            return;
        }

        // Fetch current scheduler
        dispatch(setLoading('monthly_scheduler', 'schedulerLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'monthly_scheduler',
            'GetOrCreateScheduler',
            'schedulerLoad',
            `${selectedMonth}/${selectedYear}`
        ));

        // Fetch all schedulers with filters
        dispatch(setLoading('monthly_scheduler', 'schedulersLoad', true));
        const filterQuery = encodeURIComponent(JSON.stringify(filters));
        dispatch(fetchByIdAction(
            'application/json',
            'monthly_scheduler',
            'GetAllSchedulers',
            'schedulersLoad',
            filterQuery
        ));
    }, [dispatch, selectedMonth, selectedYear, refreshTrigger, isSuperAdmin, navigate, filters]);

    useEffect(() => {
        if (schedulerState.AddSuccess) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: schedulerState.message || 'Action completed successfully',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            setActionDialogOpen(false);
            setRefreshTrigger(prev => prev + 1);
        }

        if (schedulerState.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: schedulerState.error,
                confirmButtonColor: theme.palette.error.main
            });
        }
    }, [schedulerState.AddSuccess, schedulerState.error, schedulerState.message, theme]);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleActionClick = useCallback((action) => {
        setSelectedAction(action);
        setActionDialogOpen(true);
    }, []);

    const handleConfirmAction = useCallback(() => {
        if (!currentScheduler || !selectedAction) return;

        const schedulerId = currentScheduler.msc_pid;

        switch (selectedAction) {
            case 'send_initial':
                dispatch(setLoading('monthly_scheduler', 'sendNotificationsLoad', true));
                dispatch(addAction(
                    'application/json',
                    'monthly_scheduler',
                    'SendNotifications',
                    'sendNotificationsLoad',
                    { schedulerId, notificationType: 'Initial_Reminder' }
                ));
                break;

            case 'view_analytics':
                navigate(`/monthly-scheduler-analytics/${schedulerId}`);
                setActionDialogOpen(false);
                break;

            case 'generate_reports':
                dispatch(setLoading('monthly_scheduler', 'generateReportsLoad', true));
                dispatch(addAction(
                    'application/json',
                    'monthly_scheduler',
                    'GenerateReports',
                    'generateReportsLoad',
                    { schedulerId }
                ));
                break;

            default:
                break;
        }
    }, [currentScheduler, selectedAction, dispatch, navigate]);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        setFilterDialogOpen(false);
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            status: '',
            year: '',
            limit: 12
        });
        setFilterDialogOpen(false);
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleQuickAction = useCallback((action) => {
        if (!currentScheduler) return;

        const schedulerId = currentScheduler.msc_pid;

        switch (action) {
            case 'send_initial':
                Swal.fire({
                    title: 'Send Initial Reminder?',
                    text: 'This will send email notifications to all Goal Owners',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.primary.main,
                    confirmButtonText: 'Yes, Send Notifications'
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(setLoading('monthly_scheduler', 'sendNotificationsLoad', true));
                        dispatch(addAction(
                            'application/json',
                            'monthly_scheduler',
                            'SendNotifications',
                            'sendNotificationsLoad',
                            { schedulerId, notificationType: 'Initial_Reminder' }
                        ));
                    }
                });
                break;

            case 'view_analytics':
                navigate(`/monthly-scheduler-analytics/${schedulerId}`);
                break;

            case 'refresh_analytics':
                Swal.fire({
                    title: 'Refresh Analytics?',
                    text: 'This will recalculate all statistics',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.info.main,
                    confirmButtonText: 'Yes, Refresh'
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(setLoading('monthly_scheduler', 'refreshAnalyticsLoad', true));
                        dispatch(addAction(
                            'application/json',
                            'monthly_scheduler',
                            'RefreshAnalytics',
                            'refreshAnalyticsLoad',
                            { schedulerId }
                        ));
                    }
                });
                break;

            case 'generate_reports':
                Swal.fire({
                    title: 'Generate Reports?',
                    html: `
                        <p>This will:</p>
                        <ul style="text-align: left; padding-left: 20px;">
                            <li>Create final monthly reports</li>
                            <li>Send summary to admin</li>
                            <li>Mark cycle as CLOSED</li>
                            <li><strong>This action cannot be undone!</strong></li>
                        </ul>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.error.main,
                    confirmButtonText: 'Yes, Generate Reports'
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(setLoading('monthly_scheduler', 'generateReportsLoad', true));
                        dispatch(addAction(
                            'application/json',
                            'monthly_scheduler',
                            'GenerateReports',
                            'generateReportsLoad',
                            { schedulerId }
                        ));
                    }
                });
                break;

            default:
                break;
        }
    }, [currentScheduler, dispatch, navigate, theme]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'Active': return 'info';
            case 'Completed': return 'success';
            case 'Closed': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <WarningIcon />;
            case 'Active': return <PlayArrowIcon />;
            case 'Completed': return <CheckCircleIcon />;
            case 'Closed': return <LockIcon />;
            default: return null;
        }
    };

    const getActionButtonText = (action) => {
        const labels = {
            send_initial: 'Send Initial Notifications',
            view_analytics: 'View Analytics Dashboard',
            generate_reports: 'Generate & Send Reports'
        };
        return labels[action] || 'Execute Action';
    };

    // ============================================================================
    // RENDER
    // ============================================================================
    if (!isSuperAdmin) {
        return null;
    }

    if (loading.schedulerLoad && !currentScheduler) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
            {/* HEADER */}
            <Paper elevation={3} sx={{
                p: 3, mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                borderRadius: 2
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                            <ScheduleIcon sx={{ fontSize: 36 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="700">
                                Monthly Scheduler Management
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Frontend-controlled workflow for monthly goal updates
                            </Typography>
                        </Box>
                    </Box>
                    <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* CURRENT SCHEDULER STATUS */}
            {currentScheduler && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            height: '100%'
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <CalendarIcon color="primary" />
                                    <Typography variant="h6" fontWeight="600">Current Period</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="700" color="primary.main" gutterBottom>
                                    {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('default', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Typography>
                                <Chip
                                    icon={getStatusIcon(currentScheduler.msc_status)}
                                    label={currentScheduler.msc_status}
                                    color={getStatusColor(currentScheduler.msc_status)}
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <NotificationsIcon color="info" />
                                    <Typography variant="h6" fontWeight="600">Notifications</Typography>
                                </Box>
                                <Box>
                                    {currentScheduler.msc_notification_sent ? (
                                        <Box>
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Sent"
                                                color="success"
                                                sx={{ mb: 1 }}
                                            />
                                            {currentScheduler.msc_notification_sent_at && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {new Date(currentScheduler.msc_notification_sent_at).toLocaleDateString()}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Chip label="Not Sent" color="warning" />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <AssessmentIcon color="success" />
                                    <Typography variant="h6" fontWeight="600">Reports</Typography>
                                </Box>
                                <Box>
                                    {currentScheduler.msc_reports_generated ? (
                                        <Box>
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Generated"
                                                color="success"
                                                sx={{ mb: 1 }}
                                            />
                                            {currentScheduler.msc_reports_sent_at && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {new Date(currentScheduler.msc_reports_sent_at).toLocaleDateString()}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Chip label="Pending" color="default" />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* WORKFLOW STEPPER */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="primary" />
                    Monthly Workflow Progress
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Stepper activeStep={activeStep} orientation="vertical">
                    {workflowSteps.map((step, index) => (
                        <Step key={step.label} completed={step.completed}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Avatar
                                        sx={{
                                            bgcolor: step.completed
                                                ? theme.palette.success.main
                                                : index === activeStep
                                                ? theme.palette.primary.main
                                                : theme.palette.grey[400],
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        {step.completed ? <CheckIcon /> : step.icon}
                                    </Avatar>
                                )}
                            >
                                <Typography variant="h6" fontWeight="600">
                                    {step.label}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {step.description}
                                </Typography>
                                {step.action && step.canExecute && !step.completed && (
                                    <Button
                                        variant="contained"
                                        onClick={() => handleActionClick(step.action)}
                                        disabled={loading[step.action === 'view_analytics' ? 'analyticsLoad' : 'sendNotificationsLoad']}
                                        startIcon={step.icon}
                                    >
                                        {getActionButtonText(step.action)}
                                    </Button>
                                )}
                                {step.completed && (
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="Completed"
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* QUICK ACTIONS */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="600" gutterBottom>
                    Quick Actions
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {currentScheduler?.msc_notification_sent !== 1 && 
                     (currentScheduler?.msc_status === 'Pending' || currentScheduler?.msc_status === 'Active') && (
                        <Grid item xs={12} md={6}>
                            <Card 
                                sx={{ 
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6
                                    }
                                }}
                                onClick={() => handleQuickAction('send_initial')}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                                            <SendIcon />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="h6" fontWeight="600">
                                                Send Initial Reminder
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Notify all Goal Owners to submit monthly updates
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}
                            onClick={() => handleQuickAction('view_analytics')}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                                        <AnalyticsIcon />
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="h6" fontWeight="600">
                                            View Analytics Dashboard
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Review submission status and detailed analytics
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}
                            onClick={() => handleQuickAction('refresh_analytics')}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                                        <RefreshIcon />
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="h6" fontWeight="600">
                                            Refresh Analytics
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Recalculate statistics based on latest submissions
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {currentScheduler?.msc_reports_generated !== 1 && currentScheduler?.msc_status !== 'Closed' && (
                        <Grid item xs={12} md={6}>
                            <Card 
                                sx={{ 
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6
                                    }
                                }}
                                onClick={() => handleQuickAction('generate_reports')}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                                            <AssessmentIcon />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="h6" fontWeight="600">
                                                Generate Reports
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Create final reports and close the cycle
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* SCHEDULER HISTORY */}
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="600">
                        Recent Scheduler History
                    </Typography>
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
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>PERIOD</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>NOTIFICATIONS</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ANALYTICS</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>REPORTS</TableCell>
                                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allSchedulers.length > 0 ? (
                                allSchedulers.map((scheduler) => (
                                    <TableRow key={scheduler.msc_pid} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">
                                                {new Date(scheduler.msc_year, scheduler.msc_month - 1).toLocaleDateString('default', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getStatusIcon(scheduler.msc_status)}
                                                label={scheduler.msc_status}
                                                size="small"
                                                color={getStatusColor(scheduler.msc_status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {scheduler.msc_notification_sent ? (
                                                <Chip icon={<CheckIcon />} label="Sent" size="small" color="success" variant="outlined" />
                                            ) : (
                                                <Chip label="Pending" size="small" color="default" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {scheduler.completed_users || 0} / {scheduler.total_users || 0} completed
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {scheduler.msc_reports_generated ? (
                                                <Chip icon={<CheckIcon />} label="Generated" size="small" color="success" variant="outlined" />
                                            ) : (
                                                <Chip label="Pending" size="small" color="default" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Tooltip title="View Analytics">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/monthly-scheduler-analytics/${scheduler.msc_pid}`)}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No scheduler history available
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* FILTER DIALOG */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Filter Schedulers</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Closed">Closed</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={filters.year}
                                label="Year"
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {[2024, 2025, 2026].map(year => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Limit"
                            type="number"
                            value={filters.limit}
                            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 12)}
                            InputProps={{ inputProps: { min: 1, max: 100 } }}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClearFilters}>Clear</Button>
                    <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleApplyFilters}>Apply Filters</Button>
                </DialogActions>
            </Dialog>

            {/* ACTION CONFIRMATION DIALOG */}
            <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
                    Confirm Action
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedAction === 'send_initial' && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            This will send initial reminder notifications to all Goal Owners for {selectedMonth}/{selectedYear}.
                        </Alert>
                    )}
                    {selectedAction === 'generate_reports' && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            This will generate and send final reports, and mark this cycle as CLOSED. This action cannot be undone.
                        </Alert>
                    )}
                    <Typography variant="body1">
                        Are you sure you want to proceed with: <strong>{getActionButtonText(selectedAction)}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmAction}
                        disabled={loading.sendNotificationsLoad || loading.generateReportsLoad}
                    >
                        {loading.sendNotificationsLoad || loading.generateReportsLoad ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MonthlySchedulerManagement;