import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
    Container, Paper, Typography, Button, Box, IconButton, Chip,
    LinearProgress, Skeleton, Alert, TextField, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, useMediaQuery,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Tooltip, Avatar, alpha, useTheme, FormControl,
    InputLabel, Select, Stack, Card, CardContent, Grid, Collapse,
    Badge, Divider, InputAdornment, Zoom, Fade, TablePagination
} from '@mui/material';
import {
    Update as UpdateIcon, Send as SendIcon, Edit as EditIcon,
    Warning as WarningIcon, AccessTime as AccessTimeIcon,
    CalendarToday as CalendarTodayIcon, TrendingUp as TrendingUpIcon,
    Close as CloseIcon, Lock as LockIcon, LockOpen as LockOpenIcon,
    Refresh as RefreshIcon, FilterList as FilterListIcon,
    Timeline as TimelineIcon, Group as GroupIcon, Clear as ClearIcon,
    ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
    Search as SearchIcon, Description as DescriptionIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction, addAction } from '../../StoreRedux/actions/commonActions';

// ============================================================================
// REDUX SELECTOR
// ============================================================================
const getMonthlyUpdateDetails = createSelector(
    state => state?.dataService?.pages,
    state => state?.dataService,
    (pages, dataService) => {
        const page = pages?.monthly_updates;
        return {
            loading: page?.loading || {},
            data: page?.data || {},
            AddSuccess: dataService?.AddSuccess,
            error: dataService?.error,
            message: dataService?.message
        };
    }
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MonthlyUpdates = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const monthlyUpdateDetails = useSelector(getMonthlyUpdateDetails);
    const currentUser = useSelector(state => state?.auth?.user);
    const employeeId = currentUser?.id || sessionStorage.getItem('employee_id');

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentGoal, setCurrentGoal] = useState(null);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ✅ PAGINATION STATE
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // ✅ COMPREHENSIVE FILTERS
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('all');
    const [selectedTimeline, setSelectedTimeline] = useState('all');
    const [selectedTeamMember, setSelectedTeamMember] = useState('all');
    const [selectedContributor, setSelectedContributor] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ============================================================================
    // DATA EXTRACTION FROM REDUX
    // ============================================================================
    const goalsData = monthlyUpdateDetails.data.MonthlyGoalsData || [];

    // ============================================================================
    // EXTRACT UNIQUE FILTER OPTIONS FROM goal_responsible_members
    // ============================================================================
    const filterOptions = useMemo(() => {
        const templates = new Set();
        const timelines = new Set();
        const teamMembers = new Set(); // Owners
        const contributors = new Set(); // Contributors + Viewers

        console.log('📊 Extracting filter options from', goalsData.length, 'goals');

        goalsData.forEach(goal => {
            // Template
            if (goal.template_name) {
                templates.add(`${goal.template_name} (${goal.template_year})`);
            }

            // Timeline
            if (goal.tg_timeline) {
                timelines.add(goal.tg_timeline);
            }

            // ✅ Extract from goal_responsible_members (new structure)
            if (goal.responsible_members && Array.isArray(goal.responsible_members)) {
                goal.responsible_members.forEach(member => {
                    if (member.grm_is_active === 1) {
                        // Extract employee name
                        const memberName = member.emp_name || member.grm_employee_id;

                        if (member.grm_role === 'Owner') {
                            teamMembers.add(memberName);
                        } else if (member.grm_role === 'Contributor' || member.grm_role === 'Viewer') {
                            contributors.add(memberName);
                        }
                    }
                });
            }
        });

        console.log('✅ Filter options extracted:', {
            templates: templates.size,
            timelines: timelines.size,
            teamMembers: teamMembers.size,
            contributors: contributors.size
        });

        if (teamMembers.size > 0) {
            console.log('👥 Owners found:', Array.from(teamMembers));
        }

        if (contributors.size > 0) {
            console.log('👥 Contributors/Viewers found:', Array.from(contributors));
        }

        return {
            templates: Array.from(templates).sort(),
            timelines: Array.from(timelines).sort(),
            teamMembers: Array.from(teamMembers).sort(),
            contributors: Array.from(contributors).sort()
        };
    }, [goalsData]);

    // ============================================================================
    // FILTERED GOALS
    // ============================================================================
    const filteredGoals = useMemo(() => {
        let filtered = [...goalsData];

        // ✅ Filter by current year by default (if no other filters applied)
        if (selectedTemplate === 'all' &&
            selectedTimeline === 'all' &&
            selectedTeamMember === 'all' &&
            selectedContributor === 'all' &&
            !searchQuery.trim()) {
            filtered = filtered.filter(goal => goal.template_year === currentYear);
        }

        // Filter by template
        if (selectedTemplate !== 'all') {
            filtered = filtered.filter(goal =>
                `${goal.template_name} (${goal.template_year})` === selectedTemplate
            );
        }

        // Filter by timeline
        if (selectedTimeline !== 'all') {
            filtered = filtered.filter(goal => goal.tg_timeline === selectedTimeline);
        }

        // ✅ Filter by team member (Owner)
        if (selectedTeamMember !== 'all') {
            filtered = filtered.filter(goal => {
                if (!goal.responsible_members) return false;
                return goal.responsible_members.some(member =>
                    member.grm_is_active === 1 &&
                    member.grm_role === 'Owner' &&
                    (member.emp_name === selectedTeamMember || member.grm_employee_id === selectedTeamMember)
                );
            });
        }

        // ✅ Filter by contributor (Contributor or Viewer)
        if (selectedContributor !== 'all') {
            filtered = filtered.filter(goal => {
                if (!goal.responsible_members) return false;
                return goal.responsible_members.some(member =>
                    member.grm_is_active === 1 &&
                    (member.grm_role === 'Contributor' || member.grm_role === 'Viewer') &&
                    (member.emp_name === selectedContributor || member.grm_employee_id === selectedContributor)
                );
            });
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(goal => {
                const description = getGoalColumnValue(goal, 'Goal Description').toLowerCase();
                const category = goal.category_name?.toLowerCase() || '';
                return description.includes(query) || category.includes(query);
            });
        }

        return filtered;
    }, [goalsData, selectedTemplate, selectedTimeline, selectedTeamMember,
        selectedContributor, searchQuery, currentYear]);

    // ✅ PAGINATED GOALS
    const paginatedGoals = useMemo(() => {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredGoals.slice(startIndex, endIndex);
    }, [filteredGoals, page, rowsPerPage]);

    console.log(paginatedGoals, "paginatedGoals")

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const isLocked = useMemo(() => {
        if (goalsData.length === 0) return false;
        return goalsData.some(goal => goal.mu_is_locked === 1);
    }, [goalsData]);

    const updatedGoalsCount = useMemo(() => {
        return filteredGoals.filter(goal => goal.mu_pid !== null).length;
    }, [filteredGoals]);

    const totalCompletion = useMemo(() => {
        if (filteredGoals.length === 0) return 0;

        // Calculate average of all mu_completed_weightage values
        const total = filteredGoals.reduce((sum, goal) => {
            return sum + (parseFloat(goal.mu_completed_weightage) || 0);
        }, 0);

        // Return average (total divided by number of goals)
        return total / filteredGoals.length;
    }, [filteredGoals]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedTemplate !== 'all') count++;
        if (selectedTimeline !== 'all') count++;
        if (selectedTeamMember !== 'all') count++;
        if (selectedContributor !== 'all') count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedTemplate, selectedTimeline, selectedTeamMember,
        selectedContributor, searchQuery]);

    const isDueSoon = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const dayOfMonth = today.getDate();

        return selectedMonth === currentMonth &&
            selectedYear === currentYear &&
            dayOfMonth >= 10 &&
            dayOfMonth <= 15;
    }, [selectedMonth, selectedYear]);

    // ============================================================================
    // EFFECT: LOAD DATA
    // ============================================================================
    useEffect(() => {
        console.log('Fetching monthly goalsFetching monthly goalsFetching monthly goalsFetching monthly goalsFetching monthly goals:', { employeeId, selectedMonth, selectedYear });
        if (employeeId && selectedMonth && selectedYear) {

            dispatch(setLoading('monthly_updates', 'monthlyGoalsLoad', true));
            dispatch(fetchByIdAction(
                'application/json',
                'monthly_updates',
                'MonthlyGoalsData',
                'monthlyGoalsLoad',
                `${employeeId}/${selectedMonth}/${selectedYear}`
            ));
        }
    }, [dispatch, employeeId, selectedMonth, selectedYear, refreshTrigger]);

    // ✅ RESET PAGE WHEN FILTERS CHANGE
    useEffect(() => {
        setPage(0);
    }, [selectedTemplate, selectedTimeline, selectedTeamMember, selectedContributor, searchQuery]);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setSelectedTemplate('all');
        setSelectedTimeline('all');
        setSelectedTeamMember('all');
        setSelectedContributor('all');
        setSearchQuery('');
    }, []);

    // ✅ PAGINATION HANDLERS
    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const handleOpenDialog = useCallback((goal) => {
        setCurrentGoal(goal);
        setFormErrors({});

        const initialFormData = {
            mu_status: goal.update_status || goal.mu_status || 'Not Started',
            mu_completed_weightage: parseFloat(goal.mu_completed_weightage) || 0,
            mu_monthly_notes: goal.mu_monthly_notes || ''
        };

        if (goal.update_data && Array.isArray(goal.update_data)) {
            goal.update_data.forEach(data => {
                initialFormData[`column_${data.mud_column_id}`] = data.mud_value;
            });
        }

        setFormData(initialFormData);
        setDialogOpen(true);
    }, []);

    const handleSaveUpdate = () => {
        if (!currentGoal) return;

        const errors = {};

        // Validation
        if (!formData.mu_status) {
            errors.mu_status = 'Status is required';
        }

        if (
            formData.mu_status === 'In Progress' ||
            formData.mu_status === 'Completed'
        ) {
            if (
                formData.mu_completed_weightage === undefined ||
                formData.mu_completed_weightage === '' ||
                formData.mu_completed_weightage === null
            ) {
                errors.mu_completed_weightage = 'Completion percentage is required';
            }
        }

        const weightage = parseFloat(formData.mu_completed_weightage);

        if (weightage === 100 && formData.mu_status !== "Completed") {
            errors.mu_status = 'Status must be "Completed" when completion is 100%';
        }

        if (weightage < 100 && formData.mu_status === "Completed") {
            errors.mu_status = 'Status cannot be "Completed" unless completion is 100%';
        }

        const notesColumn = currentGoal.goal_data?.find(
            d => d.column_name === 'Monthly Notes'
        );

        if (notesColumn) {
            const notesValue = formData[`column_${notesColumn.tgd_column_id}`];
            if (!notesValue || notesValue.trim() === '') {
                errors.notes = 'Monthly notes are required';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const updateColumns =
            currentGoal.goal_data?.filter(
                d =>
                    d.column_name === 'Monthly Status' ||
                    d.column_name === 'Monthly Notes' ||
                    d.column_name === 'Monthly Work Percentage'
            ) || [];

        const updateDataArray = updateColumns.map(column => {
            if (column?.column_name == 'Monthly Work Percentage') {
                return {
                    column_id: column.tgd_column_id,
                    value: (formData.mu_completed_weightage || '').toString()
                };
            }
            if (column?.column_name == 'Monthly Status') {
                return {
                    column_id: column.tgd_column_id,
                    value: (formData.mu_status).toString()
                };
            }

            return {
                column_id: column.tgd_column_id,
                value: (formData[`column_${column.tgd_column_id}`] || '').toString()
            };
        });

        const updatePayload = {
            mu_goal_id: currentGoal.tg_pid,
            mu_month: selectedMonth,
            mu_year: selectedYear,
            mu_status: formData.mu_status,
            mu_completed_weightage: parseFloat(formData.mu_completed_weightage) || 0,
            mu_monthly_notes: formData.mu_monthly_notes,
            mu_updated_by: employeeId,
            update_data: updateDataArray
        };
        console.log('💾 Saving update:', updatePayload)

        // Start loading
        dispatch(setLoading('monthly_updates', 'saveUpdateLoad', true));

        const result = dispatch(
            addAction(
                'application/json',
                'monthly_updates',
                'SaveMonthlyUpdate',
                'saveUpdateLoad',
                updatePayload
            )
        );
        dispatch(setLoading('monthly_updates', 'monthlyGoalsLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'monthly_updates',
            'MonthlyGoalsData',
            'monthlyGoalsLoad',
            `${employeeId}/${selectedMonth}/${selectedYear}`
        ));
        // Promise-based flow
        if (result && typeof result.then === 'function') {
            result
                .then(() => {
                    // Close dialog immediately
                    setDialogOpen(false);
                    setFormData({});
                    setFormErrors({});
                    setCurrentGoal(null);

                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Update saved successfully',
                        timer: 2000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });




                })
                .catch(error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: error?.message || 'Failed to save update. Please try again.'
                    });
                })
                .finally(() => {
                    dispatch(setLoading('monthly_updates', 'saveUpdateLoad', false));
                });
        }
        else {
            setDialogOpen(false);
            setFormData({});
            setFormErrors({});
            setCurrentGoal(null);

            dispatch(setLoading('monthly_updates', 'monthlyGoalsLoad', true));
            dispatch(fetchByIdAction(
                'application/json',
                'monthly_updates',
                'MonthlyGoalsData',
                'monthlyGoalsLoad',
                `${employeeId}/${selectedMonth}/${selectedYear}`
            ));

            dispatch(setLoading('monthly_updates', 'saveUpdateLoad', false));
        }
    };

    const handleSubmitAll = useCallback(() => {
        try {
            Swal.fire({
                title: 'Submit Updates?',
                html: `
                <p>You have updated <strong>${updatedGoalsCount} out of ${goalsData.length}</strong> goals.</p>
                <p style="color: #dc3545; font-weight: bold; margin-top: 10px;">
                    ⚠️ Once submitted, you cannot make further changes.
                </p>
            `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: theme.palette.success.main,
                confirmButtonText: 'Yes, Submit'
            }).then((result) => {
                if (result.isConfirmed) {
                    dispatch(setLoading('monthly_updates', 'submitUpdatesLoad', true));
                    dispatch(addAction(
                        'application/json',
                        'monthly_updates',
                        'SubmitMonthlyUpdates',
                        'submitUpdatesLoad',
                        { employeeId, month: selectedMonth, year: selectedYear }
                    ));
                    window.location.reload()
                }
            });
        } catch (error) {
            console.log(error)
        }



    }, [updatedGoalsCount, goalsData.length, theme.palette.success.main,
        dispatch, employeeId, selectedMonth, selectedYear]);

    // ============================================================================
    // HELPERS
    // ============================================================================
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'info';
            case 'Partially Completed': return 'warning';
            case 'Blocked': return 'error';
            default: return 'default';
        }
    };

    const getGoalColumnValue = (goal, columnName) => {
        if (!goal.goal_data) return '-';
        const data = goal.goal_data.find(d => d.column_name === columnName);
        return data?.tgd_value || '-';
    };

    // ✅ Check if completion percentage should be enabled
    const isCompletionEnabled = formData.mu_status === 'In Progress' || formData.mu_status === 'Completed';

    // ============================================================================
    // LOADING STATE
    // ============================================================================
    if (monthlyUpdateDetails.loading.monthlyGoalsLoad && goalsData.length === 0) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Container>
        );
    }

    const truncateText = (text, maxLength = 50) => {
        if (typeof text !== 'string' || text.length <= maxLength) {
            return { truncated: text, isTruncated: false };
        }
        return { truncated: text.substring(0, maxLength) + '...', isTruncated: true };
    };

    // ============================================================================
    // MAIN RENDER
    // ============================================================================
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
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <UpdateIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="700" sx={{ color: 'white' }}>
                                Monthly Progress Updates
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                                Track and submit your monthly goal progress
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                        {isLocked && (
                            <Chip
                                icon={<LockIcon sx={{ color: 'white !important' }} />}
                                label="Submitted & Locked"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    px: 1
                                }}
                            />
                        )}
                        <Tooltip title="Refresh Data">
                            <IconButton onClick={handleRefresh} sx={{
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* MONTH/YEAR SELECTOR & STATS */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                {/* Select Period Card */}
                <Box sx={{ flex: '1 1 300px', minWidth: { xs: '100%', md: '350px' } }}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%', borderLeft: `4px solid ${theme.palette.info.main}` }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                <CalendarTodayIcon color="info" />
                                Select Period
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Month</InputLabel>
                                    <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} label="Month" disabled={isLocked}>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <MenuItem key={month} value={month}>
                                                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Year</InputLabel>
                                    <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} label="Year" disabled={isLocked}>
                                        {[2024, 2025, 2026, 2027].map(year => (
                                            <MenuItem key={year} value={year}>{year}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>

                {/* Goals Updated Card */}
                <Box sx={{ flex: '1 1 150px' }}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%', textAlign: 'center', borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Goals Updated</Typography>
                            <Typography variant="h3" fontWeight="700" color="primary.main">
                                {updatedGoalsCount}
                                <Typography component="span" variant="h5" color="text.secondary">
                                    /{filteredGoals.length}
                                </Typography>
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Overall Completion Card */}
                <Box sx={{ flex: '1 1 150px' }}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%', textAlign: 'center', borderLeft: `4px solid ${theme.palette.success.main}` }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Overall Completion</Typography>
                            <Typography variant="h3" fontWeight="700" color="success.main">
                                {totalCompletion.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={totalCompletion}
                                color="success"
                                sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                            />
                        </CardContent>
                    </Card>
                </Box>

                {/* Submission Status Card */}
                <Box sx={{ flex: '1 1 150px' }}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%', textAlign: 'center', borderLeft: `4px solid ${isLocked ? theme.palette.success.main : theme.palette.warning.main}` }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Submission Status</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                                {isLocked
                                    ? <LockIcon color="success" sx={{ fontSize: 32 }} />
                                    : <LockOpenIcon color="warning" sx={{ fontSize: 32 }} />
                                }
                                <Typography variant="h5" fontWeight="700" color={isLocked ? 'success.main' : 'warning.main'}>
                                    {isLocked ? 'Submitted' : 'In Progress'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* ✅ IMPROVED FILTERS PANEL - Wider labels (minWidth: 200px) */}
            <Paper elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                <Box
                    sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                    }}
                    onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Badge badgeContent={activeFilterCount} color="primary">
                            <FilterListIcon color="primary" />
                        </Badge>
                        <Typography variant="h6" fontWeight="600">
                            Advanced Filters
                        </Typography>
                        {activeFilterCount > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                ({activeFilterCount} active)
                            </Typography>
                        )}
                    </Box>
                    <IconButton size="small">
                        {filterPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                <Collapse in={filterPanelOpen}>
                    <Divider />
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                            {/* Search */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search Goals"
                                    placeholder="Search by description or category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ '& .MuiInputLabel-root': { minWidth: 200 } }}
                                />
                            </Grid>

                            {/* Template Filter */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ minWidth: 200 }}>Template</InputLabel>
                                    <Select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        label="Template"
                                        startAdornment={<DescriptionIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 48 * 5,
                                                    width: 200,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="all">
                                            <em>All Templates ({filterOptions.templates.length})</em>
                                        </MenuItem>
                                        {filterOptions.templates.map(template => (
                                            <MenuItem key={template} value={template}
                                                sx={{
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                    alignItems: "flex-start",
                                                }}>
                                                📄 {template}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Timeline Filter */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ minWidth: 200 }}>Timeline</InputLabel>
                                    <Select
                                        value={selectedTimeline}
                                        onChange={(e) => setSelectedTimeline(e.target.value)}
                                        label="Timeline"
                                        startAdornment={<TimelineIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 48 * 5,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="all">
                                            <em>All Timelines ({filterOptions.timelines.length})</em>
                                        </MenuItem>
                                        {filterOptions.timelines.map(timeline => (
                                            <MenuItem key={timeline} value={timeline}>
                                                📅 {timeline}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Contributor Filter */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ minWidth: 200 }}>Contributor / Viewer</InputLabel>
                                    <Select
                                        value={selectedContributor}
                                        onChange={(e) => setSelectedContributor(e.target.value)}
                                        label="Contributor / Viewer"
                                        startAdornment={<PeopleIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 48 * 5,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="all">
                                            <em>All Contributors ({filterOptions.contributors.length})</em>
                                        </MenuItem>
                                        {filterOptions.contributors.map(contributor => (
                                            <MenuItem key={contributor} value={contributor}>
                                                👥 {contributor}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Active Filter Chips */}
                        {activeFilterCount > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                    Active filters:
                                </Typography>

                                {searchQuery && (
                                    <Chip
                                        label={`Search: "${searchQuery}"`}
                                        size="small"
                                        onDelete={() => setSearchQuery('')}
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}

                                {selectedTemplate !== 'all' && (
                                    <Chip
                                        icon={<DescriptionIcon fontSize="small" />}
                                        label={selectedTemplate}
                                        size="small"
                                        onDelete={() => setSelectedTemplate('all')}
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}

                                {selectedTimeline !== 'all' && (
                                    <Chip
                                        icon={<TimelineIcon fontSize="small" />}
                                        label={selectedTimeline}
                                        size="small"
                                        onDelete={() => setSelectedTimeline('all')}
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}

                                {selectedTeamMember !== 'all' && (
                                    <Chip
                                        icon={<GroupIcon fontSize="small" />}
                                        label={selectedTeamMember}
                                        size="small"
                                        onDelete={() => setSelectedTeamMember('all')}
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}

                                {selectedContributor !== 'all' && (
                                    <Chip
                                        icon={<PeopleIcon fontSize="small" />}
                                        label={selectedContributor}
                                        size="small"
                                        onDelete={() => setSelectedContributor('all')}
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}

                                <Button
                                    size="small"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClearFilters}
                                    sx={{ ml: 'auto' }}
                                >
                                    Clear All
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </Paper>

            {/* Due Date Warning */}
            {isDueSoon && !isLocked && (
                <Fade in>
                    <Alert severity="warning" icon={<AccessTimeIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                        <strong>Due Soon!</strong> Monthly updates are due by the 15th of this month.
                    </Alert>
                </Fade>
            )}

            {/* ✅ GOALS TABLE WITH PAGINATION */}
            <Paper elevation={2} sx={{ borderRadius: 2, border: `2px solid ${theme.palette.divider}` }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main', width: 50 }}>Sno</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>YEAR</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>TEMPLATE</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>CATEGORY</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>TIMELINE</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>Sub Task / Sub Goal</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>TASK WEIGHTAGE</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>STATUS</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main' }}>PROGRESS</TableCell>
                                <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedGoals.length > 0 ? (
                                paginatedGoals.map((goal, index) => {
                                    const globalIndex = page * rowsPerPage + index;
                                    return (
                                        <Zoom in key={goal.tg_pid} style={{ transitionDelay: `${index * 30}ms` }}>
                                            <TableRow hover sx={{
                                                '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                            }}>
                                                <TableCell sx={{ fontWeight: '700' }}>{globalIndex + 1}</TableCell>
                                                <TableCell>
                                                    <Chip label={goal.template_year} size="small" color="secondary" variant="outlined" />
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={`${goal.template_name} (${goal.template_year})`}>
                                                        <Chip label={goal.template_name} size="small" color="secondary" variant="outlined" />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={goal.category_name} size="small" color="primary" variant="outlined" />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip icon={<TimelineIcon fontSize="small" />} label={goal.tg_timeline || 'N/A'} size="small" variant="outlined" />
                                                </TableCell>
                                                {/* <TableCell>
                                                    <Tooltip title={getGoalColumnValue(goal, 'Goal Description')}>
                                                        <Typography variant="body2" sx={{
                                                            maxWidth: 300,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {getGoalColumnValue(goal, 'Goal Description')}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell> */}
                                                
                                                {/* <TableCell sx={{ textAlign: 'center', verticalAlign: 'top' }}>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'center', 
                                                        alignItems: 'start', 
                                                        gap: 1 
                                                    }}>
                                                        <Typography 
                                                            variant="caption" 
                                                            component="p"
                                                            fontWeight="600" 
                                                            sx={{ 
                                                                textAlign: 'left',
                                                                minWidth: '250px',
                                                                maxWidth: '400px',
                                                                whiteSpace: 'normal',
                                                                wordBreak: 'break-word' 
                                                            }}
                                                        >
                                                            {goal.sub_task_name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell> */}
                                               <TableCell sx={{ textAlign: 'center', verticalAlign: 'top' }}>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'center', 
                                                        alignItems: 'start', 
                                                        gap: 1 
                                                    }}>
                                                        <Box
                                                            sx={{
                                                                minWidth: '250px',
                                                                maxWidth: '400px',
                                                                maxHeight: '80px', 
                                                                overflowY: 'auto',
                                                                overflowX: 'hidden',
                                                                '&::-webkit-scrollbar': {
                                                                    width: '4px',
                                                                },
                                                                '&::-webkit-scrollbar-thumb': {
                                                                    backgroundColor: '#bdbdbd',
                                                                    borderRadius: '4px',
                                                                },
                                                            }}
                                                        >
                                                            <Typography 
                                                                variant="caption" 
                                                                component="p"
                                                                fontWeight="600" 
                                                                sx={{ 
                                                                    textAlign: 'left',
                                                                    whiteSpace: 'normal',
                                                                    wordBreak: 'break-word' 
                                                                }}
                                                            >
                                                                {goal.sub_task_name}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={`${goal.tg_goal_weightage}%`} size="small" sx={{ fontWeight: '700' }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={goal.update_status || goal.mu_status || 'Not Started'}
                                                        size="small"
                                                        color={getStatusColor(goal.update_status || goal.mu_status)}
                                                        sx={{ fontWeight: '600' }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={parseFloat(goal.mu_completed_weightage) || 0}
                                                            sx={{ width: 100, height: 8, borderRadius: 4 }}
                                                            color={
                                                                parseFloat(goal.mu_completed_weightage) >= 75 ? 'success' :
                                                                    parseFloat(goal.mu_completed_weightage) >= 50 ? 'info' :
                                                                        parseFloat(goal.mu_completed_weightage) >= 25 ? 'warning' : 'error'
                                                            }
                                                        />
                                                        <Typography variant="caption" fontWeight="600">
                                                            {parseFloat(goal.mu_completed_weightage) || 0}%
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    <Tooltip title={isLocked ? 'Updates are locked' : 'Update Progress'}>
                                                        <span>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={goal.mu_pid ? <EditIcon /> : <UpdateIcon />}
                                                                onClick={() => handleOpenDialog(goal)}
                                                                disabled={isLocked}
                                                                sx={{ minWidth: 100 }}
                                                            >
                                                                {goal.mu_pid ? 'Edit' : 'Update'}
                                                            </Button>
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        </Zoom>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                                        <WarningIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
                                        <Typography variant="h6" fontWeight="600" color="text.secondary">
                                            {activeFilterCount > 0 ? 'No Goals Match Filters' : 'No Goals Found'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {activeFilterCount > 0 ? 'Try adjusting your filter criteria' : 'No active goals for the selected period'}
                                        </Typography>
                                        {activeFilterCount > 0 && (
                                            <Button
                                                variant="outlined"
                                                startIcon={<ClearIcon />}
                                                onClick={handleClearFilters}
                                                sx={{ mt: 2 }}
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ✅ PAGINATION CONTROLS */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    component="div"
                    count={filteredGoals.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '.MuiTablePagination-toolbar': {
                            minHeight: 56
                        }
                    }}
                />
            </Paper>

            {/* SUBMIT BUTTON */}
            {!isLocked && goalsData.length > 0 && (
                <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2, mt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        color="success"
                        startIcon={<SendIcon />}
                        onClick={handleSubmitAll}
                        disabled={updatedGoalsCount === 0}
                        sx={{ fontWeight: '600', minWidth: 200 }}
                    >
                        Submit All Updates
                    </Button>
                    {updatedGoalsCount === 0 && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            Please update at least one goal before submitting
                        </Typography>
                    )}
                    {updatedGoalsCount > 0 && updatedGoalsCount < goalsData.length && (
                        <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 1 }}>
                            ⚠️ You have updated {updatedGoalsCount} out of {goalsData.length} goals
                        </Typography>
                    )}
                </Paper>
            )}

            {/* ✅ UPDATE DIALOG - Fixed status-based enabling */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight="700" sx={{ color: '#fff' }}>Update Monthly Progress</Typography>
                        <Typography variant="caption" sx={{ color: '#fff' }}>{currentGoal?.category_name}</Typography>
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {currentGoal && (
                        <>
                            <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
                                <Typography variant="body2" fontWeight="600">
                                    Description: {getGoalColumnValue(currentGoal, 'Goal Description')}
                                </Typography>
                            </Alert>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Status Field */}
                                <FormControl fullWidth error={!!formErrors.mu_status} required>
                                    <InputLabel>Status *</InputLabel>
                                    <Select
                                        value={formData.mu_status || ''}
                                        onChange={(e) => {
                                            const newStatus = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                mu_status: newStatus,
                                                // ✅ Reset completion if changing to "Not Started"
                                                ...(newStatus === 'Not Started' ? { mu_completed_weightage: 0 } : {})
                                            }));
                                            setFormErrors(prev => ({ ...prev, mu_status: undefined }));
                                        }}
                                        label="Status *"
                                    >
                                        <MenuItem value="Not Started">📋 Not Started</MenuItem>
                                        <MenuItem value="In Progress">⏳ In Progress</MenuItem>
                                        <MenuItem value="Completed">✅ Completed</MenuItem>
                                        <MenuItem value="Partially Completed">🟡 Partially Completed</MenuItem>
                                    </Select>
                                    {formErrors.mu_status && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                            {formErrors.mu_status}
                                        </Typography>
                                    )}
                                </FormControl>

                                {/* ✅ Completion Percentage - Disabled for "Not Started" */}
                                <TextField
                                    fullWidth
                                    type="number"
                                    label={'Completion (%)'}
                                    value={formData.mu_completed_weightage || ''}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            mu_completed_weightage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                                        }));
                                        setFormErrors(prev => ({ ...prev, mu_completed_weightage: undefined }));
                                    }}

                                    required
                                    error={!!formErrors.mu_completed_weightage}
                                    InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                                />

                                {/* Monthly Notes */}
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Monthly Notes"
                                    placeholder="Progress, achievements, challenges..."
                                    value={formData.mu_monthly_notes || ''}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            mu_monthly_notes: e.target.value
                                        }));
                                        setFormErrors(prev => ({ ...prev, notes: undefined }));
                                    }}
                                    required
                                    error={!!formErrors.notes}
                                    helperText={formErrors.notes}
                                />
                            </Box>
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveUpdate}
                        disabled={monthlyUpdateDetails.loading.saveUpdateLoad}
                        startIcon={<UpdateIcon />}
                        sx={{ fontWeight: '600' }}
                    >
                        {monthlyUpdateDetails.loading.saveUpdateLoad ? 'Saving...' : 'Save Update'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MonthlyUpdates;
