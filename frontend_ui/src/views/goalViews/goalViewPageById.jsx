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
    Divider,
    Checkbox,
    Alert  //  Added Alert for blocked subgoal warning
} from '@mui/material';
import { TablePagination } from '@mui/material';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { addAction, fetchByIdAction, updateAction } from '../../StoreRedux/actions/commonActions';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
    History,
    InfoOutlined,
    PendingActions
} from '@mui/icons-material';
import CommentIcon from '@mui/icons-material/Comment';
import { AllInclusive, DonutLarge, HourglassTop, Block as BlockIcon, CheckCircleOutline } from '@mui/icons-material';

const getGoalViewByIdDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['goal_view_page'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const GoalViewPageByIdLoad = pageData?.loading?.GoalViewPageByIdLoad;
            const GoalViewPageByIdData = pageData?.data?.GoalViewPageByIdData;
            const GoalColumnsLoad = pageData?.loading?.GoalColumnsLoad;
            const GoalColumnsData = pageData?.data?.GoalColumnsData;
            const GoalTemplateDataReviwerLoad = pageData?.loading?.GoalTemplateDataReviwerLoad;
            const GoalTemplateDataReviwerData = pageData?.data?.GoalTemplateDataReviwerData;
            const SubGoalViewPageLoad = pageData?.loading?.SubGoalViewPageLoad;
            const SubGoalViewPageData = pageData?.data?.SubGoalViewPageData;

            result[page] = {
                loading: {
                    GoalViewPageByIdLoad: GoalViewPageByIdLoad,
                    GoalColumnsLoad: GoalColumnsLoad,
                    GoalTemplateDataReviwerLoad: GoalTemplateDataReviwerLoad,
                    SubGoalViewPageLoad: SubGoalViewPageLoad,
                },
                data: {
                    GoalViewPageByIdData: GoalViewPageByIdData,
                    GoalColumnsData: GoalColumnsData,
                    GoalTemplateDataReviwerData: GoalTemplateDataReviwerData,
                    SubGoalViewPageData: SubGoalViewPageData,
                }
            };
        });
        return result.goal_view_page;
    }
);

