import React, { useEffect, useMemo, useState } from 'react';
import {
    Fade,
    Grid,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    Collapse,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Chip,
    Box,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    alpha,
    Avatar,
    LinearProgress,
    FormHelperText,
    Stack,
    useTheme,
    Divider
} from '@mui/material';
import { TablePagination } from '@mui/material';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { addAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { useParams } from 'react-router-dom';

// Correct icon imports
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    CalendarToday,
    Person,
    People, // For Groups icon
    Description,
    Timeline,
    TrendingUp,
    CheckCircle,
    Comment,
    Pending,
    HourglassEmpty,
    Block,
    Send,
    Close,
    Category,
    Score,
    Badge,
    Work,
    VerifiedUser,
    Insights,
    Download,
    Share,
    Flag, // For priority/flag icon
    Assessment, // For KPI/metrics icon
    Note, // For notes icon
    Task, // For goal/task icon
    Visibility,
    InfoOutlined,
    PendingActions
} from '@mui/icons-material';
import { AllInclusive, DonutLarge, HourglassTop, Block as BlockIcon, CheckCircleOutline } from '@mui/icons-material';

const getGoalReviewerByIdDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['goalReviewerByIdList'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const GoalReviewerByIdListLoad = pageData?.loading?.GoalReviewerByIdListLoad;
            const GoalReviewerByIdListData = pageData?.data?.GoalReviewerByIdListData;
            const GoalReviewerByIdListColumnsLoad = pageData?.loading?.GoalReviewerByIdListColumnsLoad;
            const GoalReviewerByIdListColumnsData = pageData?.data?.GoalReviewerByIdListColumnsData;


            result[page] = {
                loading: {
                    GoalReviewerByIdListLoad: GoalReviewerByIdListLoad,
                    GoalReviewerByIdListColumnsLoad: GoalReviewerByIdListColumnsLoad,
                },
                data: {
                    GoalReviewerByIdListData: GoalReviewerByIdListData,
                    GoalReviewerByIdListColumnsData: GoalReviewerByIdListColumnsData,
                }
            };
        });
        return result.goalReviewerByIdList;
    }
);

