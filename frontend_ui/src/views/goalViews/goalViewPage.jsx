import React, { useEffect, useMemo, useState } from 'react';
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
    Grid, Autocomplete, TextField, Button, TablePagination,
    Dialog,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    DialogActions,
    DialogContent,
    Alert
} from '@mui/material';

import {
    Visibility,
    CheckCircle,
    PendingActions,
    HourglassEmpty,
    Block,
    EditNote,
    Badge,
    AddCircle,
    History,
    InfoOutlined,
    Close,
    Comment as CommentIcon,
    Send,
    EmojiEvents,
} from '@mui/icons-material';

import FilterListOff from '@mui/icons-material/FilterListOff';

import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, fetchByIdAction, addAction } from '../../StoreRedux/actions/commonActions';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ---- Design tokens ----
const INDIGO = '#4F46E5';
const INDIGO_DARK = '#3730A3';
const CORAL = '#FF6B6B';
const MINT = '#2EC4B6';
const SUNNY = '#FFB800';
const INK = '#292B3D';
const SLATE = '#767A94';
const BG = '#F5F6FB';
const LINE = '#ECEDF6';

// Friendly rotating avatar palette
const AVATAR_COLORS = ['#6C5CE7', '#00B894', '#FD79A8', '#0984E3', '#E17055', '#00CEC9', '#FDCB6E', '#A29BFE'];
const getAvatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getGoalViewPageDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['goal_view_page'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const GoalViewPageLoad = pageData?.loading?.GoalViewPageLoad;
            const GoalViewPageData = pageData?.data?.GoalViewPageData;

            const SubGoalViewPageData = pageData?.data?.SubGoalViewPageData;
            const SubGoalViewPageLoad = pageData?.loading?.SubGoalViewPageLoad;

            result[page] = {
                loading: {
                    GoalViewPageLoad: GoalViewPageLoad,
                    SubGoalViewPageLoad: SubGoalViewPageLoad,
                },
                data: {
                    GoalViewPageData: GoalViewPageData,
                    SubGoalViewPageData: SubGoalViewPageData
                }
            };
        });
        return result.goal_view_page;
    }
);

const GoalViewPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id }   = useParams();
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

    const goalViewPageStore = useSelector(getGoalViewPageDetails) || {};
    const GoalViewPageData = Array.isArray(goalViewPageStore?.data?.GoalViewPageData)
        ? goalViewPageStore.data.GoalViewPageData
        : [];

    const goalViewPageLoading = goalViewPageStore?.loading?.GoalViewPageLoad || false;

    const SubGoalViewPageStoreData = Array.isArray(goalViewPageStore?.data?.SubGoalViewPageData)
        ? goalViewPageStore.data.SubGoalViewPageData
        : [];
    const subGoalViewPageStoreLoading = goalViewPageStore?.loading?.SubGoalViewPageLoad || false;

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [selectedNextStatus, setSelectedNextStatus] = useState('');
    const [statusError, setStatusError] = useState(false);
    const [comment, setComment] = useState('');
    const [commentError, setCommentError] = useState(false);

    const [selectedAssignment, setSelectedAssignment] = useState(null);




    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (field, value) => {
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
    };

    const filteredData = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');

        let data = [...GoalViewPageData];

        const uniqueMap = new Map();
        data.forEach(item => {
            if (!uniqueMap.has(item.ta_pid)) {
                uniqueMap.set(item.ta_pid, item);
            }
        });

        data = Array.from(uniqueMap.values());

        data = data.map(template => ({
            ...template,
            subGoals: SubGoalViewPageStoreData.filter(
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
    }, [location.search, GoalViewPageData, SubGoalViewPageStoreData, filters]);



    const isFiltersApplied = Object.values(filters).some(value => value !== null);

    const pageTitle = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        if (status) {
            // Replace underscores with spaces for a readable title
            return `${status.replace(/_/g, ' ')} Goals`;
        }
        return 'Goal Views';
    }, [location.search]);



    const handleViewClick = (templateId) => {
        navigate(`/goal-views/${templateId}`);
    };
    const handleAddClick = (templateAssignId) => {
        navigate(`/add-goals/${templateAssignId}`);
    }

    const filterOptions = useMemo(() => {
        const uniqueValues = (key) => [...new Set(GoalViewPageData.map(item => item[key]).filter(Boolean))];
        return {
            templateIds: uniqueValues('ta_generated_id'),
            templateNames: uniqueValues('template_name'),
            years: uniqueValues('template_year'),
            statuses: uniqueValues('ta_status'),
            owners: uniqueValues('assign_employee_name'),
            reviewers: uniqueValues('reviewer_employee_name'),
        };
    }, [GoalViewPageData]);

    useEffect(() => {
        if (!user?.id || !id) return;
        const params = new URLSearchParams(location.search);
        const status = params.get('status');

        dispatch(setLoading("goal_view_page", "GoalViewPageLoad", true));
        const payload = status ? { user_id: user.id, temp_id: id, status } : { user_id: user.id, temp_id: id };
        dispatch(fetchByIdAction('application/json', 'goal_view_page', 'GoalViewPageData', 'GoalViewPageLoad', payload));
        /* if (status) {
            // Decode URL-encoded spaces and then replace underscores with spaces for the API.
            const payload = { user_id: user?.id, status: status }; // decodeURIComponent(status).replace(/_/g, ' ') 

            dispatch(fetchByIdAction('application/json', 'goal_view_page', 'GoalViewPageData', 'GoalViewPageLoad', JSON.stringify(payload)));
        } else {
            dispatch(fetchByIdAction('application/json', 'goal_view_page', 'GoalViewPageData', 'GoalViewPageLoad', user?.id));
        } */
    }, [dispatch, user?.id, location.search]);

    useEffect(() => {

        dispatch(setLoading("goal_view_page", "SubGoalViewPageData", true));
        dispatch(fetchAction('application/json', "goal_view_page", "SubGoalViewPageData", "SubGoalViewPageLoad"));

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

    const allowedStatusesForAddGoal = [
        'Assigned',
        'Submitted',
    ];
    const allowedStatusesForModifyGoal = [
        'Need_More_Information_Reviewer',
        'Need_More_Information_Super_Admin',
    ]

    function canMoveStatusFlow(GoalViewPageData, assignmentId) {

        const assignmentData = GoalViewPageData.filter(
            item => item.ta_pid === assignmentId
        );

        if (assignmentData.length === 0) return false;

        const categoryMap = {};

        assignmentData.forEach(item => {
            const tcPid = item.tc_pid;
            const tgPid = item.tg_pid;

            if (!categoryMap[tcPid]) {
                categoryMap[tcPid] = {
                    maxWeightage: Number(item.tc_max_weightage) || 0,
                    totalGoalWeightage: 0,
                    countedGoals: new Set(),
                    hasInvalidGoal: false
                };
            }

            if (tgPid != null) {

                // prevent duplicate goal counting
                if (categoryMap[tcPid].countedGoals.has(tgPid)) {
                    return;
                }

                categoryMap[tcPid].countedGoals.add(tgPid);

                if (item.tg_goal_weightage == null) {
                    categoryMap[tcPid].hasInvalidGoal = true;
                } else {
                    categoryMap[tcPid].totalGoalWeightage += Number(item.tg_goal_weightage);
                }
            }
        });

        // validate each category
        for (const tcPid in categoryMap) {
            const category = categoryMap[tcPid];

            if (category.hasInvalidGoal) return false;

            if (category.totalGoalWeightage !== category.maxWeightage) {
                return false;
            }
        }

        return true;
    }


    const selectedAssignmentData = useMemo(() => {
        if (!selectedAssignment) return [];

        return GoalViewPageData.filter(
            item => item.ta_pid === selectedAssignment.ta_pid
        );
    }, [GoalViewPageData, selectedAssignment]);


    const isAllGoalsCompleted = useMemo(() => {
        if (!selectedAssignmentData.length) return false;

        return selectedAssignmentData.every(
            item => Number(item.mu_completed_weightage) === 100
        );
    }, [selectedAssignmentData]);


    const isAllowed = useMemo(() => {
        if (!selectedAssignment) return false;
        return canMoveStatusFlow(GoalViewPageData, selectedAssignment.ta_pid);
    }, [GoalViewPageData, selectedAssignment]);



    const getAllowedNextStatuses = (currentStatus, userId, assignEmpId, isAllowed, isAllGoalsCompleted, subgoalsFiltered) => {

        const HRPORTAL_ID = '12345';


        const HR_APPROVE = { value: 'Approved', label: 'Approved By HR', color: '#10b981', icon: <CheckCircle /> };
        const NEED_INFO_SUPER_ADMIN = { value: 'Need_More_Information_Super_Admin', label: 'Need More Information By Super Admin', color: '#f59e0b', icon: <CommentIcon /> };
        const REJECTED = { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> };

        // Null checks — subgoal status not yet updated
        const is_all_approved_by_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(
            sg => sg.sbr_review_status === 'Approve_Reviewer'
        );
        const is_any_approved_by_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Approve_Reviewer'
        );

        // Subgoal status condition flags

        const is_all_approved_by_super_admin = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(
            sg => sg.sbr_review_status === 'Approved'
        );


        const is_all_rejected = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(
            sg => sg.sbr_review_status === 'Rejected'
        );

        const is_any_rejected = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Rejected'
        );
        const is_any_need_more_info_super_admin = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Need_More_Information_Super_Admin'
        );

        const is_any_need_more_info_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Need_More_Information_Reviewer'
        );

        const is_any_modify_correction_super_admin = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(
            sg => sg.sbr_review_status === 'Modify_Correction_Super_Admin'
        );




        const getStatusOptions = () => {

            // 6a. All subgoals are null → block with alert
            if (is_all_approved_by_reviewer) return {
                blocked: true,
                alertMessage: 'Please update all sub goal statuses before proceeding further.',
                options: []
            };

            // 6b. Any one subgoal is null → block with alert
            if (is_any_approved_by_reviewer) return {
                blocked: true,
                alertMessage: 'Please update all sub goal statuses. You cannot proceed until all sub goals have a status.',
                options: []
            };


            // 1. All approved_reviewer → allow approved only
            if (is_all_approved_by_super_admin) return { blocked: false, alertMessage: null, options: [HR_APPROVE] };

            // 2. All rejected → Rejected only
            if (is_all_rejected) return { blocked: false, alertMessage: null, options: [REJECTED] };

            // 4 & 5. Any need more info (covers mixed: approve + need more info + reject) → Need More Info only
            if (is_any_need_more_info_super_admin) return { blocked: false, alertMessage: null, options: [NEED_INFO_SUPER_ADMIN] };

            // 3. Any rejected (no need more info present) → Need More Info only
            if (is_any_rejected) return { blocked: false, alertMessage: null, options: [NEED_INFO_SUPER_ADMIN] };


            // Default → show both HR_Approve and Need More Info
            return { blocked: false, alertMessage: null, options: [HR_APPROVE, NEED_INFO_SUPER_ADMIN] };
        };


        switch (currentStatus) {
            case 'Under_Review':
                return [];
            case 'Rejected':
                return [];
            case 'Goals_Pending':
                return [];
            case 'Submitted':
                if (assignEmpId == userId && isAllowed) {
                    return [
                        { value: 'Under_Review', label: 'Under Review', color: '#3b82f6', icon: <HourglassEmpty /> },
                    ];
                }
                return [];
            case 'Need_More_Information_Reviewer':
                if (assignEmpId == userId) {

                    if (!isAllowed) {
                        return {
                            blocked: true,
                            alertMessage: 'Please ensure all Sub Goal weightages sum to 100% for each category before proceeding.',
                            options: []
                        }
                    }

                    if (is_any_need_more_info_reviewer) {
                        return {
                            blocked: true,
                            alertMessage: 'Some subgoals need more information as per reviewer. Please address those before proceeding.',
                            options: []
                        }
                    }

                    if (is_any_rejected) {
                        return {
                            blocked: true,
                            alertMessage: 'Some subgoals have been rejected. Please change them or remove the subgoals.',
                            options: []
                        }
                    }

                    return [
                        { value: 'Modify_Correction_Reviewer', label: 'Information Updated to Reviewer', color: '#10b981', icon: <CommentIcon /> },
                    ];
                }
                return [];
            case 'Approve_Reviewer':
                if (HRPORTAL_ID == userId) {
                    // return [
                    //     { value: 'Approved', label: 'Approved By HR', color: '#10b981', icon: <CheckCircle /> },
                    //     { value: 'Need_More_Information_Super_Admin', label: 'Need More Information By Super Admin', color: '#f59e0b', icon: <CommentIcon /> },
                    //     { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                    // ];

                    return getStatusOptions();
                }
                return [];

            case 'Need_More_Information_Super_Admin':
                if (assignEmpId == userId) {
                    if (is_any_need_more_info_super_admin) return {
                        blocked: true,
                        alertMessage: 'Some subgoals need more information as per super admin. Please address those before proceeding.',
                        options: []
                    }
                    if (is_any_rejected) return {
                        blocked: true,
                        alertMessage: 'Some subgoals have been rejected. Please change them or remove the subgoals.',
                        options: []
                    }

                    return [
                        { value: 'Modify_Correction_Super_Admin', label: 'Information Updated to Reviewer', color: '#10b981', icon: <CommentIcon /> },
                    ];
                }
                return [];
            case 'Modify_Correction_Super_Admin':
                if (HRPORTAL_ID == userId) {
                    // return [
                    //     { value: 'Approved', label: 'Approved By HR', color: '#10b981', icon: <CheckCircle /> },
                    //     { value: 'Need_More_Information_Super_Admin', label: 'Need More Information By Super Admin', color: '#f59e0b', icon: <CommentIcon /> },
                    //     { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                    // ];

                    // Modify_Correction_Super_Admin
                    if (is_any_modify_correction_super_admin) return {
                        blocked: true,
                        alertMessage: 'Some subgoals are still in Modify Correction status as per Owner. Please address those before proceeding.',
                        options: []
                    }

                    return getStatusOptions();
                }
                return [];
            case 'Approved':

                return [];
            case 'In_Progress':
                if (assignEmpId == userId && isAllGoalsCompleted) {
                    return [
                        { value: 'Completed', label: 'Completed', color: '#10b981', icon: <CheckCircle /> }
                    ];
                }
                return [];

            default:
                return [];
        }
    };

    const currentTemplateStatus = selectedAssignment?.ta_status;
    const nextAllowedStatuses = useMemo(() => {
        if (!selectedAssignment) return { blocked: false, alertMessage: null, options: [] };

        return getAllowedNextStatuses(
            selectedAssignment.ta_status,
            user?.id,
            selectedAssignment.assign_employee_id,
            isAllowed,
            isAllGoalsCompleted,
            selectedAssignment.subGoals || []  //  pass attached subGoals
        );
    }, [
        selectedAssignment,
        user?.id,
        isAllowed,
        isAllGoalsCompleted
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

            dispatch(setLoading("goal_view_page", "GoalViewPageLoad", true));
            dispatch(addAction('application/json', "goal_view_page", "GoalViewPageData", "GoalViewPageLoad", statusChangeData));

            handleCloseStatusModal();

        }
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
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

                @keyframes rowPop {
                    0% { opacity: 0; transform: translateY(10px) scale(0.99); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.9); }
                    60% { opacity: 1; transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
                .goal-row {
                    animation: rowPop 0.35s ease both;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
                }
                .goal-row:hover {
                    transform: translateY(-2px) scale(1.003);
                    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.12);
                    z-index: 1;
                    position: relative;
                }
                .goal-icon-btn {
                    transition: transform 0.15s ease, background-color 0.15s ease;
                }
                .goal-icon-btn:hover {
                    transform: scale(1.15) rotate(-4deg);
                }
                .goal-title-emoji {
                    display: inline-block;
                    animation: bounceIn 0.6s ease both;
                }
            `}</style>

            <Fade in timeout={800}>
                <Box sx={{
                    px: { xs: 1, sm: 2, md: 3 },
                    py: 3,
                    minHeight: 'calc(100vh - 64px)',
                    background: BG,
                    fontFamily: "'Inter', sans-serif",
                }}>

                    <Box sx={{ mb: 3 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                            mb: 1,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box className="goal-title-emoji" sx={{
                                    width: 48, height: 48, borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${INDIGO} 0%, #7C6FF0 100%)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 6px 16px ${alpha(INDIGO, 0.35)}`,
                                }}>
                                    <EmojiEvents sx={{ color: '#fff', fontSize: 26 ,width: '1.4em', height: '1.4em',margin: '0.2em' }} />

                                </Box>
                                <Box>
                                    <Typography
                                        variant="h4"
                                        component="h1"
                                        sx={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontWeight: 700,
                                            color: INK,
                                            fontSize: { xs: '1rem', sm: '1.3rem' },
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {pageTitle}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: SLATE, fontWeight: 500 }}>
                                        {filteredData.length} template{filteredData.length !== 1 ? 's' : ''} to keep an eye on
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                onClick={() => window.history.back()}
                                startIcon={<ArrowBackIcon />}
                                sx={{
                                    fontSize: '0.9rem',
                                    color: INDIGO,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    background: '#fff',
                                    borderRadius: '12px',
                                    px: 2.5,
                                    py: 1,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    '&:hover': { background: alpha(INDIGO, 0.06) },
                                }}
                            >
                                Back
                            </Button>
                        </Box>
                    </Box>

                    {/* Filter Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            mb: 3,
                            borderRadius: '18px',
                            background: '#fff',
                            boxShadow: '0 2px 14px rgba(41, 43, 61, 0.06)',
                        }}
                    >
                        <Grid container spacing={2} alignItems="center">

                            <Grid item xs={12} sm={6} md={6} lg={4}>
                                <Autocomplete
                                    size="small"
                                    sx={{ width: 200 }}
                                    options={filterOptions.templateNames}
                                    value={filters.templateName}
                                    onChange={(event, newValue) => handleFilterChange('templateName', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Template Name" />}
                                    ListboxProps={{ style: { maxHeight: '160px' } }}
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
                                    ListboxProps={{ style: { maxHeight: '160px' } }}
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
                                                        backgroundColor: cfg.color,
                                                        color: '#fff',
                                                        fontWeight: 700,
                                                        height: '28px',
                                                        '& .MuiChip-icon': { marginLeft: '6px', color: '#fff' }
                                                    }}
                                                />
                                            </li>
                                        );
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Status" />}
                                    ListboxProps={{ style: { maxHeight: '160px' } }}
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
                                    ListboxProps={{ style: { maxHeight: '160px' } }}
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
                                    ListboxProps={{ style: { maxHeight: '160px' } }}
                                />
                            </Grid>
                            {isFiltersApplied && (
                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="text"
                                        size="small"
                                        startIcon={<FilterListOff />}
                                        onClick={handleClearFilters}
                                        sx={{ color: CORAL, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Clear filters
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Table Section */}
                    <Box>
                        {goalViewPageLoading || filteredData.length > 0 ? (
                            <Paper
                                elevation={2}
                                sx={{
                                    borderRadius: '18px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(41, 43, 61, 0.07)',
                                }}
                            >
                                <TableContainer sx={{
                                    maxHeight: 'calc(100vh - 320px)',
                                    '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                                    '&::-webkit-scrollbar-track': { background: BG },
                                    '&::-webkit-scrollbar-thumb': { background: alpha(INDIGO, 0.3), borderRadius: '4px' },
                                    '&::-webkit-scrollbar-thumb:hover': { background: INDIGO },
                                }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                             <TableRow sx={{
                                                '& .MuiTableCell-root': {
                                                    background: `linear-gradient(135deg, ${INDIGO} 0%, #7C6FF0 100%)`,
                                                    color: '#ffffff !important',
                                                    fontWeight: 700,
                                                    fontSize: '0.82rem',
                                                    fontFamily: "'Poppins', sans-serif",
                                                    border: 'none',
                                                    padding: '14px 16px',
                                                    height: '52px',
                                                    whiteSpace: 'nowrap',
                                                },
                                            }}>
                                                <TableCell sx={{ minWidth: '70px' }}>S.No</TableCell>
                                                <TableCell sx={{ minWidth: '180px' }}>Template Name</TableCell>
                                                <TableCell sx={{ minWidth: '90px' }}>Year</TableCell>
                                                <TableCell sx={{ minWidth: '150px' }}>Status</TableCell>
                                                <TableCell sx={{ minWidth: '170px' }}>Owner</TableCell>
                                                <TableCell sx={{ minWidth: '170px' }}>Reviewer</TableCell>
                                                <TableCell sx={{ minWidth: '150px', textAlign: 'center' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {goalViewPageLoading ? (
                                                Array.from({ length: 5 }).map((_, index) => (
                                                    <TableRow key={index}>
                                                        {Array.from({ length: 8 }).map((_, i) => (
                                                            <TableCell key={i} sx={{ padding: '12px 16px' }}>
                                                                 <Skeleton height={20} sx={{ borderRadius: '8px' }} />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                filteredData
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((template, index) => {
                                                        const statusConfig = getStatusConfig(template.ta_status);

                                                        const rowAssignmentData = GoalViewPageData.filter(
                                                            item => item.ta_pid === template.ta_pid
                                                        );

                                                        const rowIsAllowed = canMoveStatusFlow(
                                                            GoalViewPageData,
                                                            template.ta_pid
                                                        );

                                                        const rowIsAllGoalsCompleted =
                                                            rowAssignmentData.length > 0 &&
                                                            rowAssignmentData.every(
                                                                item => Number(item.mu_completed_weightage) === 100
                                                            );
                                                        const subgoalsFiltered = template?.subGoals || [];

                                                        const rowNextAllowedStatuses = getAllowedNextStatuses(
                                                            template.ta_status,
                                                            user?.id,
                                                            template.assign_employee_id,
                                                            rowIsAllowed,
                                                            rowIsAllGoalsCompleted,
                                                            subgoalsFiltered
                                                        );

                                                        const isRejected = template.ta_status === 'Rejected';
                                                        const ownerColor = getAvatarColor(template.assign_employee_name);
                                                        const reviewerColor = getAvatarColor(template.reviewer_employee_name || 'reviewer');

                                                        return (
                                                            <TableRow
                                                                key={index}
                                                                className="goal-row"
                                                                style={{
                                                                    animationDelay: `${index * 0.04}s`,
                                                                    backgroundColor: isRejected
                                                                        ? alpha(CORAL, 0.08)
                                                                        : (index % 2 === 1 ? '#FAFAFF' : '#fff'),
                                                                }}
                                                                sx={{
                                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                                    '& td': {
                                                                        padding: '12px 16px',
                                                                        borderBottom: `1px solid ${LINE}`,
                                                                        fontSize: '0.875rem',
                                                                        color: INK,
                                                                    },
                                                                }}
                                                            >
                                                                <TableCell><Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: SLATE }}>{page * rowsPerPage + index + 1}
                                                                    </Typography></TableCell>

                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: INK }}>
                                                                        {template.template_name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={template.template_year}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: alpha(MINT, 0.15),
                                                                            color: '#0D9488',
                                                                            fontWeight: 700,
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
                                                                            backgroundColor: statusConfig.color,
                                                                            color: '#fff',
                                                                            fontWeight: 700,
                                                                            fontSize: '0.72rem',
                                                                            height: '26px',
                                                                            boxShadow: `0 3px 8px ${alpha(statusConfig.color, 0.35)}`,
                                                                            '& .MuiChip-icon': {
                                                                                marginLeft: '6px',
                                                                                color: '#fff',
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Avatar sx={{
                                                                            width: 30,
                                                                            height: 30,
                                                                            fontSize: '0.85rem',
                                                                            fontWeight: 700,
                                                                            bgcolor: ownerColor,
                                                                            color: '#fff',
                                                                        }}>
                                                                            {template.assign_employee_name?.charAt(0) || 'U'}
                                                                        </Avatar>
                                                                        <Typography variant="body2" sx={{ color: INK, fontWeight: 500 }}>
                                                                            {template.assign_employee_name}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Avatar sx={{
                                                                            width: 30,
                                                                            height: 30,
                                                                            fontSize: '0.85rem',
                                                                            fontWeight: 700,
                                                                            bgcolor: reviewerColor,
                                                                            color: '#fff',
                                                                        }}>
                                                                            {template.reviewer_employee_name?.charAt(0) || 'R'}
                                                                        </Avatar>
                                                                        <Typography variant="body2" sx={{ color: INK, fontWeight: 500 }}>
                                                                            {template.reviewer_employee_name}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                               {/*  <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {template.ta_generated_id || 'N/A'}
                                                                    </Typography>
                                                                </TableCell> */}
                                                                <TableCell align="center">
                                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                                        <Tooltip title="View Details">
                                                                            <IconButton
                                                                                className="goal-icon-btn"
                                                                                onClick={() => handleViewClick(template.ta_pid)}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: alpha(INDIGO, 0.12),
                                                                                    color: INDIGO,
                                                                                    '&:hover': { backgroundColor: INDIGO, color: '#fff' },
                                                                                }}
                                                                            >
                                                                                <Visibility fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        {user?.id !== '12345' && user?.id !== '1400' && allowedStatusesForAddGoal.includes(template.ta_status) && (
                                                                            <Tooltip title="Add Goals">
                                                                                <IconButton
                                                                                    className="goal-icon-btn"
                                                                                    onClick={() => handleAddClick(template.ta_pid)}
                                                                                    size="small"
                                                                                    color="primary"
                                                                                    sx={{
                                                                                        backgroundColor: alpha('#22C55E', 0.12),
                                                                                        color: '#16A34A',
                                                                                        '&:hover': { backgroundColor: '#22C55E', color: '#fff' },
                                                                                    }}
                                                                                >
                                                                                    <AddCircle fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                        {user?.id !== '12345'  && user?.id !== '1400' && allowedStatusesForModifyGoal.includes(template.ta_status) && (
                                                                            <Tooltip title="Modify Goals">
                                                                                <IconButton
                                                                                    className="goal-icon-btn"
                                                                                    onClick={() => handleAddClick(template.ta_pid)}
                                                                                    size="small"
                                                                                    color="primary"
                                                                                    sx={{
                                                                                        backgroundColor: alpha(SUNNY, 0.18),
                                                                                        color: '#B45309',
                                                                                        '&:hover': { backgroundColor: SUNNY, color: '#fff' },
                                                                                    }}
                                                                                >
                                                                                    <EditNote fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}

                                                                        {/*  Show status change button if options exist OR if blocked (so user sees the alert in modal) */}
                                                                        {(() => {
                                                                            const isArray = Array.isArray(rowNextAllowedStatuses);
                                                                            const showButton = isArray ? rowNextAllowedStatuses.length > 0 : (rowNextAllowedStatuses?.options?.length > 0 || rowNextAllowedStatuses?.blocked);
                                                                            // const tooltipText = isArray ? "Status Changes4560" : (rowNextAllowedStatuses?.blocked ? "Sub goal statuses pending" : "Status Changes1230");
                                                                            const bgColor = isArray ? 'rgba(249, 115, 22, 0.08)' : (rowNextAllowedStatuses?.blocked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(249, 115, 22, 0.08)');
                                                                            const hoverBgColor = isArray ? 'rgba(249, 115, 22, 0.15)' : (rowNextAllowedStatuses?.blocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)');

                                                                        //     return showButton ? (
                                                                        //         <Tooltip title={tooltipText}>
                                                                        //             <IconButton
                                                                        //                 size="small"
                                                                        //                 onClick={() => handleOpenStatusModal(template)}
                                                                        //                 sx={{
                                                                        //                     backgroundColor: bgColor,
                                                                        //                     '&:hover': {
                                                                        //                         backgroundColor: hoverBgColor,
                                                                        //                     }
                                                                        //                 }}
                                                                        //             >
                                                                        //                 <ChangeHistory fontSize="small" />
                                                                        //             </IconButton>
                                                                        //         </Tooltip>
                                                                        //     ) : null;
                                                                        })()}
                                                                        <Tooltip title="View History">
                                                                            <IconButton
                                                                                className="goal-icon-btn"
                                                                                onClick={() => navigate(`/goal-history/${template.ta_pid}`)}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: alpha('#A855F7', 0.12),
                                                                                    color: '#9333EA',
                                                                                    '&:hover': { backgroundColor: '#A855F7', color: '#fff' },
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
                                    p: 5,
                                    textAlign: 'center',
                                    borderRadius: '18px',
                                    background: '#fff',
                                    boxShadow: '0 4px 20px rgba(41, 43, 61, 0.07)',
                                }}
                            >
                                <Box sx={{
                                    width: 100,
                                    height: 100,
                                    margin: '0 auto 20px',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${alpha(INDIGO, 0.12)} 0%, ${alpha(MINT, 0.12)} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <EditNote sx={{ fontSize: 44, color: INDIGO }} />
                                </Box>
                                <Typography variant="h6" fontWeight="700" sx={{ color: INK, fontFamily: "'Poppins', sans-serif" }} gutterBottom>
                                    No Templates Available
                                </Typography>
                               <Typography variant="body1" sx={{ color: SLATE, maxWidth: 400, mx: 'auto' }}>
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
                    sx: { borderRadius: '20px' }
                }}
            >
                <DialogTitle sx={{
                    pb: 2,
                    background: `linear-gradient(135deg, ${INDIGO} 0%, #7C6FF0 100%)`,
                    color: '#fff',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700" sx={{ fontFamily: "'Poppins', sans-serif" }}>
                            Update Template Status
                        </Typography>
                        <IconButton onClick={handleCloseStatusModal} size="small" sx={{ color: '#fff' }}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: SLATE, mb: 1, fontWeight: 500 }} >
                            Current Status
                        </Typography>
                        <Chip
                            icon={getStatusConfig(currentTemplateStatus).icon}
                            label={getStatusConfig(currentTemplateStatus).label}
                            sx={{
                                backgroundColor: getStatusConfig(currentTemplateStatus).color,
                                color: '#fff',
                                fontWeight: 700,
                                px: 1,
                                height: '32px',
                                '& .MuiChip-icon': { color: '#fff' },
                            }}
                        />
                    </Box>

                    {/* Determine if nextAllowedStatuses is an object or array */}
                    {(() => {
                        const isObject = !Array.isArray(nextAllowedStatuses);
                        const hasAlert = isObject && nextAllowedStatuses.blocked && nextAllowedStatuses.alertMessage;
                        const hasForm = isObject ? (!nextAllowedStatuses.blocked && nextAllowedStatuses.options.length > 0) : nextAllowedStatuses.length > 0;
                        const optionsToMap = isObject ? nextAllowedStatuses.options : nextAllowedStatuses;

                        return (
                            <>
                                {/*  Blocked Alert — shown when all or any subgoal statuses are null */}
                                {hasAlert && (
                                    <Alert
                                        severity="warning"
                                        icon={<InfoOutlined />}
                                        sx={{
                                            mb: 2,
                                            borderRadius: '12px',
                                            backgroundColor: alpha(SUNNY, 0.15),
                                            color: '#92400E',
                                            '& .MuiAlert-icon': { color: '#B45309' }
                                        }}
                                    >
                                        {nextAllowedStatuses.alertMessage}
                                    </Alert>
                                )}

                                {/*  Show status dropdown + comment only when form is available */}
                                {hasForm && (
                                    <>
                                        <FormControl fullWidth error={statusError} sx={{ mb: 3 }}>
                                            <InputLabel>Select New Status</InputLabel>
                                            <Select
                                                value={selectedNextStatus}
                                                label="Select New Status"
                                                onChange={(e) => { setSelectedNextStatus(e.target.value); setStatusError(false); }}
                                                sx={{ borderRadius: '12px' }}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>Choose a status...</em>
                                                </MenuItem>
                                                {optionsToMap.map((statusOption) => (
                                                    <MenuItem
                                                        key={statusOption.value}
                                                        value={statusOption.value}
                                                        sx={{ color: statusOption.color }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{
                                                                width: 10, height: 10, borderRadius: '50%',
                                                                backgroundColor: statusOption.color,
                                                            }} />
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
                                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                            // required
                                        />
                                    </>
                                )}
                            </>
                        );
                    })()}
                </DialogContent>

                {/*  Show actions only when form is available */}
                {(() => {
                    const isObject = !Array.isArray(nextAllowedStatuses);
                    const hasForm = isObject ? (!nextAllowedStatuses.blocked && nextAllowedStatuses.options.length > 0) : nextAllowedStatuses.length > 0;
                    return hasForm ? (
                        <DialogActions sx={{ p: 3 }}>
                            <Button
                                onClick={handleCloseStatusModal}
                                sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}
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
                                    background: `linear-gradient(135deg, ${INDIGO} 0%, #7C6FF0 100%)`,
                                    '&:hover': { background: INDIGO_DARK },
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    boxShadow: `0 4px 14px ${alpha(INDIGO, 0.3)}`,
                                    px: 3,
                                }}
                            >
                                Submit Status
                            </Button>
                        </DialogActions>
                    ) : null;
                })()}
            </Dialog>
            
        </>
    );
};

export default GoalViewPage;