const GoalViewPageUserById = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const preDefinedTheme = useTheme();
    const loginUserDetails = useSelector(state => state?.auth?.user) || {};

    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [openTemplateStatusModal, setOpenTemplateStatusModal] = useState(false);
    const [selectedNextStatus, setSelectedNextStatus] = useState('');
    const [selectedNextTemplateStatus, setSelectedNextTemplateStatus] = useState('');

    const [comment, setComment] = useState('');
    const [statusError, setStatusError] = useState(false);
    const [commentError, setCommentError] = useState(false);
    const [openRows, setOpenRows] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', content: '' });

    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(false);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);


    const handleOpenTextModal = (title, content) => {
        setModalContent({ title, content });
        setModalOpen(true);
    };

    const handleCloseTextModal = () => {
        setModalOpen(false);
        setModalContent({ title: '', content: '' });
    };

    const handleRowToggle = (rowId) => {
        setOpenRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const handleOpenStatusModal = () => {
        if (selectedGoals.length === 0) {
            return;
        } 

        setOpenStatusModal(true);
        setSelectedNextStatus('');
        setComment('');
        setStatusError(false);
        setCommentError(false);
    };

    const handleCloseStatusModal = () => {
        setOpenStatusModal(false);
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

    // Function to check if a goal is selectable based on its status and user role
    const isGoalSelectable = (goal) => {

        const currentStatus = goal.sbr_review_status;
        const HRPORTAL_ID = '12345';
        const userId = loginUserDetails?.id;
        const assignEmpId = templateInfo?.assignEmpId;


        // Disable if status is 'Approved' and user is Super Admin (HRPORTAL_ID)
        if (currentStatus === 'Approved') {
            return false;
        }

        // Disable if status is 'Approve_Reviewer' and user is Reviewer (assignEmpId != userId && HRPORTAL_ID != userId)
        if (currentStatus === 'Approve_Reviewer' && HRPORTAL_ID !== userId) {
            return false;
        }

        return true;
    };

    const handleSelectAll = (event) => {
        const paginatedGoals = flatGoalData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        if (event.target.checked) {

            const selectableGoals = paginatedGoals.filter(goal => isGoalSelectable(goal));
            const newSelected = selectableGoals.map(goal => goal.id);
            setSelectedGoals(prev => [...new Set([...prev, ...newSelected])]);
        } else {
            const paginatedIds = paginatedGoals.map(goal => goal.id);
            setSelectedGoals(prev => prev.filter(id => !paginatedIds.includes(id)));
        }
    };

    const handleSelectGoal = (goalId) => {
        const goal = flatGoalData.find(g => g.id === goalId);
        // Only allow selection if the goal is selectable
        if (goal && !isGoalSelectable(goal)) {
            return;
        }

        setSelectedGoals(prev =>
            prev.includes(goalId)
                ? prev.filter(id => id !== goalId)
                : [...prev, goalId]
        );
    };


    useEffect(() => {
        if (id) {
            dispatch(setLoading("goal_view_page", "GoalViewPageByIdLoad", true));
            dispatch(fetchByIdAction('application/json', "goal_view_page", "GoalViewPageByIdData", "GoalViewPageByIdLoad", id));
            dispatch(setLoading("goal_view_page", "GoalColumnsLoad", true));
            dispatch(fetchByIdAction('application/json', "goal_view_page", "GoalColumnsData", "GoalColumnsLoad", id));
            // if(loginUserDetails?.id === '1400') {
            //     dispatch(setLoading("goal_view_page", "GoalTemplateDataReviwerLoad", true));
            //     dispatch(fetchByIdAction('application/json', "goal_view_page", "GoalTemplateDataReviwerData", "GoalTemplateDataReviwerLoad", loginUserDetails?.id));
            // } else {
                dispatch(setLoading("goal_view_page", "GoalTemplateDataReviwerLoad", true));
                dispatch(fetchByIdAction('application/json', "goal_view_page", "GoalTemplateDataReviwerData", "GoalTemplateDataReviwerLoad", id));
            // }
            dispatch(setLoading("goal_view_page", "SubGoalViewPageLoad", true));
            dispatch(fetchByIdAction('application/json', "goal_view_page", "SubGoalViewPageData", "SubGoalViewPageLoad", id));
        }
    }, [dispatch,id]);
    
    const getGoalViewByIdStore = useSelector(getGoalViewByIdDetails) || {};
    const goalReviewerByIdLoading = getGoalViewByIdStore?.loading?.GoalViewPageByIdLoad || false;
    const goalReviewerByIdData = Array.isArray(getGoalViewByIdStore?.data?.GoalViewPageByIdData)
        ? getGoalViewByIdStore.data.GoalViewPageByIdData
        : [];
    const goalTemplateDataReviwerData = Array.isArray(getGoalViewByIdStore?.data?.GoalTemplateDataReviwerData)
        ? getGoalViewByIdStore.data.GoalTemplateDataReviwerData
        : [];
    const subGoalViewPageData = Array.isArray(getGoalViewByIdStore?.data?.SubGoalViewPageData)
        ? getGoalViewByIdStore.data.SubGoalViewPageData
        : [];

    const { 
        GoalTemplateDataReviwerData, 
        SubGoalViewPageData 
    } = getGoalViewByIdStore?.data || {};
    const rawTemplates = Array.isArray(GoalTemplateDataReviwerData) ? GoalTemplateDataReviwerData : [];
    const rawSubGoals = Array.isArray(SubGoalViewPageData) ? SubGoalViewPageData : [];
    const uniqueTemplatesMap = new Map();
    rawTemplates.forEach(item => {
        if (!uniqueTemplatesMap.has(item.ta_pid)) {
            uniqueTemplatesMap.set(item.ta_pid, item);
        }
    });

    const finalCombinedData = Array.from(uniqueTemplatesMap.values()).map(template => ({
        ...template,
        subGoals: rawSubGoals.filter(subGoal => subGoal.ta_pid === template.ta_pid)
    }));   
    const goalColumnsByIdLoading = getGoalViewByIdStore?.loading?.GoalColumnsLoad || false;

    const goalColumnsByIdData = Array.isArray(getGoalViewByIdStore?.data?.GoalColumnsData)
        ? getGoalViewByIdStore.data.GoalColumnsData
        : [];

    const columnsGroupedByGoal = useMemo(() => {
        return goalColumnsByIdData.reduce((acc, col) => {
            if (!acc[col.tg_pid]) acc[col.tg_pid] = [];
            acc[col.tg_pid].push(col);
            return acc;
        }, {});
    }, [goalColumnsByIdData]);

    

    const combinedData = useMemo(() => {
        return goalReviewerByIdData.map(goal => ({
            ...goal,
            columns: columnsGroupedByGoal[goal.tg_pid] || []
        }));
    }, [goalReviewerByIdData, columnsGroupedByGoal]);

    const processedGoalData = useMemo(() => {
        if (!combinedData || combinedData.length === 0) {
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
            name: combinedData[0].template_name,
            year: combinedData[0].template_year,
            // position: combinedData[0].ta_assigned_position,
            status: combinedData[0].ta_status,
            reviewerName: combinedData[0].rl_emp_name,
            assigneeName: combinedData[0].ol_emp_name,
            assignEmpId: combinedData[0].ol_emp_id,
            reviewerId: combinedData[0].rl_emp_id,
            generatedId: combinedData[0].ta_generated_id
        };

        const categories = {};
        let totalWeightage = 0;
        let usedWeightage = 0;

         const sortedData = [...combinedData].sort(
            (a, b) => (Number(a.tg_pid) || 0) - (Number(b.tg_pid) || 0)
        );
        

        sortedData.forEach(goal => {
            const categoryId = goal.tc_category_id;
            if (!goal.tg_pid || !categoryId) return;

            
            if (!categories[categoryId]) {
                categories[categoryId] = {
                    id: categoryId,
                    name: goal.category_name,
                    maxWeightage: goal.tc_max_weightage,
                    description: goal.tc_category_description,
                    goalId: goal.tg_goal_generated_id,
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
                sub_task_name: goal.sub_task_name || null,
                weightage,
                goalId: goal.tg_goal_generated_id,
                owner: goal.tg_goal_owner,
                ownername: goal.ol_emp_name,
                mu_completed_weightage: goal.mu_completed_weightage,
                mu_status: goal.mu_status,
                sbr_review_status: goal.sbr_review_status,
                columns: goal.columns || []
            });

            categories[categoryId].usedWeightage += weightage;
            usedWeightage += weightage;

        });

        // 2) Order categories by their smallest tg_pid (sub-task id), ASC.
        const orderedCategories = Object.values(categories).sort((a, b) => {
            const aMin = Math.min(...a.subTasks.map(s => Number(s.id) || 0));
            const bMin = Math.min(...b.subTasks.map(s => Number(s.id) || 0));
            return aMin - bMin;
        });

        return {
            //categories: Object.values(categories),
            categories: orderedCategories,
            templateInfo,
            weightageMetrics: { totalWeightage, usedWeightage }
        };
    }, [combinedData]);

    

     
    const goalStatusCounts = useMemo(() => {
        const counts = {
            total_goals: 0,
            Completed: 0,
            'In Progress': 0,
            'Partially Completed': 0,
            'Not Started': 0,
            Blocked: 0,
        };

        if (!combinedData || combinedData.length === 0) {
            return counts;
        }

        combinedData.forEach((goal) => {

            if (!goal.tg_pid) return;

            counts.total_goals++;

            const status = goal.mu_status || goal.tg_status || 'Not Started';
            if (counts.hasOwnProperty(status)) {
                counts[status]++;
            } else if (status !== 'Not Started') {


            }
        });

        return counts;
    }, [combinedData]);

    
    const flatGoalData = useMemo(() => {
        if (!processedGoalData?.categories || processedGoalData?.categories.length === 0) return [];

        const allGoals = [];
        processedGoalData?.categories.forEach(category => {
            category.subTasks.forEach(goal => {
                allGoals.push({
                    ...goal,
                    categoryName: category.name,
                    categoryDescription: category.description,
                    categoryMaxWeightage: category.maxWeightage,
                    goalWeightage: goal.weightage,
                    goalId: goal.goalId,
                    sub_task_name: goal.sub_task_name || null,
                });
            });
        });
        return allGoals;
    }, [processedGoalData]);


    function canMoveStatusFlow(combinedData) {
        const categoryMap = {};

        combinedData.forEach(item => {
            const tcPid = item.tc_pid;

            if (!categoryMap[tcPid]) {
                categoryMap[tcPid] = {
                    maxWeightage: item.tc_max_weightage,
                    totalGoalWeightage: 0,
                    hasInvalidGoal: false
                };
            }

            if (item.tg_pid != null) {
                if (item.tg_goal_weightage == null) {
                    categoryMap[tcPid].hasInvalidGoal = true;
                } else {
                    categoryMap[tcPid].totalGoalWeightage += Number(item.tg_goal_weightage);
                }
            }
        });

        for (const tcPid in categoryMap) {
            const category = categoryMap[tcPid];

            if (category.hasInvalidGoal) {
                return false;
            }

            if (category.totalGoalWeightage !== category.maxWeightage) {
                return false;
            }
        }
        return true;
    }

    const isAllowed = canMoveStatusFlow(combinedData);

    const isAllGoalsCompleted = Array.isArray(combinedData) && combinedData.length > 0 && combinedData.every(item => Number(item.mu_completed_weightage) === 100);

    // console.log(isAllGoalsCompleted, "isAllGoalsCompleted");



    const getAllowedNextStatuses = (currentStatus, userId, assignEmpId) => {
        const HRPORTAL_ID = '12345';


        switch (currentStatus) {
            case 'Under_Review':
                if (assignEmpId != userId && HRPORTAL_ID != userId) {

                    return [

                        { value: 'Approve_Reviewer', label: 'Reviewer_Approved', color: '#10b981', icon: <CheckCircle /> },
                        { value: 'Need_More_Information_Reviewer', label: 'Need_More_Information_Reviewer', color: '#10b981', icon: <Comment /> },
                        { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                    ];
                }

                return [];
            case 'Rejected':
                return [];
            case 'Goals_Pending':
                return [];
            case 'Submitted':
                // if (assignEmpId != userId && isAllowed) {
                //     return [
                //         { value: 'Under_Review', label: 'Under Review', color: '#3b82f6', icon: <HourglassEmpty /> },
                //     ];
                // }
                return [];
            case 'Need_More_Information_Reviewer':
                if (assignEmpId == userId) {
                    return [
                        { value: 'Modify_Correction_Reviewer', label: 'Modify_Correction_Reviewer', color: '#10b981', icon: <Comment /> },
                    ];
                }
                return [];
            case 'Approve_Reviewer':
                if (HRPORTAL_ID == userId) {
                    return [
                        { value: 'Approved', label: 'Approved', color: '#10b981', icon: <CheckCircle /> },
                        { value: 'Need_More_Information_Super_Admin', label: 'Need_More_Information_Super_Admin', color: '#f59e0b', icon: <Comment /> },
                        { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                    ];
                }
                return [];

            case 'Need_More_Information_Super_Admin':
                if (assignEmpId == userId) {
                    return [
                        { value: 'Modify_Correction_Super_Admin', label: 'Information Updated to Super Admin', color: '#10b981', icon: <Comment /> },
                    ];
                }
                return [];
            case 'Modify_Correction_Reviewer':
                if (assignEmpId != userId && HRPORTAL_ID != userId) {
                    return [
                        { value: 'Approve_Reviewer', label: 'Reviewer_Approved', color: '#10b981', icon: <CheckCircle /> },
                        { value: 'Need_More_Information_Reviewer', label: 'Need_More_Information_Reviewer', color: '#f59e0b', icon: <Comment /> },
                    ];

                }
                return [];
            case 'Modify_Correction_Super_Admin':
                if (HRPORTAL_ID == userId) {
                    return [
                        { value: 'Approved', label: 'Approved', color: '#10b981', icon: <CheckCircle /> },
                        { value: 'Need_More_Information_Super_Admin', label: 'Need_More_Information_Super_Admin', color: '#f59e0b', icon: <Comment /> },
                        { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> },
                    ];
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

    const { categories, templateInfo, weightageMetrics } = processedGoalData;
    const currentTemplateStatus = templateInfo?.status;
    const nextAllowedStatuses = useMemo(() => getAllowedNextStatuses(currentTemplateStatus, loginUserDetails?.id, templateInfo?.assignEmpId), [currentTemplateStatus]);

    const handleSubmitStatusChange = () => {
        let valid = true;
        if (!selectedNextStatus) { setStatusError(true); valid = false; } else { setStatusError(false); }
        // if (!comment.trim()) { setCommentError(true); valid = false; } 
        // else {
             setCommentError(false); 
            // }
        if (valid) {
            const statusChangeData = {
                template_pid: goalReviewerByIdData[0]?.template_pid,
                template_status: selectedNextStatus,
                tr_assignment_id: goalReviewerByIdData[0]?.ta_pid,
                tr_template_id: id,
                tg_pid: selectedGoals,
                tr_reviewer_id: loginUserDetails?.id,
                tr_review_status: selectedNextStatus,
                tr_review_date: new Date().toISOString().split('T')[0],
                tr_comments: comment,
                tr_created_at: new Date().toISOString(),
                tr_modified_at: new Date().toISOString()
            };

            
            dispatch(setLoading("goal_view_page", "GoalViewPageByIdLoad", true));
            dispatch(updateAction('application/json', "goal_view_page", "GoalViewPageByIdData", "GoalViewPageByIdLoad", "bulkupdate", statusChangeData)); 
             setTimeout(() => {
                    window.location.reload();
                }, 800); // 800ms delay
            setSelectedGoals([]);
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
                    icon: <Comment sx={{ fontSize: 16 }} />,
                    label: 'Information Updated to Reviewer',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Approve_Reviewer':
                return {
                    icon: <Comment sx={{ fontSize: 16 }} />,
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

    const getSubGoalStatusConfig = (status) => {
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
                    icon: <Comment sx={{ fontSize: 16 }} />,
                    label: 'Information Updated to Reviewer',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Approve_Reviewer':
                return {
                    icon: <Comment sx={{ fontSize: 16 }} />,
                    label: 'Reviwer Approved',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };    

            default:
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: status?.replace(/_/g, ' ') || 'N/A',
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

    const getCategoryRowSpans = (data) => {
        const spans = [];
        let i = 0;
        while (i < data.length) {
            let count = 1;
            while (i + count < data.length && data[i + count].categoryName === data[i].categoryName) {
                count++;
            }
            for (let j = 0; j < count; j++) {
                spans.push(j === 0 ? count : 0);
            }
            i += count;
        }
        return spans;
    };

    const IgnoreTableShowingList = [
        'KPI / Success Metric',
        'Target',
        'Monthly Notes',

    ];


    const handleViewClick = (SubTaskId) => {

        navigate(`/sub-goal-history/${SubTaskId}`);
    };

    
    const getAllowedNextTemplateStatuses = (currentStatus, userId, assignEmpId, subgoalsFiltered = [], isAllGoalsCompleted = false) => {
        console.log('getAllowedNextTemplateStatuses called with:', { currentStatus, userId, assignEmpId, subgoalsFiltered, isAllGoalsCompleted });
        const HRPORTAL_ID = '12345';

        const Under_Review = { value: 'Under_Review', label: 'Under Review', color: '#3b82f6', icon: <HourglassEmpty /> };
        const Approve_Reviewer = { value: 'Approve_Reviewer', label: 'Reviewer Approved', color: '#10b981', icon: <CheckCircle /> };
        const Need_Info_By_Reviewer = { value: 'Need_More_Information_Reviewer', label: 'Need More Information By Reviewer', color: '#f59e0b', icon: <CommentIcon /> };
        const Rejected = { value: 'Rejected', label: 'Rejected', color: '#ef4444', icon: <Block /> };
        const Modify_Correction_Reviewer = { value: 'Modify_Correction_Reviewer', label: 'Information Updated to Reviewer', color: '#10b981', icon: <Comment /> };
        const Approved_Super_Admin = { value: 'Approved', label: 'Approved By HR', color: '#10b981', icon: <CheckCircle /> };
        const Need_Info_By_Super_Admin = { value: 'Need_More_Information_Super_Admin', label: 'Need More Information By Super Admin', color: '#f59e0b', icon: <CommentIcon /> };
        const Modify_Correction_Super_Admin = { value: 'Modify_Correction_Super_Admin', label: 'Information Updated to Super Admin', color: '#f59e0b', icon: <Comment /> };

        // 2. Subgoal status condition flags
        const is_all_null = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(sg => sg.sbr_review_status === null);
        const is_any_null = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(sg => sg.sbr_review_status === null);
        const is_all_approved_by_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(sg => sg.sbr_review_status === 'Approve_Reviewer');
        const is_all_approved_by_hr = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(sg => sg.sbr_review_status === 'Approved');
        const is_all_rejected = subgoalsFiltered?.length > 0 && subgoalsFiltered.every(sg => sg.sbr_review_status === 'Rejected');
        const is_any_rejected = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(sg => sg.sbr_review_status === 'Rejected');
        const is_any_need_more_info = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(sg => sg.sbr_review_status === 'Need_More_Information_Reviewer');
        const is_any_need_more_info_hr = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(sg => sg.sbr_review_status === 'Need_More_Information_Super_Admin');
        const is_any_modify_correction_reviewer = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(sg => sg.sbr_review_status === 'Modify_Correction_Reviewer');
        const is_any_modify_correction_hr = subgoalsFiltered?.length > 0 && subgoalsFiltered.some(sg => sg.sbr_review_status === 'Modify_Correction_Super_Admin');

        // 4. Core state machine evaluation
        switch (currentStatus) {
            case 'Submitted':
                if (assignEmpId === userId && HRPORTAL_ID !== userId) {
                    return {
                        blocked: false,
                        alertMessage: null,
                        options: [Under_Review]
                    };
                }
                return { blocked: false, alertMessage: null, options: [] };
            case 'Under_Review':
                if (assignEmpId !== userId && HRPORTAL_ID !== userId) {
                    if(is_all_approved_by_reviewer) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Approve_Reviewer]
                        };
                    }
                    else if(is_all_rejected) {
                        return {
                            blocked: false, 
                            alertMessage: null,
                            options: [Rejected]
                        };
                    }
                    else if(is_any_need_more_info) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Need_Info_By_Reviewer]
                        };
                    }
                }
                return { blocked: false, alertMessage: null, options: [] };

            case 'Need_More_Information_Reviewer':
                if (assignEmpId === userId) {
                    return {
                        blocked: false,
                        alertMessage: null,
                        options: [Modify_Correction_Reviewer]
                    };
                }
                return { blocked: false, alertMessage: null, options: [] };

            case 'Approve_Reviewer':
                if (assignEmpId === userId) {
                    // return {
                    //     blocked: false,
                    //     alertMessage: null,
                    //     options: [
                    //         { value: 'Approved', label: 'Approved By HR', color: '#10b981', icon: <CheckCircle /> },
                    //     ]
                    // };
                    if(is_all_approved_by_reviewer) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Approve_Reviewer]
                        };
                    }
                    else if(is_all_rejected) {
                        return {
                            blocked: false, 
                            alertMessage: null,
                            options: [Rejected]
                        };
                    }
                    else if(is_any_need_more_info) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Need_Info_By_Reviewer]
                        };
                    }
                    else if(is_all_approved_by_hr) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Approved_Super_Admin]
                        };
                    }
                }
                else if (HRPORTAL_ID === userId) {
                    if(is_all_approved_by_hr) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Approved_Super_Admin]
                        };
                    }
                    else if(is_all_rejected) {
                        return {
                            blocked: false, 
                            alertMessage: null,
                            options: [Rejected]
                        };
                    }
                    else if(is_any_need_more_info_hr) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Need_Info_By_Super_Admin]
                        };
                    }
                }
                else 
                return { blocked: false, alertMessage: null, options: [] };

            case 'Need_More_Information_Super_Admin':
                if (assignEmpId === userId) {
                    return {
                        blocked: false,
                        alertMessage: null,
                        options: [Modify_Correction_Super_Admin]
                    };
                }
                return { blocked: false, alertMessage: null, options: [] };

            case 'Modify_Correction_Super_Admin':
                if (HRPORTAL_ID === userId) {
                    if(is_any_modify_correction_hr) {
                        return {
                            blocked: true,
                            alertMessage: null,
                            options: [Modify_Correction_Super_Admin]
                        };
                    }
                    else if(is_all_approved_by_hr) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Approved_Super_Admin]
                        };
                    }
                    else if(is_any_need_more_info_hr) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Need_Info_By_Super_Admin]
                        };
                    }
                }
                return { blocked: false, alertMessage: null, options: [] };

            case 'Modify_Correction_Reviewer':
                if (assignEmpId !== userId) {
                    if(is_any_modify_correction_reviewer) {
                        return {
                            blocked: true,
                            alertMessage: null,
                            options: [Modify_Correction_Reviewer]
                        };
                    }
                    else if(is_all_approved_by_reviewer) {
                        return {
                            blocked: false,
                            alertMessage: null,
                            options: [Approve_Reviewer]
                        };
                    }
                }
                return { blocked: false, alertMessage: null, options: [] };

            case 'In_Progress':
                if (assignEmpId === userId && isAllGoalsCompleted) {
                    return {
                        blocked: false,
                        alertMessage: null,
                        options: [{ value: 'Completed', label: 'Completed', color: '#10b981', icon: <CheckCircle /> }]
                    };
                }
                return { blocked: false, alertMessage: null, options: [] };

            case 'Rejected':
            case 'Goals_Pending':
            case 'Approved':
            default:
                return { blocked: false, alertMessage: null, options: [] };
        }
    };
    
    const CurrentTemplateStatus = selectedAssignment?.[0]?.ta_status;
    
    const nextAllowedTemplateStatuses = useMemo(() => {
        if (!selectedAssignment) return { blocked: false, alertMessage: null, options: [] };
        return getAllowedNextTemplateStatuses(
            CurrentTemplateStatus,
            loginUserDetails?.id,
            templateInfo?.assignEmpId,
            selectedAssignment?.[0]?.subGoals || []  //  pass attached subGoals
        );
    }, [
        selectedAssignment,
    ]);

    const handleOpenTemplateStatusModal = (row) => {
        setSelectedAssignment(row);
        setOpenTemplateStatusModal(true);
        setSelectedNextTemplateStatus('');
        setComment('');
        setStatusError(false);
        setCommentError(false);
    };

    const handleCloseTemplateStatusModal = () => {
        setOpenTemplateStatusModal(false);
    };

    const handleSubmitTemplateStatusChange = () => {
            let valid = true;
            if (!selectedNextTemplateStatus) { setStatusError(true); valid = false; } else { setStatusError(false); }
            // if (!comment.trim()) { setCommentError(true); valid = false; } 
            // else { 
                setCommentError(false); 
            // }
    
            if (valid) {
                const statusChangeData = {
                    template_pid: selectedAssignment?.[0]?.template_pid,
                    template_status: selectedNextTemplateStatus,
                    tr_assignment_id: selectedAssignment?.[0]?.ta_pid,
                    tr_template_id: selectedAssignment?.[0]?.template_pid,
                    tr_reviewer_id: loginUserDetails?.id,
                    tr_review_status: selectedNextTemplateStatus,
                    tr_review_date: new Date().toISOString().split('T')[0],
                    tr_comments: comment,
                    tr_created_at: new Date().toISOString(),
                    tr_modified_at: new Date().toISOString()
                };
    
                dispatch(setLoading("goal_view_page", "GoalTemplateDataReviwerLoad", true));
                dispatch(addAction('application/json', "goal_view_page", "GoalTemplateDataReviwerData", "GoalTemplateDataReviwerLoad", statusChangeData));
                setTimeout(() => {
                    window.location.reload();
                }, 800); // 800ms delay
                handleCloseTemplateStatusModal();
            }
        };

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
                                    Goal View Details
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Review and manage goal template
                                </Typography>
                            </Box>
                            

                            <Box sx={{ display: 'flex', gap: 1 }}>

                                {nextAllowedStatuses.length > 0 && (
                                    <Button
                                        variant="contained"
                                        onClick={handleOpenStatusModal}
                                        disabled={selectedGoals.length === 0}
                                        startIcon={<Send />}
                                        sx={{
                                            background: selectedGoals.length === 0 ? 'rgba(148, 163, 184, 0.3)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            boxShadow: selectedGoals.length === 0 ? 'none' : '0 8px 32px rgba(102, 126, 234, 0.3)',
                                            '&:hover': selectedGoals.length === 0 ? {} : {
                                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                                            },
                                        }}
                                    >
                                        Bulk Status{selectedGoals.length > 0 ? ` (${selectedGoals.length})` : ''}
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    onClick={() => handleOpenTemplateStatusModal(finalCombinedData)}
                                    startIcon={<Send />}
                                    sx={{
                                        background:  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                                        },
                                    }}
                                >
                                    Template Status
                                </Button>
                            </Box>
                            <Button
                                onClick={() => window.history.back()}
                                startIcon={<ArrowBackIcon />}
                                sx={{ marginLeft: '-52%' }}
                            >
                                Back
                            </Button>
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

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="flex-end" sx={{ flex: '1 1 400px' }}>
                                    {templateInfo?.status && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block" textAlign={{ xs: 'center', sm: 'left' }}>Status</Typography>
                                            <Chip
                                                icon={getStatusConfig(templateInfo.status).icon}
                                                label={getStatusConfig(templateInfo.status).label}
                                                sx={{
                                                    backgroundColor: getStatusConfig(templateInfo.status).backgroundColor,
                                                    color: getStatusConfig(templateInfo.status).color,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </Box>
                                    )}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" textAlign={{ xs: 'center', sm: 'left' }}>Assignee</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={{ width: 30, height: 30, bgcolor: "#6366f1" }}>
                                                <Person sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Typography fontWeight="600" fontSize="0.85rem">
                                                {templateInfo?.assigneeName || "-"}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" textAlign={{ xs: 'center', sm: 'left' }}>Reviewer</Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={{ width: 30, height: 30, bgcolor: "#10b981" }}>
                                                <VerifiedUser sx={{ fontSize: 16 }} />
                                            </Avatar>
                                            <Typography fontWeight="600" fontSize="0.85rem">
                                                {templateInfo?.reviewerName || "-"}
                                            </Typography>
                                        </Stack>
                                    </Box>
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
                                <Paper
                                    elevation={0}
                                    sx={{
                                        mb: 3,
                                        borderRadius: 3,
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                        //overflow: 'hidden',
                                    }}
                                >
                                    {(() => {
                                        const dynamicColumns = flatGoalData.length > 0 ? flatGoalData[0].columns : [];
                                        // const paginatedGoals = flatGoalData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
                                        const paginatedGoals = flatGoalData; // show all records (pagination removed)
                                        const categorySpans = getCategoryRowSpans(paginatedGoals);
                                        const allCategoryNames = [...new Set(flatGoalData.map(g => g.categoryName))];


                                        // Check if all selectable goals on current page are selected
                                        const selectableGoalsOnPage = paginatedGoals.filter(goal => isGoalSelectable(goal));
                                        const areAllSelectableSelected = selectableGoalsOnPage.length > 0 && selectableGoalsOnPage.every(goal => selectedGoals.includes(goal.id));
                                        const isSomeSelectableSelected = selectableGoalsOnPage.some(goal => selectedGoals.includes(goal.id));

                                        return (
                                            <>
                                                <TableContainer sx={{
                                                    maxHeight: 'calc(100vh - 100px)',
                                                    overflowY: 'auto',
                                                    overflowX: 'auto',
                                                }}>
                                                    <Table stickyHeader sx={{ tableLayout: 'fixed', minWidth: '1400px' }}>
                                                        <TableHead>
                                                            <TableRow sx={{ backgroundColor: '#f8fafc', tableLayout: 'fixed', width: '100%' }}>

                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', borderRight: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '70px' }}>S.No</TableCell>
                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' ,width: '180px',position: 'sticky',left: '0px',zIndex: 201,backgroundColor: '#f8fafc',boxShadow: '2px 0 4px rgba(0,0,0,0.08)',}}>Goal Category</TableCell>
                                                                {/* <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Category Description</TableCell> */}

                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', borderLeft: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '130px' }}>Task Weightage</TableCell>

                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '80px' }}>
                                                                    <Checkbox
                                                                        checked={areAllSelectableSelected}
                                                                        indeterminate={isSomeSelectableSelected && !areAllSelectableSelected}
                                                                        onChange={handleSelectAll}
                                                                        disabled={selectableGoalsOnPage.length === 0}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '120px'}}>GOAL ID</TableCell>
                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '130px' }}>Sub Task Name</TableCell>
                                                                
                                                                
                                                                {dynamicColumns
                                                                    .filter(col => !IgnoreTableShowingList.includes(col.column_name))
                                                                    .map(col => (
                                                                        <TableCell
                                                                            key={col.column_name}
                                                                            sx={{
                                                                                borderBottom: '2px solid #e2e8f0',
                                                                                fontWeight: 600,
                                                                                color: '#475569',
                                                                                width: '130px'
                                                                            }}
                                                                        >
                                                                            {col.column_name}
                                                                        </TableCell>
                                                                    ))}
                                                                
                                                                 <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '130px' }}>Monthly Status</TableCell>
                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '130px' }}>Monthly Work Percentage</TableCell>
                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '220px' }}>Subgoal Status</TableCell>
                                                                {/* <TableCell align="center" sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Status</TableCell> */}
                                                                <TableCell sx={{ borderBottom: '2px solid #e2e8f0', fontWeight: 600, color: '#475569',width: '130px' }}>Actions</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {paginatedGoals.map((goal, index) => {
                                                                const categoryIndex = allCategoryNames.indexOf(goal.categoryName) + 1;
                                                                const isSelectable = isGoalSelectable(goal);
                                                                return (
                                                                    <TableRow
                                                                        key={goal.id}
                                                                        hover
                                                                        sx={{
                                                                            '&:hover': { backgroundColor: alpha('#6366f1', 0.02) },
                                                                            transition: 'background-color 0.2s ease'
                                                                        }}
                                                                    >

                                                                        {/* Merged S.No cell */}
                                                                        {categorySpans[index] > 0 && (
                                                                            <TableCell
                                                                                rowSpan={categorySpans[index]}
                                                                                sx={{
                                                                                    borderRight: '2px solid #e2e8f0',
                                                                                    verticalAlign: 'middle',
                                                                                    fontWeight: 600,
                                                                                    color: '#475569',
                                                                                     width: '60px',
                                                                                     backgroundColor: '#fff',
                                                                                }}
                                                                            >
                                                                                {categoryIndex}
                                                                            </TableCell>
                                                                        )}
                                                                        {/* Merged Goal Category cell */}
                                                                        {categorySpans[index] > 0 && (
                                                                            <TableCell
                                                                                rowSpan={categorySpans[index]}
                                                                                sx={{
                                                                                   // whiteSpace: 'nowrap',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                    verticalAlign: 'middle',
                                                                                    fontWeight: 500,
                                                                                    position: 'sticky',
                                                                                    left: '0px',
                                                                                    zIndex: 100,
                                                                                    backgroundColor: '#fff',
                                                                                    boxShadow: '2px 0 4px rgba(0,0,0,0.08)',
                                                                                    width: '180px',
                                                                                }}
                                                                            >
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    onClick={truncateText(goal.categoryName).isTruncated ? () => handleOpenTextModal('Category Name', goal.categoryName) : undefined}
                                                                                    sx={{
                                                                                        cursor: truncateText(goal.categoryName).isTruncated ? 'pointer' : 'default',
                                                                                        '&:hover': truncateText(goal.categoryName).isTruncated ? { textDecoration: 'underline', color: 'primary.main' } : {}
                                                                                    }}
                                                                                >
                                                                                    {truncateText(goal.categoryName).truncated} ({goal.categoryMaxWeightage}%)
                                                                                </Typography>
                                                                            </TableCell>
                                                                        )}
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


                                                                        <TableCell sx={{ borderLeft: '2px solid #e2e8f0' }}>{goal.goalWeightage}%</TableCell>

                                                                        <TableCell>
                                                                            <Tooltip title={!isSelectable ? "This goal cannot be selected for bulk status update" : ""}>
                                                                                <span>
                                                                                    <Checkbox
                                                                                        checked={selectedGoals.includes(goal.id)}
                                                                                        onChange={() => handleSelectGoal(goal.id)}
                                                                                        disabled={!isSelectable}
                                                                                    />
                                                                                </span>
                                                                            </Tooltip>
                                                                        </TableCell>
                                                                        {/* <TableCell>
                                                                            <Typography variant="body2" color="text.secondary" 
                                                                            sx={{fontSize:'13px'}}>
                                                                                {goal.goalId?.match(/GOAL-\d{4}-\d+$/)?.[0] || 'N/A'}
                                                                                </Typography></TableCell>
                                                                        <TableCell>
                                                                            {goal.sub_task_name ? (
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    onClick={truncateText(goal.sub_task_name).isTruncated ? () => handleOpenTextModal('Sub Task Name', goal.sub_task_name) : undefined}
                                                                                    sx={{
                                                                                        cursor: truncateText(goal.sub_task_name).isTruncated ? 'pointer' : 'default',
                                                                                        '&:hover': truncateText(goal.sub_task_name).isTruncated ? { textDecoration: 'underline', color: 'primary.main' } : {}
                                                                                    }}
                                                                                >
                                                                                    {truncateText(goal.sub_task_name).truncated}
                                                                                </Typography>
                                                                            ) : (
                                                                                <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                                            )}
                                                                        </TableCell> */}
                                                                        <TableCell>
                                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                                                                                {goal.goalId?.match(/GOAL-\d{4}-\d+$/)?.[0] || 'N/A'}
                                                                            </Typography>
                                                                        </TableCell>
                                                                        <TableCell sx={{ width: '200px', maxWidth: '200px', minWidth: '200px' }}>
                                                                            {goal.sub_task_name ? (
                                                                                <Box
                                                                                    sx={{
                                                                                        width: '100%',
                                                                                        maxHeight: '80px', // adjust height as needed
                                                                                        overflowY: 'auto',
                                                                                        overflowX: 'hidden',
                                                                                        whiteSpace: 'pre-wrap',
                                                                                        wordBreak: 'break-word',
                                                                                        '&::-webkit-scrollbar': {
                                                                                            width: '4px',
                                                                                        },
                                                                                        '&::-webkit-scrollbar-thumb': {
                                                                                            backgroundColor: '#bdbdbd',
                                                                                            borderRadius: '4px',
                                                                                        },
                                                                                    }}
                                                                                >
                                                                                    <Typography variant="body2">
                                                                                        {goal.sub_task_name}
                                                                                    </Typography>
                                                                                </Box>
                                                                            ) : (
                                                                                <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                                            )}
                                                                        </TableCell>

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
                                                                                            {cellValue.trim() ? truncated : 'N/A'}
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

                                                                        <TableCell>
                                                                            <Chip
                                                                                icon={getSubGoalStatusConfig(goal.sbr_review_status).icon}
                                                                                label={getSubGoalStatusConfig(goal.sbr_review_status).label}
                                                                                sx={{
                                                                                    backgroundColor: getSubGoalStatusConfig(goal.sbr_review_status).backgroundColor,
                                                                                    color: getSubGoalStatusConfig(goal.sbr_review_status).color,
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            />
                                                                            {/* <Typography variant="body2">{goal.sbr_review_status || 'N/A'}</Typography> */}
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

                                                                            <Tooltip title="View Sub Goal History">
                                                                                <IconButton
                                                                                    onClick={() => handleViewClick(goal?.id)}
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

                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                                {/* <TablePagination
                                                    rowsPerPageOptions={[10, 25, 50]}
                                                    component="div"
                                                    count={flatGoalData.length}
                                                    rowsPerPage={rowsPerPage}
                                                    page={page}
                                                    onPageChange={handleChangePage}
                                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                                /> */}
                                            </>
                                        );
                                    })()}
                                </Paper>
                            ) : (
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

            {/* Status Change Modal */}
           <Dialog
                open={detailsModalOpen}
                onClose={handleCloseDetailsModal}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
                    }
                }}
                >
                {/* Header band */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f4c75 100%)',
                    px: 3.5,
                    pt: 3,
                    pb: 8,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    },
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 0.4,
                        borderRadius: '20px',
                        background: 'rgba(56,189,248,0.15)',
                        border: '1px solid rgba(56,189,248,0.3)',
                        mb: 1.5,
                        }}>
                        <Task sx={{ fontSize: 12, color: '#38bdf8' }} />
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase' }}>
                            Goal Details
                        </Typography>
                        </Box>
                        <Typography sx={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#f1f5f9',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                        }}>
                        {selectedGoal?.categoryName || 'Goal Overview'}
                        </Typography>
                        {selectedGoal?.sub_task_name?.trim() && (
                        <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', mt: 0.5 }}>
                            {selectedGoal.sub_task_name}
                        </Typography>
                        )}
                    </Box>
                    <IconButton
                        onClick={handleCloseDetailsModal}
                        size="small"
                        sx={{
                        color: '#94a3b8',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        ml: 2,
                        flexShrink: 0,
                        '&:hover': { background: 'rgba(255,255,255,0.12)', color: '#f1f5f9' },
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                    </Box>

                    {/* Stat chips */}
                    {selectedGoal && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2.5 }}>
                        <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.6, borderRadius: '8px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                        <TrendingUp sx={{ fontSize: 14, color: '#34d399' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                            Weightage:&nbsp;<Box component="span" sx={{ color: '#34d399' }}>{selectedGoal.goalWeightage}%</Box>
                        </Typography>
                        </Box>

                        {selectedGoal.sbr_review_status && (() => {
                        const cfg = getSubGoalStatusConfig(selectedGoal.sbr_review_status);
                        return (
                            <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, py: 0.6, borderRadius: '8px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                            <Box sx={{ color: cfg.color, display: 'flex', alignItems: 'center', '& svg': { fontSize: 14 } }}>{cfg.icon}</Box>
                            <Typography sx={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{cfg.label}</Typography>
                            </Box>
                        );
                        })()}

                        {selectedGoal.mu_completed_weightage != null && selectedGoal.mu_completed_weightage !== 'N/A' && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, py: 0.6, borderRadius: '8px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <Timeline sx={{ fontSize: 14, color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
                            Progress:&nbsp;<Box component="span" sx={{ color: '#f59e0b' }}>{selectedGoal.mu_completed_weightage}%</Box>
                            </Typography>
                        </Box>
                        )}
                    </Box>
                    )}
                </Box>

                {/* Body */}
                <DialogContent sx={{ p: 0, background: '#f8fafc' }}>
                    {selectedGoal && (() => {
                    const categoryName = selectedGoal.categoryName?.trim() ? selectedGoal.categoryName : 'N/A';
                    const categoryDescription = selectedGoal.categoryDescription?.trim() ? selectedGoal.categoryDescription : 'N/A';
                    const { truncated: truncatedCategoryName, isTruncated: isCategoryNameTruncated } = truncateText(categoryName);

                    return (
                        <Box sx={{ p: 3 }}>
                        {/* Fixed meta cards */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                            mb: 3,
                        }}>
                            <Box sx={{ p: 2, borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                <Category sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>Category Name</Typography>
                            </Box>
                            <Typography
                                sx={{
                                fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', wordBreak: 'break-word',
                                cursor: isCategoryNameTruncated ? 'pointer' : 'default',
                                '&:hover': isCategoryNameTruncated ? { color: '#0284c7', textDecoration: 'underline' } : {},
                                }}
                                onClick={isCategoryNameTruncated ? () => handleOpenTextModal('Category Name', categoryName) : undefined}
                            >
                                {truncatedCategoryName}
                            </Typography>
                            </Box>

                            <Box sx={{ p: 2, borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                <Task sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>Sub Task Name</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>
                                {selectedGoal.sub_task_name?.trim() ? selectedGoal.sub_task_name : 'N/A'}
                            </Typography>
                            </Box>
                        </Box>

                        {/* Dynamic columns */}
                        {selectedGoal.columns.length > 0 && (
                            <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', whiteSpace: 'nowrap' }}>
                                Goal Information
                                </Typography>
                                <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #e2e8f0, transparent)' }} />
                            </Box>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 1.5,
                            }}>
                                {selectedGoal.columns.map((col) => {
                                const rawValue = col.tgd_value?.trim() ? col.tgd_value : 'N/A';
                                const { truncated, isTruncated } = truncateText(rawValue);
                                const isEmpty = rawValue === 'N/A';
                                return (
                                    <Box
                                    key={col.tgd_pid}
                                    onClick={isTruncated ? () => handleOpenTextModal(col.column_name, col.tgd_value) : undefined}
                                    sx={{
                                        p: 2, borderRadius: '10px', background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        cursor: isTruncated ? 'pointer' : 'default',
                                        transition: 'box-shadow 0.2s, border-color 0.2s',
                                        '&:hover': isTruncated ? { boxShadow: '0 4px 16px rgba(2,132,199,0.1)', borderColor: '#bae6fd' } : {},
                                    }}
                                    >
                                    {/* Column heading (restored from old code) */}
                                    <Typography sx={{
                                        fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em',
                                        textTransform: 'uppercase', color: '#64748b', mb: 0.75
                                    }}>
                                        {col.column_name}
                                    </Typography>

                                    {/* Column value */}
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: isEmpty ? 400 : 500,
                                        color: isEmpty ? '#94a3b8' : '#1e293b',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.55,
                                    }}>
                                        {rawValue}
                                    </Typography>
                                    </Box>
                                );
                                })}
                            </Box>
                            </>
                        )}
                        </Box>
                    );
                    })()}
                </DialogContent>

                {/* Footer */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    px: 3, py: 2,
                    borderTop: '1px solid #e2e8f0',
                    background: '#fff',
                }}>
                    <Button
                    onClick={handleCloseDetailsModal}
                    variant="contained"
                    disableElevation
                    sx={{
                        background: '#0f172a',
                        color: '#f1f5f9',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        px: 3,
                        py: 0.9,
                        '&:hover': { background: '#1e293b' },
                    }}
                    >
                    Close
                    </Button>
                </Box>
                </Dialog>

            {/* Template Status Change Modal */}
            <Dialog
                open={openTemplateStatusModal}
                onClose={handleCloseTemplateStatusModal}
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
                        <IconButton onClick={handleCloseTemplateStatusModal} size="small">
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
                            backgroundColor: getStatusConfig(CurrentTemplateStatus).backgroundColor,
                            border: `1px solid ${alpha(getStatusConfig(CurrentTemplateStatus).color, 0.2)}`,
                        }}>
                            {getStatusConfig(CurrentTemplateStatus).icon}
                            <Typography variant="body1" fontWeight="600" color={getStatusConfig(CurrentTemplateStatus).color}>
                                {getStatusConfig(CurrentTemplateStatus).label}
                            </Typography>
                        </Box>
                    </Box>

                    {nextAllowedTemplateStatuses.blocked && nextAllowedTemplateStatuses.alertMessage && (
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
                            {nextAllowedTemplateStatuses.alertMessage}
                        </Alert>
                    )}

                    {/*  Show status dropdown + comment only when NOT blocked and options exist */}
                    {!nextAllowedTemplateStatuses.blocked && nextAllowedTemplateStatuses.options.length > 0 ? (
                        <>
                            <FormControl fullWidth error={statusError} sx={{ mb: 3 }}>
                                <InputLabel>Select New Status</InputLabel>
                                <Select
                                    value={selectedNextTemplateStatus}
                                    label="Select New Status"
                                    onChange={(e) => { setSelectedNextTemplateStatus(e.target.value); setStatusError(false); }}
                                >
                                    <MenuItem value="" disabled>
                                        <em>Choose a status...</em>
                                    </MenuItem>
                                    {nextAllowedTemplateStatuses.options.map((statusOption) => (
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
                    ) : !nextAllowedTemplateStatuses.blocked ? (
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
                {!nextAllowedTemplateStatuses.blocked && nextAllowedTemplateStatuses.options.length > 0 && (
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
                            onClick={handleSubmitTemplateStatusChange}
                            variant="contained"
                            disabled={!selectedNextTemplateStatus}
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
        </>
    );
};

export default GoalViewPageUserById;