import React, { useEffect, useMemo, useState } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Avatar,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Divider,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Skeleton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Badge,
    alpha,
    useTheme,
    Button
} from '@mui/material';
import {
    Person,
    CalendarToday,
    CheckCircle,
    PendingActions,
    HourglassEmpty,
    Block,
    EditNote,
    Visibility,
    ArrowDropDown,
    Timeline,
    Assessment,
    Work,
    TrendingUp,
    History,
    Category,
    PriorityHigh,
    Schedule,
    Star,
    StarBorder,
    Assignment,
    AssignmentTurnedIn,
    Reviews,
    ExpandMore,
    ArrowForwardIos,
    EmojiEvents
} from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const getGoalHistoryDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['goal_history_view_page'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const GoalHistoryViewPageLoad = pageData?.loading?.GoalHistoryViewPageLoad || false;
            const GoalHistoryViewPageData = pageData?.data?.GoalHistoryViewPageData || [];
            const GoalHistoryReviewTemplateAssignmentsLoad = pageData?.loading?.GoalHistoryReviewTemplateAssignmentsLoad || false;
            const GoalHistoryReviewTemplateAssignmentsData = pageData?.data?.GoalHistoryReviewTemplateAssignmentsData || [];

            result[page] = {
                loading: {
                    GoalHistoryViewPageLoad,
                    GoalHistoryReviewTemplateAssignmentsLoad,
                },
                data: {
                    GoalHistoryViewPageData,
                    GoalHistoryReviewTemplateAssignmentsData,
                }
            };
        });
        return result.goal_history_view_page;
    }
);

