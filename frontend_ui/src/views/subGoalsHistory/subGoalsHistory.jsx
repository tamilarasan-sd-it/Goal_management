import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Paper, Typography, Stack, Avatar, Chip, Divider, useTheme, Card, CardHeader, Stepper, Step, StepLabel, Grid, CardContent, StepContent } from '@mui/material';
import { ArrowBack, History, Work, CalendarToday, AssignmentTurnedIn, Person, Assessment, HourglassEmpty, Block, EditNote, CheckCircle, PendingActions } from '@mui/icons-material';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

const SubGoalsHistoryByIdDetails = createSelector(
    state => state?.dataService?.pages?.sub_goal_history,  // ✅ select directly
    (subGoalHistory) => {
        // ✅ Safe fallback if subGoalHistory is undefined
        return {
            loading: {
                SubGoalHistoryByIdLoad: subGoalHistory?.loading?.SubGoalHistoryByIdLoad ?? false,
            },
            data: {
                SubGoalHistoryByIdData: subGoalHistory?.data?.SubGoalHistoryByIdData ?? [],
            }
        };
    }
);
const SubGoalsHistory = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        if (id) {
            dispatch(setLoading("sub_goal_history", "SubGoalHistoryByIdLoad", true));
            dispatch(fetchByIdAction('application/json', "sub_goal_history", "SubGoalHistoryByIdData", "SubGoalHistoryByIdLoad", id));
        }
    }, [id]);

    const getSubGoalsHistoryByIdStore = useSelector(SubGoalsHistoryByIdDetails) ?? {
    loading: { SubGoalHistoryByIdLoad: false },
    data: { SubGoalHistoryByIdData: [] }
};

    const goalSubGoalsHistoryByIdLoading = getSubGoalsHistoryByIdStore?.loading?.SubGoalHistoryByIdLoad || false;

    const SubGoalsHistoryByIdData = Array.isArray(
    getSubGoalsHistoryByIdStore?.data?.SubGoalHistoryByIdData
)
    ? getSubGoalsHistoryByIdStore.data.SubGoalHistoryByIdData
    : [];

    console.log(SubGoalsHistoryByIdData, "SubGoalsHistoryByIdData");


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

    const getActivityMessage = (review) => {
        const status = review?.sbr_review_status;

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
            'Modify_Correction_Reviewer': 'Information Updated to Reviewer',
            'Modify_Correction_Super_Admin': 'Information Updated to Reviewer'
        };

        const label = mappings[status] || (status ? status.replace(/_/g, ' ') : 'Unknown');
        const subject = review?.sub_task_name;

        if (status === 'Submitted') {
            return `The Sub Goal / Sub Task has been submitted for  ${subject}`;
        }

        return `${subject} has been ${label.toLowerCase()}`;
    };


    return (
        <Box
            sx={{
                minHeight: '100vh',
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
            }}
        >
            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                    <Box>
                        <Typography
                            variant="h4"
                            component="h1"
                            fontWeight="800"
                            sx={{
                                background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent'
                            }}
                        >
                            Sub Goal History
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Review the history for the selected subgoal.
                        </Typography>
                    </Box>

                    <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ textTransform: 'none' }}>
                        Back
                    </Button>
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.24)',
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)'
                    }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                                <History />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="700">
                                    Subgoal ID: {id || 'N/A'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    History and review details for this subgoal.
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip icon={<Work />} label="Subgoal" color="primary" />
                            <Chip icon={<CalendarToday />} label="History" variant="outlined" />
                        </Stack>
                    </Stack>
                </Paper>

            </Stack>

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
                    {SubGoalsHistoryByIdData.length > 0 ? (
                        <Stepper orientation="vertical">
                            {SubGoalsHistoryByIdData.map((history, index) => (
                                !history.tgdh_goal_id ? (
                                <Step key={history.tr_pid} active>
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
                                                {formatDateTime(history.sbr_modified_at)}
                                            </Typography>
                                        </Box>
                                    </StepLabel>
                                    <StepContent>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {getActivityMessage(history)}
                                            </Typography>
                                        </Box>
                                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                            <Grid container spacing={2}>
                                                {history.sbr_comments !== "" && history.sbr_comments !== null ? (
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" gutterBottom>
                                                            <strong>Comments:</strong> {history.sbr_comments || 'No comments provided'}
                                                        </Typography>
                                                    </Grid>
                                                ) : null}
                                                <Grid item xs={12} md={6}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Person fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>User:</strong> {history.emp_name}
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
                                                            {getStatusChip(history.sbr_review_status)}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </StepContent>
                                </Step>
                                     ) : (
                                         <Step key={history.tr_pid} active>
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
                                                {formatDateTime(history.tgdh_created_at)}
                                            </Typography>
                                        </Box>
                                    </StepLabel>
                                    <StepContent>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {
                                                    !history.tgdh_goal_id ? (
                                                        <span>{getActivityMessage(history)}</span>
                                                    ) : (
                                                         !history.column_name ? (
                                                            !history.tgdh_emp_name ? (
                                                                 <span>{history.tgdh_column_id}</span>
                                                            ) : (
                                                                <span>Employee</span>
                                                            )  
                                                         ) : (
                                                            <span>{history.column_name}</span>
                                                         )
                                                        
                                                    )
                                                }
                                            </Typography>
                                        </Box>
                                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" gutterBottom>
                                                        <strong>Comments : </strong>
                                                        {
                                                            !history.tgdh_goal_id ? (
                                                                <span>{history.column_name || 'No comments provided'}</span>
                                                            ) : (
                                                                history.tgdh_previous_value && history.tgdh_current_value ? (
                                                                    <span>
                                                                        {history.tgdh_previous_value} <b>Changed to</b> {history.tgdh_current_value}
                                                                    </span>
                                                                ) : (
                                                                    !history.tgdh_emp_name ? (
                                                                        <span>No comments provided</span>
                                                                    ) : (
                                                                        <span>User {history.tgdh_emp_name} has been deactivated</span>
                                                                    )
                                                                    
                                                                )
                                                            )
                                                        }
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Person fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>User:</strong> {history.tgdh_emp_name_by}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </StepContent>
                                </Step>
                                     )
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

        </Box>
    );
};

export default SubGoalsHistory;
