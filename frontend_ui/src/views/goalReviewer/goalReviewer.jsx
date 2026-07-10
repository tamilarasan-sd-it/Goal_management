import React, { use, useEffect, useMemo, useState } from 'react';
import {
    Fade,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Box,
    Typography,
    Skeleton,
    Tooltip,
    Avatar,
    alpha,
    Stack,
    Dialog,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    DialogActions,
    DialogContent,
    Alert  //  Added Alert for blocked subgoal warning
} from '@mui/material';
import { Autocomplete, Grid, TextField, Button, TablePagination } from '@mui/material';


import {
    Visibility,
    CheckCircle,
    PendingActions,
    HourglassEmpty,
    Block,
    EditNote,
    Person,
    CalendarToday,
    Badge,
    History,
    FilterListOff,
    InfoOutlined,
    ChangeHistory,
    Close,
    Comment as CommentIcon,
    Send,
} from '@mui/icons-material';

import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, fetchByIdAction, addAction } from '../../StoreRedux/actions/commonActions';
import { useLocation, useNavigate } from 'react-router-dom';

const getGoalReviewerDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['goalReviewer'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const GoalTemplateDataForReviwerLoad = pageData?.loading?.GoalTemplateDataForReviwerLoad;
            const GoalTemplateDataForReviwerData = pageData?.data?.GoalTemplateDataForReviwerData;
            const SubGoalReviewerLoad = pageData?.loading?.SubGoalReviewerLoad;
            const SubGoalReviewerData = pageData?.data?.SubGoalReviewerData;

            result[page] = {
                loading: {
                    GoalTemplateDataForReviwerLoad: GoalTemplateDataForReviwerLoad,
                    SubGoalReviewerLoad: SubGoalReviewerLoad,
                },
                data: {
                    GoalTemplateDataForReviwerData: GoalTemplateDataForReviwerData,
                    SubGoalReviewerData: SubGoalReviewerData,
                }
            };
        });
        return result.goalReviewer;
    }
);