const GoalHistoryViewPage = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            dispatch(setLoading('goal_history_view_page', 'GoalHistoryViewPageLoad', true));
            dispatch(fetchByIdAction('application/json', 'goal_history_view_page', 'GoalHistoryViewPageData', 'GoalHistoryViewPageLoad', id));
            dispatch(setLoading('goal_history_view_page', 'GoalHistoryReviewTemplateAssignmentsLoad', true));
            dispatch(fetchByIdAction('application/json', 'goal_history_view_page', 'GoalHistoryReviewTemplateAssignmentsData', 'GoalHistoryReviewTemplateAssignmentsLoad', id));
        }
    }, [id]);

    const getGoalHistoryViewStore = useSelector(getGoalHistoryDetails) || {};
    const goalHistoryViewLoading = getGoalHistoryViewStore?.loading?.GoalHistoryViewPageLoad || false;
    const goalHistoryReviewLoading = getGoalHistoryViewStore?.loading?.GoalHistoryReviewTemplateAssignmentsLoad || false;

    const goalHistoryViewData = Array.isArray(getGoalHistoryViewStore?.data?.GoalHistoryViewPageData)
        ? getGoalHistoryViewStore.data.GoalHistoryViewPageData
        : [];

    const goalHistoryReviewTemplateAssignmentsData = Array.isArray(getGoalHistoryViewStore?.data?.GoalHistoryReviewTemplateAssignmentsData)
        ? getGoalHistoryViewStore.data.GoalHistoryReviewTemplateAssignmentsData
        : [];

    // Group goals by category
    const groupedGoals = useMemo(() => {
        const grouped = {};
        goalHistoryViewData.forEach(goal => {
            if (!grouped[goal.category_name]) {
                grouped[goal.category_name] = [];
            }
            grouped[goal.category_name].push(goal);
        });
        return grouped;
    }, [goalHistoryViewData]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status chip configuration
    const getStatusChip = (status) => {
        const statusConfig = {
            'Under_Review': {
                label: 'Under Review',
                icon: <HourglassEmpty />,
                color: 'warning'
            },
            'Not Started': {
                label: 'Not Started',
                icon: <Block />,
                color: 'default'
            },
            'Need_More_Information_Reviewer': {
                label: 'Need_More_Information_Reviewer',
                icon: <EditNote />,
                color: 'error'
            },
            'Finalized': {
                label: 'Finalized',
                icon: <CheckCircle />,
                color: 'success'
            },
            'Completed': {
                label: 'Completed',
                icon: <CheckCircle />,
                color: 'success'
            },
            'In Progress': {
                label: 'In Progress',
                icon: <PendingActions />,
                color: 'info'
            },
            'Approve_Reviewer': {
                label: 'Reviwer Approved',
                icon: <CheckCircle />,
                color: 'success'
            },
        };

        const config = statusConfig[status] || {
            label: status,
            icon: <HourglassEmpty />,
            color: 'default'
        };

        return (
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color}
                size="small"
                variant="filled"
                sx={{ fontWeight: 600 }}
            />
        );
    };

    // Calculate total weightage
    const totalWeightage = useMemo(() => {
        return goalHistoryViewData.reduce((sum, goal) => sum + (goal.tg_goal_weightage || 0), 0);
    }, [goalHistoryViewData]);

    if (goalHistoryViewLoading || goalHistoryReviewLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    const getActivityMessage = (review) => {
        const status = review?.tr_review_status;

        const mappings = {
            'Under_Review': 'Under Review',
            'Approved': 'Approved',
            'Rejected': 'Rejected',
            'Goals_Pending': 'Goals Pending',
            'Need_More_Information_Reviewer': 'Need More Information By Reviewer',
            'Need_More_Information_Super_Admin': 'Need More Information By Super Admin',
            'In_Progress': 'In Progress',
            'Completed': 'Completed',
            'Submitted': 'Submitted',
            'Assigned': 'Assigned',
            'Modify_Correction_Reviewer': 'Modify Correction',
            'Modify_Correction_Super_Admin': 'Modify Correction'
        };

        const label = mappings[status] || (status ? status.replace(/_/g, ' ') : 'Unknown');
        const subject = review?.template_name;

        if (status === 'Submitted') {
            return `The Sub Goal / Sub Task has been submitted for  ${subject}`;
        }

        return `${subject} has been ${label.toLowerCase()}`;
    };

    return (
        <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
            {/* Header Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Goal History & Tracking
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Task ID: {goalHistoryViewData[0]?.ta_generated_id || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Chip
                                icon={<CalendarToday />}
                                label={`Year: ${goalHistoryViewData[0]?.template_year || 'N/A'}`}
                                variant="outlined"
                            />
                            <Chip
                                icon={<Assignment />}
                                label={goalHistoryViewData[0]?.template_name || 'N/A'}
                                color="primary"
                                variant="filled"
                            />
                        </Box>
                    </Grid>
                    <Button
                        onClick={() => window.history.back()}
                        startIcon={<ArrowBackIcon />}
                        sx={{ marginLeft: '44%' }}
                    >
                        Back
                    </Button>
                </Grid>
            </Paper>
            
            {/* User Info Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Assigned User Card */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                    <Person />
                                </Avatar>
                            }
                            title="Assigned To"
                            subheader="Goal Owner"
                        />
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {goalHistoryViewData[0]?.ol_emp_name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <Badge sx={{ mr: 1 }} /> ID: {goalHistoryViewData[0]?.ol_emp_id || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <Work sx={{ fontSize: 'small', mr: 1, verticalAlign: 'middle' }} />
                                {goalHistoryViewData[0]?.ta_assigned_position || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Reviewer Card */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                                    <Reviews />
                                </Avatar>
                            }
                            title="Reviewer"
                            subheader="Evaluation Manager"
                        />
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {goalHistoryViewData[0]?.rl_emp_name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <Badge sx={{ mr: 1 }} /> ID: {goalHistoryViewData[0]?.rl_emp_id || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Card */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                                    <Timeline />
                                </Avatar>
                            }
                            title="Assignment Status"
                            subheader="Current Progress"
                        />
                        <CardContent>
                            <Box sx={{ mb: 2 }}>
                                {getStatusChip(goalHistoryViewData[0]?.ta_status)}
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <CalendarToday sx={{ fontSize: 'small', mr: 1, verticalAlign: 'middle' }} />
                                Assigned: {formatDate(goalHistoryViewData[0]?.ta_assigned_date)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <Schedule sx={{ fontSize: 'small', mr: 1, verticalAlign: 'middle' }} />
                                Due: {formatDate(goalHistoryViewData[0]?.ta_due_date) || 'Not Set'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>


            <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                <CardHeader
                    title={
                        <Box display="flex" alignItems="center" gap={1}>
                            <Assignment sx={{ color: 'primary.main' }} />
                            <Typography variant="h6">Goals Summary</Typography>
                        </Box>
                    }
                    subheader={`Total Weightage: ${totalWeightage}%`}
                    action={
                        <Chip
                            label={`${goalHistoryViewData.length} Goals`}
                            color="primary"
                            variant="outlined"
                        />
                    }
                />
                <Divider />
                <CardContent>
                    <LinearProgress
                        variant="determinate"
                        value={totalWeightage}
                        sx={{ height: 10, borderRadius: 5, mb: 3 }}
                    />

                    {Object.entries(groupedGoals).map(([category, goals]) => (
                        <Accordion key={category} elevation={0} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Category sx={{ mr: 2, color: 'primary.main' }} />
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {category}
                                    </Typography>
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Chip
                                        label={`${goals.reduce((sum, g) => sum + g.tg_goal_weightage, 0)}% / ${goals[0]?.tc_max_weightage}%`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                <TableCell><Typography variant="subtitle2" fontWeight="bold">Goal ID</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2" fontWeight="bold">Target</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2" fontWeight="bold">Timeline</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2" fontWeight="bold">Priority</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2" fontWeight="bold">Weightage</Typography></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {goals.map((goal) => (
                                                <TableRow key={goal.tg_pid} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {goal.tg_goal_generated_id?.match(/GOAL-\d{4}-\d+$/)?.[0] || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={goal.tc_target}>
                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                                {goal.tc_target}
                                                            </Typography>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={<Schedule />}
                                                            label={goal.tg_timeline}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={<PriorityHigh />}
                                                            label={goal.tg_priority}
                                                            size="small"
                                                            color={
                                                                goal.tg_priority === 'High' ? 'error' :
                                                                    goal.tg_priority === 'Medium' ? 'warning' : 'default'
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusChip(goal.tg_status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={goal.tg_goal_weightage}
                                                                sx={{ width: 60, height: 8, borderRadius: 4 }}
                                                            />
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {goal.tg_goal_weightage}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    <strong>KPI Metric:</strong> {goals[0]?.tc_kpi_metric}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </CardContent>
            </Card>


            <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={
                        <Box display="flex" alignItems="center" gap={1}>
                            <History sx={{ color: 'secondary.main' }} />
                            <Typography variant="h6">History</Typography>
                        </Box>
                    }
                />
                <Divider />
                <CardContent>
                    {goalHistoryReviewTemplateAssignmentsData.length > 0 ? (
                        <Stepper orientation="vertical">
                            {goalHistoryReviewTemplateAssignmentsData.map((review, index) => (
                                <Step key={review.tr_pid} active>
                                    <StepLabel
                                        icon={
                                            <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                                                <AssignmentTurnedIn />
                                            </Avatar>
                                        }
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {/* Review #{index + 1} */}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDateTime(review.tr_review_date)}
                                            </Typography>
                                        </Box>
                                    </StepLabel>
                                    <StepContent>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {getActivityMessage(review)}
                                            </Typography>
                                        </Box>
                                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                            <Grid container spacing={2}>
                                                {review.tr_comments !== "" && review.tr_comments !== null ? (
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" gutterBottom>
                                                            <strong>Comments:</strong> {review.tr_comments || 'No comments provided'}
                                                        </Typography>
                                                    </Grid>
                                                ) : null}
                                                <Grid item xs={12} md={6}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Person fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>User:</strong> {review.emp_name}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Assessment fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>Status:</strong>
                                                        </Typography>
                                                        <Box sx={{ ml: 1 }}>
                                                            {getStatusChip(review.tr_review_status)}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </StepContent>
                                </Step>
                            ))}
                        </Stepper>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <HourglassEmpty sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Review History Available
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Reviews will appear here once they are submitted
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

        </Box >
    );
};

export default GoalHistoryViewPage;