const GoalReviewerById = () => {
    const dispatch = useDispatch();
    const loginUserDetails = useSelector(state => state?.auth?.user) || {};
    const { id } = useParams();
    const preDefinedTheme = useTheme();

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [selectedNextStatus, setSelectedNextStatus] = useState('');
    const [comment, setComment] = useState('');
    const [statusError, setStatusError] = useState(false);
    const [commentError, setCommentError] = useState(false);
    const [openRows, setOpenRows] = useState({});

    const [modalOpen, setModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    // Add this helper function at the top of your component or in a utilities file
    const formatStatusLabel = (status) => {
        const statusLabels = {
            'Approve_Reviewer': 'Approve',
            'Modify_Correction_Reviewer': 'Information Updated to Reviewer',
            'Need_More_Information_Reviewer': 'Need More Information',
            'Under_Review': 'Under Review',
            'Submitted': 'Submitted',
            'Assigned': 'Assigned'
            // Add more mappings as needed
        };

        return statusLabels[status] || status.replace(/_/g, ' ');
    };


    const [modalContent, setModalContent] = useState({ title: '', content: '' });

    const handleOpenTextModal = (title, content) => {
        setModalContent({ title, content });
        setModalOpen(true);
    };

    const handleCloseTextModal = () => {
        setModalOpen(false);
        setModalContent({ title: '', content: '' });
    };

    const handleOpenDetailsModal = (goal) => {
        setSelectedGoal(goal);
        setDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedGoal(null);
    };

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRowToggle = (rowId) => {
        setOpenRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const handleOpenStatusModal = () => {
        setOpenStatusModal(true);
        setSelectedNextStatus('');
        setComment('');
        setStatusError(false);
        setCommentError(false);
    };

    const handleCloseStatusModal = () => {
        setOpenStatusModal(false);
    };

    const getAllowedNextStatuses = (currentStatus, empId) => {
        console.log(empId, "empID");

        switch (currentStatus) {
            case 'Under_Review':
                return [
                    { value: 'Approve_Reviewer', label: 'Reviewer_Approved', color: '#10b981', icon: <CheckCircle /> },
                    { value: 'Need_More_Information_Reviewer', label: 'Need_More_Information_Reviewer', color: '#f59e0b', icon: <Comment /> },
                    { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                ];
            case 'Modify_Correction_Reviewer':
                return [
                    { value: 'Approve_Reviewer', label: 'Reviewer_Approved', color: '#10b981', icon: <CheckCircle /> },
                    { value: 'Need_More_Information_Reviewer', label: 'Need_More_Information_Reviewer', color: '#f59e0b', icon: <Comment /> },
                    { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                ];
            default:
                return [];
        }
    };

    useEffect(() => {
        if (id) {
            dispatch(setLoading("goalReviewerByIdList", "GoalReviewerByIdListLoad", true));
            dispatch(fetchByIdAction('application/json', "goalReviewerByIdList", "GoalReviewerByIdListData", "GoalReviewerByIdListLoad", id));

            dispatch(setLoading("goalReviewerByIdList", "GoalReviewerByIdListColumnsLoad", true));
            dispatch(fetchByIdAction('application/json', "goalReviewerByIdList", "GoalReviewerByIdListColumnsData", "GoalReviewerByIdListColumnsLoad", id));
        }
    }, [id]);

    const goalReviewerByIdStore = useSelector(getGoalReviewerByIdDetails) || {};
    // console.log(goalReviewerByIdStore, "goalReviewerByIdStore")
    const goalReviewerByIdLoading = goalReviewerByIdStore?.loading?.GoalReviewerByIdListLoad || false;
    const goalReviewerByIdData = Array.isArray(goalReviewerByIdStore?.data?.GoalReviewerByIdListData)
        ? goalReviewerByIdStore.data.GoalReviewerByIdListData
        : [];
    const goalReviewerByIdColumnsLoad = goalReviewerByIdStore?.loading?.GoalReviewerByIdListColumnsLoad || false;

    const goalReviewerByIdColumnsData = Array.isArray(goalReviewerByIdStore?.data?.GoalReviewerByIdListColumnsData)
        ? goalReviewerByIdStore.data.GoalReviewerByIdListColumnsData
        : [];

    const columnsGroupedByGoalReviewer = useMemo(() => {
        return goalReviewerByIdColumnsData.reduce((acc, col) => {
            if (!acc[col.tg_pid]) acc[col.tg_pid] = [];
            acc[col.tg_pid].push(col);
            return acc;
        }, {});
    }, [goalReviewerByIdColumnsData]);


    const combinedDataReviewer = useMemo(() => {
        return goalReviewerByIdData.map(goal => ({
            ...goal,
            columns: columnsGroupedByGoalReviewer[goal.tg_pid] || []
        }));
    }, [goalReviewerByIdData, columnsGroupedByGoalReviewer]);


    // console.log(combinedDataReviewer, "combineDataReviewer");


    const processedGoalData = useMemo(() => {
        if (!combinedDataReviewer || combinedDataReviewer.length === 0) {
            return {
                categories: [],
                templateInfo: {
                    name: null,
                    year: null,
                    position: null,
                    status: null,
                    reviewerName: null,
                    assigneeName: null
                }
            };
        }

        const templateInfo = {
            name: combinedDataReviewer[0].template_name,
            year: combinedDataReviewer[0].template_year,
            // position: combinedDataReviewer[0].ta_assigned_position,
            status: combinedDataReviewer[0].ta_status,
            reviewerName: combinedDataReviewer[0].rl_emp_name,
            assigneeName: combinedDataReviewer[0].ol_emp_name,
            reviewerId: combinedDataReviewer[0].rl_emp_id,
            generatedId: combinedDataReviewer[0].ta_generated_id
        };

        const categories = {};
        let totalWeightage = 0;
        let usedWeightage = 0;

        combinedDataReviewer.forEach(goal => {
            const categoryId = goal.tc_category_id;
            if (!goal.tg_pid || !categoryId) return;

            if (!categories[categoryId]) {
                categories[categoryId] = {
                    id: categoryId,
                    name: goal.category_name,
                    maxWeightage: goal.tc_max_weightage,
                    description: goal.tc_category_description,
                    kpi: goal.tc_kpi_metric,
                    target: goal.tc_target,
                    subTasks: [],
                    usedWeightage: 0
                };
                totalWeightage += parseFloat(goal.tc_max_weightage) || 0;
            }

            const weightage = parseFloat(goal.tg_goal_weightage) || 0;

            const goalDescriptionColumn = goal.columns.find(c => c.column_name === 'Goal Description');

            categories[categoryId].subTasks.push({
                id: goal.tg_pid,
                name: goalDescriptionColumn ? goalDescriptionColumn.tgd_value : goal.tg_goal_description,
                weightage,
                owner: goal.tg_goal_owner,
                ownername: goal.ol_emp_name,
                mu_completed_weightage: goal.mu_completed_weightage,
                mu_status: goal.mu_status,

                columns: goal.columns || []
            });

            categories[categoryId].usedWeightage += weightage;
            usedWeightage += weightage;
        });

        return {
            categories: Object.values(categories),
            templateInfo,
            weightageMetrics: { totalWeightage, usedWeightage }
        };
    }, [combinedDataReviewer]);

    const goalStatusCounts = useMemo(() => {
        const counts = {
            total_goals: 0,
            Completed: 0,
            'In Progress': 0,
            'Partially Completed': 0,
            'Not Started': 0,
            Blocked: 0,
        };

        if (!combinedDataReviewer || combinedDataReviewer.length === 0) {
            return counts;
        }

        combinedDataReviewer.forEach((goal) => {

            if (!goal.tg_pid) return;

            counts.total_goals++;

            const status = goal.mu_status || goal.tg_status || 'Not Started';
            if (counts.hasOwnProperty(status)) {
                counts[status]++;
            } else if (status !== 'Not Started') {

            }
        });

        return counts;
    }, [combinedDataReviewer]);

    const flatGoalData = useMemo(() => {
        if (!processedGoalData?.categories || processedGoalData?.categories.length === 0) return [];

        const allGoals = [];
        processedGoalData?.categories.forEach(category => {
            category.subTasks.forEach(goal => {
                allGoals.push({
                    ...goal,
                    categoryName: category.name,
                    categoryDescription: category.description,
                    goalWeightage: goal.weightage,
                });
            });
        });
        return allGoals;
    }, [processedGoalData]);

    const { categories, templateInfo, weightageMetrics } = processedGoalData;
    // console.log(categories, "categories")
    const currentTemplateStatus = templateInfo?.status;
    const nextAllowedStatuses = useMemo(() => getAllowedNextStatuses(currentTemplateStatus, loginUserDetails?.id), [currentTemplateStatus]);

    const handleSubmitStatusChange = () => {
        let valid = true;
        if (!selectedNextStatus) { setStatusError(true); valid = false; } else { setStatusError(false); }
        if (!comment.trim()) { setCommentError(true); valid = false; } else { setCommentError(false); }

        if (valid) {
            const statusChangeData = {
                template_pid: goalReviewerByIdData[0]?.template_pid,
                template_status: selectedNextStatus,
                tr_assignment_id: goalReviewerByIdData[0].ta_pid,
                tr_template_id: id,
                tr_reviewer_id: loginUserDetails?.id,
                tr_review_status: selectedNextStatus,
                tr_review_date: new Date().toISOString().split('T')[0],
                tr_comments: comment,
                tr_created_at: new Date().toISOString(),
                tr_modified_at: new Date().toISOString()
            };

            dispatch(setLoading("goalReviewerByIdList", "GoalReviewerByIdListLoad", true));
            dispatch(addAction('application/json', "goalReviewerByIdList", "GoalReviewerByIdListData", "GoalReviewerByIdListLoad", statusChangeData));

            handleCloseStatusModal();
        }
    };

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

            default:
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: status?.replace(/_/g, ' ') || 'Unknown',
                    color: '#6b7280',
                    backgroundColor: alpha('#6b7280', 0.1),
                };
        }
    };

    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 'High':
                return { color: '#ef4444', bgColor: alpha('#ef4444', 0.1) };
            case 'Medium':
                return { color: '#f59e0b', bgColor: alpha('#f59e0b', 0.1) };
            case 'Low':
                return { color: '#10b981', bgColor: alpha('#10b981', 0.1) };
            default:
                return { color: '#6b7280', bgColor: alpha('#6b7280', 0.1) };
        }
    };

    const truncateText = (text, maxLength = 50) => {
        if (typeof text !== 'string' || text.length <= maxLength) {
            return { truncated: text, isTruncated: false };
        }
        return { truncated: text.substring(0, maxLength) + '...', isTruncated: true };
    };

    const IgnoreTableShowingList = [
        'KPI / Success Metric',
        'Target',
        'Monthly Notes',

    ];

    return (
        <>
            <Fade in timeout={800}>
                <Box sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle at top right, #6366f122 0%, transparent 70%)',
                        zIndex: 0,
                    },
                }}>
                    {/* Header Section */}
                    <Box sx={{
                        position: 'relative',
                        zIndex: 1,
                        px: { xs: 2, sm: 3, md: 4 },
                        pt: 3,
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
                                    Template Review Details
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Review and manage goal template
                                </Typography>
                            </Box>

                            {/* <Box sx={{ display: 'flex', gap: 1 }}>

                                {nextAllowedStatuses.length > 0 && (
                                    <Button
                                        variant="contained"
                                        onClick={handleOpenStatusModal}
                                        startIcon={<Send />}
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                                            },
                                        }}
                                    >
                                        Update Status
                                    </Button>
                                )}
                            </Box> */}
                        </Box>
                        {/* Status Count Cards */}
                        <Paper
                            elevation={0}
                            sx={{
                                width: "100%",
                                p: 3,
                                mb: 4,
                                borderRadius: 3,
                                background: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(0,0,0,0.06)",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    transform: "translateY(-3px)",
                                    boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                {[
                                    { label: "Total Sub Goals", key: "total_goals", color: "primary", icon: <AllInclusive /> },
                                    { label: "Not Started", key: "Not Started", color: "info", icon: <DonutLarge /> },
                                    { label: "In Progress", key: "In Progress", color: "warning", icon: <HourglassTop /> },
                                    { label: "Partially Completed", key: "Partially Completed", color: "secondary", icon: <Insights /> },
                                    { label: "Completed", key: "Completed", color: "success", icon: <CheckCircleOutline /> },
                                ].map((item) => (
                                    <Paper
                                        key={item.key}
                                        variant="outlined"
                                        sx={{ flex: '1 1 180px', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                                    >
                                        <Avatar sx={{ bgcolor: `${item.color}.main`, color: 'white' }}>{item.icon}</Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="700">
                                                {goalReviewerByIdLoading ? <Skeleton width={30} /> : (goalStatusCounts[item.key] ?? 0)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: '1 1 300px' }}>
                                    <Avatar sx={{ width: 48, height: 48, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                                        <Work />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="600">{templateInfo?.name || "Untitled Template"}</Typography>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Chip icon={<CalendarToday />} label={templateInfo?.year || "-"} size="small" variant="outlined" />
                                            <Chip label={`ID: ${templateInfo?.generatedId || "N/A"}`} size="small" variant="outlined" />
                                        </Stack>
                                    </Box>
                                </Stack>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }} justifyContent="flex-end" sx={{ flex: '1 1 400px' }}>
                                    {templateInfo?.status && (
                                        <Stack spacing={0.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                                            <Typography variant="caption" color="text.secondary">Status</Typography>
                                            <Chip
                                                icon={getStatusConfig(templateInfo.status).icon}
                                                label={getStatusConfig(templateInfo.status).label}
                                                sx={{
                                                    backgroundColor: getStatusConfig(templateInfo.status).backgroundColor,
                                                    color: getStatusConfig(templateInfo.status).color,
                                                    fontWeight: 600
                                                }}
                                            />
                                        </Stack>
                                    )}
                                    <Stack spacing={0.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                                        <Typography variant="caption" color="text.secondary">Assignee</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                            <Avatar sx={{ width: 30, height: 30, bgcolor: "#6366f1" }}>
                                                <Person sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Typography fontWeight="600" fontSize="0.85rem">
                                                {templateInfo?.assigneeName || "-"}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                    <Stack spacing={0.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                                        <Typography variant="caption" color="text.secondary">Reviewer</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                            <Avatar sx={{ width: 30, height: 30, bgcolor: "#10b981" }}>
                                                <VerifiedUser sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Typography fontWeight="600" fontSize="0.85rem">
                                                {templateInfo?.reviewerName || "-"}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Paper>



                        {/* Categories Section */}
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            {goalReviewerByIdLoading ? (
                                <Box>
                                    {[...Array(3)].map((_, i) => (
                                        <Paper
                                            key={i}
                                            sx={{
                                                mb: 2,
                                                p: 3,
                                                borderRadius: 3,
                                                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                                                backgroundSize: '200% 100%',
                                                animation: 'shimmer 1.5s infinite',
                                            }}
                                        >
                                            <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, mb: 2 }} />
                                            <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 1, mb: 1 }} />
                                            <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 1, width: '80%' }} />
                                        </Paper>
                                    ))}
                                </Box>
                            ) : categories.length > 0 ? (
                                (() => {
                                    const dynamicColumns = flatGoalData.length > 0 ? flatGoalData[0].columns : [];
                                    console.log(dynamicColumns, "dynamicColumns")
                                    return (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                mb: 3,
                                                borderRadius: 3,
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(0,0,0,0.06)',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <TableContainer>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#f8fafc', tableLayout: 'fixed', width: '100%' }}>
                                                            <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>S.No</TableCell>
                                                            <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Goal Category</TableCell>
                                                            {/* <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Category Description</TableCell> */}
                                                            <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Task Weightage</TableCell>
                                                            {dynamicColumns
                                                                .filter(col => !IgnoreTableShowingList.includes(col.column_name))
                                                                .map(col => (
                                                                    <TableCell
                                                                        key={col.column_name}
                                                                        sx={{
                                                                            borderBottom: '2px solid #e2e8f0',
                                                                            fontWeight: 600,
                                                                            color: '#475569',
                                                                        }}
                                                                    >
                                                                        {col.column_name}
                                                                    </TableCell>
                                                                ))}
                                                            <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Monthly Status</TableCell>
                                                            <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Monthly Work Percentage</TableCell>
                                                            <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {flatGoalData
                                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                            .map((goal, index) => (
                                                                <TableRow
                                                                    key={goal.id}
                                                                    hover
                                                                    sx={{
                                                                        '&:hover': { backgroundColor: alpha('#6366f1', 0.02) },
                                                                        transition: 'background-color 0.2s ease'
                                                                    }}
                                                                >
                                                                    {/* Static Columns with Truncation */}
                                                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                                                    <TableCell>
                                                                        <Typography
                                                                            variant="body2"
                                                                            onClick={truncateText(goal.categoryName).isTruncated ? () => handleOpenTextModal('Category Name', goal.categoryName) : undefined}
                                                                            sx={{
                                                                                cursor: truncateText(goal.categoryName).isTruncated ? 'pointer' : 'default',
                                                                                '&:hover': truncateText(goal.categoryName).isTruncated ? { textDecoration: 'underline', color: 'primary.main' } : {}
                                                                            }}
                                                                        >
                                                                            {truncateText(goal.categoryName).truncated}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    {/* <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        onClick={truncateText(goal.categoryDescription).isTruncated ? () => handleOpenTextModal('Category Description', goal.categoryDescription) : undefined}
                                                                        sx={{
                                                                            cursor: truncateText(goal.categoryDescription).isTruncated ? 'pointer' : 'default',
                                                                            '&:hover': truncateText(goal.categoryDescription).isTruncated ? { textDecoration: 'underline', color: 'primary.main' } : {}
                                                                        }}
                                                                    >
                                                                        {truncateText(goal.categoryDescription).truncated}
                                                                    </Typography>
                                                                </TableCell> */}
                                                                    <TableCell>{goal.goalWeightage}%</TableCell>

                                                                    {/* Dynamic Columns */}
                                                                    {dynamicColumns
                                                                        .filter(col => !IgnoreTableShowingList.includes(col.column_name))
                                                                        .map(col => {
                                                                            const cellData = goal.columns.find(
                                                                                c => c.column_name === col.column_name
                                                                            );

                                                                            const cellValue = cellData?.tgd_value?.trim()
                                                                                ? cellData.tgd_value
                                                                                : 'N/A';

                                                                            const { truncated, isTruncated } = truncateText(cellValue);

                                                                            return (
                                                                                <TableCell
                                                                                    key={`${goal.id}-${col.column_name}`}
                                                                                    sx={{
                                                                                        whiteSpace: 'nowrap',
                                                                                        overflow: 'hidden',
                                                                                        textOverflow: 'ellipsis',
                                                                                    }}
                                                                                >

                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        onClick={
                                                                                            isTruncated
                                                                                                ? () => handleOpenTextModal(col.column_name, cellValue)
                                                                                                : undefined
                                                                                        }
                                                                                        sx={{
                                                                                            cursor: isTruncated ? 'pointer' : 'default',
                                                                                            '&:hover': isTruncated
                                                                                                ? { textDecoration: 'underline', color: 'primary.main' }
                                                                                                : {},
                                                                                        }}
                                                                                    >
                                                                                        {truncated}
                                                                                    </Typography>
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                    <TableCell>
                                                                        <Typography variant="body2">{goal.mu_status || 'N/A'}</Typography>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {goal.mu_completed_weightage != null && goal.mu_completed_weightage !== 'N/A' ? (
                                                                            <>
                                                                                <LinearProgress
                                                                                    variant="determinate"
                                                                                    value={Math.min(parseFloat(goal.mu_completed_weightage) || 0, 100)}
                                                                                    sx={{
                                                                                        height: { xs: 5, sm: 6 },
                                                                                        borderRadius: 3,
                                                                                        bgcolor: alpha(preDefinedTheme.palette.primary.main, 0.1)
                                                                                    }}
                                                                                />
                                                                                <Typography variant="body2">{goal.mu_completed_weightage}%</Typography>
                                                                            </>
                                                                        ) : <Typography variant="body2">N/A</Typography>}
                                                                    </TableCell>

                                                                    <TableCell align="center">
                                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                                            <Tooltip title="View Details">
                                                                                <IconButton
                                                                                    onClick={() => handleOpenDetailsModal(goal)}
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
                                                                        </Stack>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            <TablePagination
                                                rowsPerPageOptions={[10, 25, 50]}
                                                component="div"
                                                count={flatGoalData.length}
                                                rowsPerPage={rowsPerPage}
                                                page={page}
                                                onPageChange={handleChangePage}
                                                onRowsPerPageChange={handleChangeRowsPerPage}
                                            />
                                        </Paper>
                                    );
                                })()
                            ) : !goalReviewerByIdLoading && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 8,
                                        textAlign: 'center',
                                        borderRadius: 3,
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '2px dashed #cbd5e1',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <Box sx={{
                                        width: 120,
                                        height: 120,
                                        margin: '0 auto 24px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                    }}>
                                        <Task sx={{ fontSize: 48 }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="600" color="#475569" gutterBottom>
                                        No Goals Found
                                    </Typography>
                                    <Typography variant="body1" color="#94a3b8" sx={{ maxWidth: 400, mx: 'auto' }}>
                                        There are no goals defined for this template yet.
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Fade>

            {/* Status Change Modal */}
            {/* <Dialog
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

                    {nextAllowedStatuses.length > 0 ? (
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
                                    {nextAllowedStatuses.map((statusOption) => (
                                        <MenuItem
                                            key={statusOption.value}
                                            value={statusOption.value}
                                            sx={{ color: statusOption.color }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {statusOption.icon}
                                                {formatStatusLabel(statusOption.label)}
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
                                required
                            />
                        </>
                    ) : (
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
                    )}
                </DialogContent>

                {nextAllowedStatuses.length > 0 && (
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
                            disabled={!selectedNextStatus || !comment.trim()}
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
            </Dialog> */}

            <style jsx global>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
            <Dialog open={modalOpen} onClose={handleCloseTextModal} fullWidth maxWidth="sm">
                <DialogTitle sx={{
                    pb: 2,
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700" color="#1e293b">
                            {modalContent.title}
                        </Typography>
                        <IconButton onClick={handleCloseTextModal} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                        {modalContent.content}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <Button onClick={handleCloseTextModal} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* below for showing all details completely */}
            <Dialog open={detailsModalOpen} onClose={handleCloseDetailsModal} fullWidth maxWidth="md">
                <DialogTitle sx={{ pb: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700" color="#1e293b">
                            Goal Details
                        </Typography>
                        <IconButton onClick={handleCloseDetailsModal} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    {selectedGoal && (
                        (() => {
                            const categoryName = selectedGoal.categoryName?.trim() ? selectedGoal.categoryName : 'N/A';
                            const categoryDescription = selectedGoal.categoryDescription?.trim() ? selectedGoal.categoryDescription : 'N/A';

                            const { truncated: truncatedCategoryName, isTruncated: isCategoryNameTruncated } = truncateText(categoryName);
                            const { truncated: truncatedCategoryDesc, isTruncated: isCategoryDescTruncated } = truncateText(categoryDescription);

                            return (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Category Name</Typography>
                                        <Typography
                                            variant="body1"
                                            onClick={isCategoryNameTruncated ? () => handleOpenTextModal('Category Name', categoryName) : undefined}
                                            sx={{
                                                cursor: isCategoryNameTruncated ? 'pointer' : 'default',
                                                '&:hover': isCategoryNameTruncated ? { textDecoration: 'underline', color: 'primary.main' } : {},
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {truncatedCategoryName}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Task Weightage</Typography>
                                        <Typography variant="body1">{selectedGoal.goalWeightage}%</Typography>
                                    </Grid>

                                    <Grid item xs={12}><Box sx={{ my: 1, borderTop: '1px dashed #e2e8f0' }} /></Grid>
                                    {selectedGoal.columns.map(col => {
                                        const { truncated, isTruncated } = truncateText(col.tgd_value || 'N/A');
                                        return (
                                            <Grid item xs={12} sm={6} key={col.tgd_pid}>
                                                <Typography variant="caption" color="text.secondary">{col.column_name}</Typography>
                                                <Typography
                                                    variant="body1"
                                                    onClick={isTruncated ? () => handleOpenTextModal(col.column_name, col.tgd_value) : undefined}
                                                    sx={{
                                                        cursor: isTruncated ? 'pointer' : 'default',
                                                        '&:hover': isTruncated ? { textDecoration: 'underline', color: 'primary.main' } : {},
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {isTruncated ? truncated : (col.tgd_value?.trim() ? col.tgd_value : 'N/A')}
                                                </Typography>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            );
                        })()
                    )}
                </DialogContent>
                <DialogActions sx={{
                    p: 2,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    background: '#f8fafc',
                }}>
                    <Button onClick={handleCloseDetailsModal} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GoalReviewerById;