const GoalReviewer = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state?.auth || {});

    const [filters, setFilters] = useState({
        templateId: null,
        templateName: null,
        year: null,
        status: null,
        owner: null,
        reviewer: null,
    });

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const goalReviewerStore = useSelector(getGoalReviewerDetails) || {};
    const goalTemplateDataForReviwerData = Array.isArray(goalReviewerStore?.data?.GoalTemplateDataForReviwerData)
        ? goalReviewerStore.data.GoalTemplateDataForReviwerData
        : [];
    const goalTemplateLoading = goalReviewerStore?.loading?.GoalTemplateDataForReviwerLoad || false;

    const SubGoalReviewerStoreData = Array.isArray(goalReviewerStore?.data?.SubGoalReviewerData)
        ? goalReviewerStore.data.SubGoalReviewerData
        : [];
    const subGoalReviewerStoreLoading = goalReviewerStore?.loading?.SubGoalReviewerLoad || false;

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [selectedNextStatus, setSelectedNextStatus] = useState('');
    const [statusError, setStatusError] = useState(false);
    const [comment, setComment] = useState('');
    const [commentError, setCommentError] = useState(false);

    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const handleFilterChange = (field, value) => {
        setPage(0); // Reset to first page on filter change
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            templateId: null,
            templateName: null,
            year: null,
            status: null,
            owner: null,
            reviewer: null,
        });
        setPage(0);
    };

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredData = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');

        let data = [...goalTemplateDataForReviwerData];

        const uniqueMap = new Map();
        data.forEach(item => {
            if (!uniqueMap.has(item.ta_pid)) {
                uniqueMap.set(item.ta_pid, item);
            }
        });

        data = Array.from(uniqueMap.values());


        data = data.map(template => ({
            ...template,
            subGoals: SubGoalReviewerStoreData.filter(
                subGoal => subGoal.ta_pid === template.ta_pid
            )
        }));

        if (statusParam) {
            data = data.filter(item => item.ta_status.replace(/ /g, '_') === statusParam);
        }

        return data.filter(item => {
            return (
                (!filters.templateId || item.ta_generated_id === filters.templateId) &&
                (!filters.templateName || item.template_name === filters.templateName) &&
                (!filters.year || item.template_year === filters.year) &&
                (!filters.status || item.ta_status === filters.status) &&
                (!filters.owner || item.assign_employee_name === filters.owner) &&
                (!filters.reviewer || item.reviewer_employee_name === filters.reviewer)
            );
        });
    }, [location.search, goalTemplateDataForReviwerData, SubGoalReviewerStoreData, filters]);


    const isFiltersApplied = Object.values(filters).some(value => value !== null);


    const pageTitle = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        if (status) {
            // Replace underscores with spaces for a readable title
            return `${status.replace(/_/g, ' ')} Goals`;
        }
        return 'Goals Reviews';
    }, [location.search]);


    const handleViewClick = (templateAssignId) => {
        navigate(`/goal-views/${templateAssignId}`);
    };

    const filterOptions = useMemo(() => {
        const uniqueValues = (key) => [...new Set(goalTemplateDataForReviwerData.map(item => item[key]).filter(Boolean))];
        return {
            templateIds: uniqueValues('ta_generated_id'),
            templateNames: uniqueValues('template_name'),
            years: uniqueValues('template_year'),
            statuses: uniqueValues('ta_status'),
            owners: uniqueValues('assign_employee_name'),
            reviewers: uniqueValues('reviewer_employee_name'),
        };
    }, [goalTemplateDataForReviwerData]);




    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');

        dispatch(setLoading("goalReviewer", "GoalTemplateDataForReviwerLoad", true));
        if (status) {
            // Decode URL-encoded spaces and then replace underscores with spaces for the API.
            const payload = { user_id: user?.id, status: status }; // decodeURIComponent(status).replace(/_/g, ' ') 

            dispatch(fetchByIdAction('application/json', "goalReviewer", "GoalTemplateDataForReviwerData", "GoalTemplateDataForReviwerLoad", JSON.stringify(payload)));
        } else {
            dispatch(fetchByIdAction('application/json', "goalReviewer", "GoalTemplateDataForReviwerData", "GoalTemplateDataForReviwerLoad", user?.id));
        }
    }, [dispatch, user?.id, location.search]);

    useEffect(() => {

        dispatch(setLoading("goalReviewer", "SubGoalReviewerLoad", true));
        dispatch(fetchAction('application/json', "goalReviewer", "SubGoalReviewerData", "SubGoalReviewerLoad"));

    }, [dispatch]);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Under_Review':
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: 'Under Review',
                    color: '#3b82f6',
                    backgroundColor: alpha('#3b82f6', 0.1),
                };
            case 'Approved':
                return {
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                    label: 'Approved',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Rejected':
                return {
                    icon: <Block sx={{ fontSize: 16 }} />,
                    label: 'Rejected',
                    color: '#ef4444',
                    backgroundColor: alpha('#ef4444', 0.1),
                };
            case 'Goals_Pending':
                return {
                    icon: <PendingActions sx={{ fontSize: 16 }} />,
                    label: 'Goals Pending',
                    color: '#f59e0b',
                    backgroundColor: alpha('#f59e0b', 0.1),
                };
            case 'Need_More_Information_Reviewer':
                return {
                    icon: <InfoOutlined sx={{ fontSize: 16 }} />,
                    label: 'Need More Information By Reviewer',
                    color: '#f97316',
                    backgroundColor: alpha('#f97316', 0.1),
                };
            case 'Need_More_Information_Super_Admin':
                return {
                    icon: <InfoOutlined sx={{ fontSize: 16 }} />,
                    label: 'Need More Information By Super Admin',
                    color: '#f97316',
                    backgroundColor: alpha('#f97316', 0.1),
                };
            case 'In_Progress':
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: 'In Progress',
                    color: '#f59e0b',
                    backgroundColor: alpha('#f59e0b', 0.1),
                };
            case 'Completed':
                return {
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                    label: 'Completed',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Submitted':
                return {
                    icon: <Send sx={{ fontSize: 16 }} />,
                    label: 'Submitted',
                    color: '#6366f1',
                    backgroundColor: alpha('#6366f1', 0.1),
                };
            case 'Assigned':
                return {
                    icon: <Badge sx={{ fontSize: 16 }} />,
                    label: 'Assigned',
                    color: '#a855f7',
                    backgroundColor: alpha('#a855f7', 0.1),
                };
            case 'Modify_Correction_Reviewer':
            case 'Modify_Correction_Super_Admin':
                return {
                    icon: <CommentIcon sx={{ fontSize: 16 }} />,
                    label: 'Information Updated to Reviewer',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Approve_Reviewer':
                return {
                    icon: <CommentIcon sx={{ fontSize: 16 }} />,
                    label: 'Reviwer Approved',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            default:
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: status?.replace(/_/g, ' ') || 'Unknown',
                    color: '#6b7280',
                    backgroundColor: alpha('#6b7280', 0.1),
                };
        }
    };


    const getAllowedNextStatuses = (currentStatus, subgoalsFiltered) => {


        // Status option constants
        const APPROVE = { value: 'Approve_Reviewer', label: 'Reviewer Approved', color: '#10b981', icon: <CheckCircle /> };
        const NEED_INFO = { value: 'Need_More_Information_Reviewer', label: 'Need More Information By Reviewer', color: '#f59e0b', icon: <CommentIcon /> };
        const REJECTED = { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> };

        // Null checks — subgoal status not yet updated
        const is_all_null = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(
            sg => sg.sbr_review_status === null
        );
        const is_any_null = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === null
        );

        // Subgoal status condition flags
        const is_all_approved_by_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(
            sg => sg.sbr_review_status === 'Approve_Reviewer'
        );
        const is_all_rejected = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(
            sg => sg.sbr_review_status === 'Rejected'
        );
        const is_any_rejected = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Rejected'
        );
        const is_any_need_more_info = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Need_More_Information_Reviewer'
        );

        const is_any_modify_correction_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Modify_Correction_Reviewer'
        );




        const getStatusOptions = () => {

            // 6a. All subgoals are null → block with alert
            if (is_all_null) return {
                blocked: true,
                alertMessage: 'Please update all sub goal statuses before proceeding further.',
                options: []
            };

            // 6b. Any one subgoal is null → block with alert
            if (is_any_null) return {
                blocked: true,
                alertMessage: 'Please update all sub goal statuses. You cannot proceed until all sub goals have a status.',
                options: []
            };

            // 1. All approved → Approve only
            if (is_all_approved_by_reviewer) return { blocked: false, alertMessage: null, options: [APPROVE] };

            // 2. All rejected → Rejected only
            if (is_all_rejected) return { blocked: false, alertMessage: null, options: [REJECTED] };

            // 4 & 5. Any need more info (covers mixed: approve + need more info + reject) → Need More Info only
            if (is_any_need_more_info) return { blocked: false, alertMessage: null, options: [NEED_INFO] };

            // 3. Any rejected (no need more info present) → Need More Info only
            if (is_any_rejected) return { blocked: false, alertMessage: null, options: [NEED_INFO] };


            // Default → show both Approve and Need More Info
            return { blocked: false, alertMessage: null, options: [APPROVE, NEED_INFO] };
        };

        switch (currentStatus) {
            case 'Under_Review':
                return getStatusOptions();
            case 'Modify_Correction_Reviewer':
                if (is_any_modify_correction_reviewer) return {
                    blocked: true,
                    alertMessage: 'Some subgoals modify correction as per owner. Please address those before proceeding.',
                    options: []
                }
                else {

                    return getStatusOptions();

                }


            default:
                return { blocked: false, alertMessage: null, options: [] };
        }
    };

    const currentTemplateStatus = selectedAssignment?.ta_status;

    //  Updated nextAllowedStatuses — now passes subGoals from selectedAssignment
    const nextAllowedStatuses = useMemo(() => {
        if (!selectedAssignment) return { blocked: false, alertMessage: null, options: [] };

        return getAllowedNextStatuses(
            selectedAssignment.ta_status,
            selectedAssignment.subGoals || []  //  pass attached subGoals
        );
    }, [
        selectedAssignment,
    ]);


    const handleSubmitStatusChange = () => {
        let valid = true;
        if (!selectedNextStatus) { setStatusError(true); valid = false; } else { setStatusError(false); }
        // if (!comment.trim()) { setCommentError(true); valid = false; } 
        // else { 
            setCommentError(false); 
        // }

        if (valid) {
            const statusChangeData = {
                template_pid: selectedAssignment?.template_pid,
                template_status: selectedNextStatus,
                tr_assignment_id: selectedAssignment?.ta_pid,
                tr_template_id: selectedAssignment?.template_pid,
                tr_reviewer_id: user?.id,
                tr_review_status: selectedNextStatus,
                tr_review_date: new Date().toISOString().split('T')[0],
                tr_comments: comment,
                tr_created_at: new Date().toISOString(),
                tr_modified_at: new Date().toISOString()
            };


            dispatch(setLoading("goalReviewer", "GoalTemplateDataForReviwerLoad", true));
            dispatch(addAction('application/json', "goalReviewer", "GoalTemplateDataForReviwerData", "GoalTemplateDataForReviwerLoad", statusChangeData));

            handleCloseStatusModal();
        }
    };


    const listboxProps = {
        style: {
            maxHeight: '160px', // Approx. 4 items
        },
    };


    const handleOpenStatusModal = (row) => {
        setSelectedAssignment(row);
        setOpenStatusModal(true);
        setSelectedNextStatus('');
        setComment('');
        setStatusError(false);
        setCommentError(false);
    };

    const handleCloseStatusModal = () => {
        setOpenStatusModal(false);
    };

    return (
        <>
            <Fade in timeout={800}>
                <Box sx={{
                    px: { xs: 1, sm: 2, md: 3 },
                    py: 3,
                    minHeight: 'calc(100vh - 64px)',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '40%',
                        height: '40%',
                        background: 'radial-gradient(circle at top right, #6366f122 0%, transparent 70%)',
                        zIndex: 0,
                    },
                }}>

                    <Box sx={{
                        mb: 4,
                        position: 'relative',
                        zIndex: 1,
                    }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                            mb: 3,
                        }}>
                            <Box>
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    fontWeight="800"
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        color: 'transparent',
                                        mb: 0.5,
                                    }}
                                >
                                    {pageTitle}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Filter Section */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                        }}
                    >
                        <Grid container spacing={2} alignItems="center">
                            {/* Common ListboxProps for all Autocomplete components */}

                            <Grid item xs={12} sm={6} md={6} lg={4}>
                                <Autocomplete
                                    size="small"
                                    sx={{ width: 200 }}
                                    options={filterOptions.templateNames}
                                    value={filters.templateName}
                                    onChange={(event, newValue) => handleFilterChange('templateName', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Template Name" />}
                                    ListboxProps={listboxProps}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6} lg={4}>
                                <Autocomplete
                                    size="small"
                                    sx={{ width: 200 }}
                                    options={filterOptions.years}
                                    value={filters.year}
                                    onChange={(event, newValue) => handleFilterChange('year', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Year" />}
                                    ListboxProps={listboxProps}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6} lg={4}>
                                <Autocomplete
                                    size="small"
                                    sx={{ width: 200 }}
                                    options={filterOptions.statuses}
                                    value={filters.status}
                                    onChange={(event, newValue) => handleFilterChange('status', newValue)}
                                    getOptionLabel={(option) => getStatusConfig(option).label || option}
                                    isOptionEqualToValue={(option, value) => option === value}
                                    renderOption={(props, option) => {
                                        const cfg = getStatusConfig(option);
                                        return (
                                            <li {...props}>
                                                <Chip
                                                    icon={cfg.icon}
                                                    label={cfg.label}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: cfg.backgroundColor,
                                                        color: cfg.color,
                                                        fontWeight: 600,
                                                        height: '28px',
                                                        '& .MuiChip-icon': { marginLeft: '6px' }
                                                    }}
                                                />
                                            </li>
                                        );
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Status" />}
                                    ListboxProps={listboxProps}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6} lg={4}>
                                <Autocomplete
                                    size="small"
                                    sx={{ width: 200 }}
                                    options={filterOptions.owners}
                                    value={filters.owner}
                                    onChange={(event, newValue) => handleFilterChange('owner', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Owner" />}
                                    ListboxProps={listboxProps}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6} lg={4}>
                                <Autocomplete
                                    size="small"
                                    sx={{ width: 200 }}
                                    options={filterOptions.reviewers}
                                    value={filters.reviewer}
                                    onChange={(event, newValue) => handleFilterChange('reviewer', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Reviewer" />}
                                    ListboxProps={listboxProps}
                                />
                            </Grid>
                            {isFiltersApplied && (
                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        size="small"
                                        startIcon={<FilterListOff />}
                                        onClick={handleClearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Table Section */}
                    <Box sx={{
                        position: 'relative',
                        zIndex: 1,
                    }}>
                        {goalTemplateLoading || filteredData.length > 0 ? (
                            <Paper
                                elevation={2}
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0, 0, 0, 0.08)',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                }}
                            >
                                <TableContainer sx={{
                                    maxHeight: 'calc(100vh - 300px)',
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                        height: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: '#f1f1f1',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: '#c1c1c1',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                        background: '#a8a8a8',
                                    },
                                }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{
                                                '& th': {
                                                    backgroundColor: '#f8fafc',
                                                    color: '#475569',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    borderBottom: '2px solid #e2e8f0',
                                                    padding: '10px 16px',
                                                    height: '48px', // Reduced from default 56px
                                                    whiteSpace: 'nowrap',
                                                },
                                                '& th:first-of-type': {
                                                    borderTopLeftRadius: '8px',
                                                },
                                                '& th:last-of-type': {
                                                    borderTopRightRadius: '8px',
                                                },
                                            }}>
                                                <TableCell sx={{ minWidth: '80px' }}>S.No</TableCell>
                                                <TableCell sx={{ minWidth: '180px' }}>Template Name</TableCell>
                                                <TableCell sx={{ minWidth: '100px' }}>Year</TableCell>
                                                <TableCell sx={{ minWidth: '140px' }}>Status</TableCell>
                                                <TableCell sx={{ minWidth: '160px' }}>Owner</TableCell>
                                                <TableCell sx={{ minWidth: '160px' }}>Reviewer</TableCell>
                                                {/* <TableCell sx={{ minWidth: '120px' }}>Template ID</TableCell> */}
                                                <TableCell sx={{
                                                    minWidth: '150px',
                                                    textAlign: 'center'
                                                }}>
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {goalTemplateLoading ? (
                                                Array.from({ length: 5 }).map((_, index) => (
                                                    <TableRow key={index}>
                                                        {Array.from({ length: 8 }).map((_, i) => (
                                                            <TableCell key={i} sx={{ padding: '12px 16px' }}>
                                                                <Skeleton height={20} />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                (filteredData || [])
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((template, index) => {
                                                        const statusConfig = getStatusConfig(template?.ta_status);

                                                        // subGoals attached from filteredData useMemo
                                                        const subgoalsFiltered = template?.subGoals || [];

                                                        //  Get allowed statuses with blocked/alert info for this row
                                                        const rowNextAllowedStatuses = getAllowedNextStatuses(
                                                            template?.ta_status,
                                                            subgoalsFiltered
                                                        );

                                                        return (
                                                            <TableRow
                                                                key={index}
                                                                hover
                                                                sx={{
                                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                                    '& td': {
                                                                        padding: '12px 16px',
                                                                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                                                                        fontSize: '0.875rem',
                                                                    },
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(99, 102, 241, 0.02)',
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell>{page * rowsPerPage + index + 1}</TableCell>

                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {template.template_name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={template.template_year}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                                            color: '#6366f1',
                                                                            fontWeight: 500,
                                                                            height: '24px',
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        icon={statusConfig.icon}
                                                                        label={statusConfig.label}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: statusConfig.backgroundColor,
                                                                            color: statusConfig.color,
                                                                            fontWeight: 600,
                                                                            height: '24px',
                                                                            '& .MuiChip-icon': {
                                                                                marginLeft: '6px',
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Avatar sx={{
                                                                            width: 28,
                                                                            height: 28,
                                                                            fontSize: '0.875rem',
                                                                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                                            color: '#6366f1'
                                                                        }}>
                                                                            {template.assign_employee_name?.charAt(0) || 'A'}
                                                                        </Avatar>
                                                                        <Typography variant="body2">
                                                                            {template.assign_employee_name}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Avatar sx={{
                                                                            width: 28,
                                                                            height: 28,
                                                                            fontSize: '0.875rem',
                                                                            bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                                            color: '#10b981'
                                                                        }}>
                                                                            {template.reviewer_employee_name?.charAt(0) || 'R'}
                                                                        </Avatar>
                                                                        <Typography variant="body2">
                                                                            {template.reviewer_employee_name}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                {/* <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {template.ta_generated_id || 'N/A'}
                                                                    </Typography>
                                                                </TableCell> */}
                                                                <TableCell align="center">
                                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                                        <Tooltip title="View Details">
                                                                            <IconButton
                                                                                onClick={() => handleViewClick(template.ta_pid)}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                                                                    '&:hover': {
                                                                                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Visibility fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>

                                                                        {/*  Show status change button if options exist OR if blocked (so user sees the alert in modal) */}
                                                                        {(rowNextAllowedStatuses.options.length > 0 || rowNextAllowedStatuses.blocked) && (
                                                                            <Tooltip title={rowNextAllowedStatuses.blocked ? "Sub goal statuses pending" : "Status Changes"}>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleOpenStatusModal(template)}
                                                                                    sx={{
                                                                                        //  Red tint if blocked, orange if normal
                                                                                        backgroundColor: rowNextAllowedStatuses.blocked
                                                                                            ? 'rgba(239, 68, 68, 0.08)'
                                                                                            : 'rgba(249, 115, 22, 0.08)',
                                                                                        '&:hover': {
                                                                                            backgroundColor: rowNextAllowedStatuses.blocked
                                                                                                ? 'rgba(239, 68, 68, 0.15)'
                                                                                                : 'rgba(249, 115, 22, 0.15)',
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <ChangeHistory fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}

                                                                        <Tooltip title="View History">
                                                                            <IconButton
                                                                                onClick={() => navigate(`/goal-history/${template.ta_pid}`)}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                                                                                    '&:hover': {
                                                                                        backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <History fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Stack>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredData.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Paper>
                        ) : (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    borderRadius: 2,
                                    border: '1px dashed #e2e8f0',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        margin: '0 auto 24px',
                                        borderRadius: '50%',
                                        background: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                    }}
                                >
                                    <EditNote sx={{ fontSize: 48 }} />
                                </Box>

                                <Typography
                                    variant="h6"
                                    fontWeight="600"
                                    color="#475569"
                                    gutterBottom
                                >
                                    No Templates Available
                                </Typography>

                                <Typography
                                    variant="body1"
                                    color="#94a3b8"
                                    sx={{ maxWidth: 400, mx: 'auto' }}
                                >
                                    There are no goal templates assigned for review at the moment.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Fade>

            {/* Status Change Modal */}
            <Dialog
                open={openStatusModal}
                onClose={handleCloseStatusModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                    }
                }}
            >
                <DialogTitle sx={{
                    pb: 2,
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700" color="#1e293b">
                            Update Template Status
                        </Typography>
                        <IconButton onClick={handleCloseStatusModal} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Current Status
                        </Typography>
                        <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: getStatusConfig(currentTemplateStatus).backgroundColor,
                            border: `1px solid ${alpha(getStatusConfig(currentTemplateStatus).color, 0.2)}`,
                        }}>
                            {getStatusConfig(currentTemplateStatus).icon}
                            <Typography variant="body1" fontWeight="600" color={getStatusConfig(currentTemplateStatus).color}>
                                {getStatusConfig(currentTemplateStatus).label}
                            </Typography>
                        </Box>
                    </Box>

                    {/*  Blocked Alert — shown when all or any subgoal statuses are null */}
                    {nextAllowedStatuses.blocked && nextAllowedStatuses.alertMessage && (
                        <Alert
                            severity="warning"
                            icon={<InfoOutlined />}
                            sx={{
                                mb: 2,
                                borderRadius: 2,
                                backgroundColor: alpha('#f59e0b', 0.08),
                                border: `1px solid ${alpha('#f59e0b', 0.3)}`,
                                color: '#92400e',
                                '& .MuiAlert-icon': { color: '#f59e0b' }
                            }}
                        >
                            {nextAllowedStatuses.alertMessage}
                        </Alert>
                    )}

                    {/*  Show status dropdown + comment only when NOT blocked and options exist */}
                    {!nextAllowedStatuses.blocked && nextAllowedStatuses.options.length > 0 ? (
                        <>
                            <FormControl fullWidth error={statusError} sx={{ mb: 3 }}>
                                <InputLabel>Select New Status</InputLabel>
                                <Select
                                    value={selectedNextStatus}
                                    label="Select New Status"
                                    onChange={(e) => { setSelectedNextStatus(e.target.value); setStatusError(false); }}
                                >
                                    <MenuItem value="" disabled>
                                        <em>Choose a status...</em>
                                    </MenuItem>
                                    {nextAllowedStatuses.options.map((statusOption) => (
                                        <MenuItem
                                            key={statusOption.value}
                                            value={statusOption.value}
                                            sx={{ color: statusOption.color }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {statusOption.icon}
                                                {statusOption.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                                {statusError && (
                                    <FormHelperText>Please select a new status</FormHelperText>
                                )}
                            </FormControl>

                            <TextField
                                label="Comments / Remarks"
                                multiline
                                rows={4}
                                fullWidth
                                value={comment}
                                onChange={(e) => { setComment(e.target.value); setCommentError(false); }}
                                error={commentError}
                                helperText={commentError ? "Comments are required" : "Add any remarks for this status change"}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                // required
                            />
                        </>
                    ) : !nextAllowedStatuses.blocked ? (
                        //  No options and not blocked → no further changes available
                        <Box sx={{
                            p: 3,
                            backgroundColor: '#f8fafc',
                            borderRadius: 2,
                            textAlign: 'center',
                        }}>
                            <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                No further status changes are available for this template.
                            </Typography>
                        </Box>
                    ) : null}
                </DialogContent>

                {/*  DialogActions — only shown when NOT blocked and options exist */}
                {!nextAllowedStatuses.blocked && nextAllowedStatuses.options.length > 0 && (
                    <DialogActions sx={{
                        p: 3,
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        background: '#f8fafc',
                    }}>
                        <Button
                            onClick={handleCloseStatusModal}
                            sx={{
                                color: '#64748b',
                                textTransform: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitStatusChange}
                            variant="contained"
                            // disabled={!selectedNextStatus || !comment?.trim()}
                            disabled={!selectedNextStatus}
                            startIcon={<Send />}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                    boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
                                },
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Submit Status
                        </Button>
                    </DialogActions>
                )}
            </Dialog>
            <style jsx global>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>

        </>
    );
};

export default GoalReviewer;