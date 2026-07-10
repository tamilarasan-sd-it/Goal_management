// src/views/add_new_goal/AddGoalsTable.jsx
// ✅ EXCEL-STYLE TABLE UI DESIGN
// Professional spreadsheet interface with inline editing

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { createSelector } from 'reselect';
import {
    Container, Paper, Typography, Button, Box, IconButton, Chip,
    LinearProgress, Skeleton, Alert, TextField, MenuItem, Checkbox,
    Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery,
    Autocomplete, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Tooltip, Collapse, Avatar, alpha, useTheme, FormControl,
    InputLabel, Select, Tabs, Tab, Stack, Badge
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, Send as SendIcon, Info as InfoIcon, Functions as FunctionsIcon,
    Edit as EditIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon,
    ArrowBack as ArrowBackIcon, Assignment as AssignmentIcon, Person as PersonIcon,
    TrendingUp as TrendingUpIcon, ExpandMore as ExpandMoreIcon, Close as CloseIcon,
    Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Category as CategoryIcon,
    TrackChanges as TrackChangesIcon, Description as DescriptionIcon,
    FilterList as FilterListIcon, TableChart as TableChartIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { redirectAction, setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction, addAction, updateAction, deleteAction } from '../../StoreRedux/actions/commonActions';

// ============================================================================
// REDUX SELECTOR
// ============================================================================
const getAddGoalDetails = createSelector(
    state => state?.dataService?.pages,
    state => state?.dataService,
    (pages, dataService) => {
        const page = pages?.add_new_goal;
        return {
            loading: page?.loading || {},
            data: page?.data || {},
            AddSuccess: dataService?.AddSuccess,
            UpdateSuccess: dataService?.UpdateSuccess,
            DeleteSuccess: dataService?.DeleteSuccess,
            error: dataService?.error,
            message: dataService?.message,
            isPageNeedToRedirect: dataService?.isPageNeedToRedirect
        };
    }
);

// ============================================================================
// SWAL CONFIGURATION - Z-INDEX FIX
// ============================================================================
const swalConfig = {
    customClass: {
        container: 'swal-z-index-fix'
    }
};

// Add global style for SweetAlert z-index
const swalStyles = `
    .swal-z-index-fix {
        z-index: 9999 !important;
    }
    .swal2-container {
        z-index: 9999 !important;
    }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AddGoalsTable = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // ============================================================================
    // INJECT SWAL STYLES
    // ============================================================================
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = swalStyles;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    const goalDetails = useSelector(getAddGoalDetails);

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentGoal, setCurrentGoal] = useState(null);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [selectedResponsibleMembers, setSelectedResponsibleMembers] = useState([]);
    const [unselectedResponsibleMembers, setUnSelectedResponsibleMembers] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState({});
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [selectedGoalForMembers, setSelectedGoalForMembers] = useState(null);

    // ============================================================================
    // DATA EXTRACTION FROM REDUX
    // ============================================================================
    const assignmentData = goalDetails.data.GetAssignmentData;
    const goalsData = goalDetails.data.GetGoalsData || [];
    const categories = assignmentData?.categories || [];
    const deptEmployees = goalDetails.data.GetDepartmentEmployees || [];
    const templateColumns = useMemo(() => assignmentData?.template_columns || [], [assignmentData]);

    const filteredTemplateColums = useMemo(() => templateColumns.filter(data =>
        data.column_name !== 'Monthly Notes' &&
        data.column_name !== 'Monthly Status' &&
        data.column_name !== 'Monthly Work Percentage'
    ), [templateColumns]);
    const goalOwnerEmployeeId = assignmentData?.ta_assigned_to_user_id;
    const goalOwnerName = assignmentData?.goal_owner_name;

    const totalMaxWeightage = useMemo(() => {
        if (!categories || categories.length === 0) return 0;
        return categories.reduce((sum, cat) => sum + parseFloat(cat.tc_max_weightage || 0), 0);
    }, [categories]);

    // ============================================================================
    // INITIALIZE VISIBLE COLUMNS
    // ============================================================================
    useEffect(() => {
        if (filteredTemplateColums.length > 0 && Object.keys(visibleColumns).length === 0) {
            const initialVisible = {};
            filteredTemplateColums.forEach(col => {
                initialVisible[col.column_pid] = true;
            });
            setVisibleColumns(initialVisible);
        }
    }, [filteredTemplateColums, visibleColumns]);

    // ============================================================================
    // EFFECT: LOAD DATA ON MOUNT
    // ============================================================================
    useEffect(() => {
        if (assignmentId) {
            dispatch(setLoading('add_new_goal', 'getAssignmentLoad', true));
            dispatch(fetchByIdAction('application/json', 'add_new_goal', 'GetAssignmentData', 'getAssignmentLoad', assignmentId));

            dispatch(setLoading('add_new_goal', 'getGoalsLoad', true));
            dispatch(fetchByIdAction('application/json', 'add_new_goal', 'GetGoalsData', 'getGoalsLoad', assignmentId));

            dispatch(setLoading('add_new_goal', 'getDeptEmployeesLoad', true));
            dispatch(fetchByIdAction('application/json', 'add_new_goal', 'GetDepartmentEmployees', 'getDeptEmployeesLoad', assignmentId));
        }
    }, [dispatch, assignmentId]);

    // ============================================================================
    // EFFECT: HANDLE SUCCESS/ERROR RESPONSES
    // ============================================================================
    useEffect(() => {
        if (goalDetails.AddSuccess || goalDetails.UpdateSuccess || goalDetails.DeleteSuccess) {
            setDialogOpen(false);
            setFormData({});
            setFormErrors({});
            setSelectedResponsibleMembers([]);
            setUnSelectedResponsibleMembers([]);

            dispatch(setLoading('add_new_goal', 'getGoalsLoad', true));
            dispatch(fetchByIdAction('application/json', 'add_new_goal', 'GetGoalsData', 'getGoalsLoad', assignmentId));
            dispatch(setLoading('add_new_goal', 'getAssignmentLoad', true));
            dispatch(fetchByIdAction('application/json', 'add_new_goal', 'GetAssignmentData', 'getAssignmentLoad', assignmentId));
        }

        if (goalDetails.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: goalDetails.error,
                confirmButtonColor: theme.palette.error.main
            });
        }
    }, [goalDetails.AddSuccess, goalDetails.UpdateSuccess, goalDetails.DeleteSuccess, goalDetails.error, dispatch, assignmentId]);

    // ============================================================================
    // MEMO: GROUP GOALS BY CATEGORY
    // ============================================================================
    const goalsByCategory = useMemo(() => {
        const grouped = {};
        if (Array.isArray(goalsData)) {
            goalsData.forEach(goal => {
                const catId = goal.tg_category_id;
                if (!grouped[catId]) {
                    grouped[catId] = [];
                }
                grouped[catId].push(goal);
            });
        }
        return grouped;
    }, [goalsData]);

    const isValidToRedirect = categories.every(category => {
        const categoryGoals = goalsByCategory[category.category_pid] || [];
        const totalWeightage = categoryGoals.reduce(
            (sum, g) => sum + parseFloat(g.tg_goal_weightage),
            0
        );

        if (categoryGoals.length === 0) {
            return false;
        }

        if (Math.abs(totalWeightage - category.tc_max_weightage) > Number.EPSILON) {
            return false;
        }

        return true;
    });

    useEffect(() => {
        if (goalDetails.AddSuccess || goalDetails.UpdateSuccess) {
            if (isValidToRedirect) {
                dispatch(redirectAction());
            }
        }
    }, [goalDetails.AddSuccess, goalDetails.UpdateSuccess, dispatch, isValidToRedirect]);

    useEffect(() => {
        if (goalDetails.isPageNeedToRedirect) {
            navigate('/add-goals/' + assignmentId);
        }
    }, [goalDetails.isPageNeedToRedirect, navigate]);

    // ============================================================================
    // FUNCTION: VALIDATION
    // ============================================================================
    const validateGoalForm = (data) => {
        const errors = {};

        if (!data.sub_task_or_goal_name || data.sub_task_or_goal_name.trim() === '') {
            errors.sub_task_or_goal_name = 'Sub Task / Sub Goal is required';
        }

        filteredTemplateColums.forEach(column => {
            const fieldKey = `column_${column.column_pid}`;
            const isRequired = column.tcm_is_required === 1 || column.column_is_required === 1;
            const value = data[fieldKey];

            if (isRequired && (!value || value.toString().trim() === '')) {
                errors[fieldKey] = `${column.column_name} is required`;
            }
        });

        if (!data.tg_goal_weightage || data.tg_goal_weightage <= 0) {
            errors.tg_goal_weightage = 'Task Weightage must be greater than 0';
        } else if (data.tg_goal_weightage > 100) {
            errors.tg_goal_weightage = 'Task Weightage cannot exceed 100%';
        }

        if (currentCategory && currentCategory.category_pid) {
            const categoryGoals = goalsByCategory[currentCategory.category_pid] || [];
            const currentWeightage = categoryGoals
                .filter(g => currentGoal ? g.tg_pid !== currentGoal.tg_pid : true)
                .reduce((sum, g) => sum + parseFloat(g.tg_goal_weightage), 0);

            const newWeightage = parseFloat(data.tg_goal_weightage);
            const totalWeightage = currentWeightage + newWeightage;

            if (totalWeightage > currentCategory.tc_max_weightage) {
                const availableWeightage = (currentCategory.tc_max_weightage - currentWeightage).toFixed(2);
                errors.tg_goal_weightage = `Weightage Exceeds limit. Value must be <= ${availableWeightage}%.`;
            }
        }

       /*  if (selectedResponsibleMembers.length === 0) {
            errors.responsible_members = 'At least one responsible member must be selected.';
        } */

        return errors;
    };

    // ============================================================================
    // HANDLER: OPEN DIALOG
    // ============================================================================
    const handleOpenDialog = (category, goal = null) => {
        setCurrentCategory(category);
        setCurrentGoal(goal);
        setFormErrors({});

        if (goal) {
            const responsibleIds = goal.responsible_members
                ? goal.responsible_members.map(m => m.grm_employee_id)
                : [];
            setSelectedResponsibleMembers(responsibleIds);

            const initialFormData = {
                tg_goal_weightage: goal.tg_goal_weightage || '',
                sub_task_or_goal_name: goal.sub_task_name || ''
            };

            if (goal.goal_data && Array.isArray(goal.goal_data)) {
                goal.goal_data.forEach(data => {
                    const fieldKey = `column_${data.tgd_column_id}`;
                    initialFormData[fieldKey] = data.tgd_value;
                });
            }

            setFormData(initialFormData);
        } else {
            setSelectedResponsibleMembers([]);
            setFormData({ tg_goal_weightage: '', sub_task_or_goal_name: '' });
        }

        setEmployeeSearchTerm('');
        setDialogOpen(true);
    };

    const handleOpenMembersDialog = (goal) => {
        setSelectedGoalForMembers(goal);
        setMembersDialogOpen(true);
    };


    // ============================================================================
    // HANDLER: FORM SUBMIT
    // ============================================================================
    const handleFormSubmit = () => {
        if (!currentCategory) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Category information is missing'
            });
            return;
        }

        const goalDataArray = filteredTemplateColums.map(column => ({
            column_id: column.column_pid,
            value: (formData[`column_${column.column_pid}`] || '').toString().trim()
        }));

        const goalData = {
            tg_assignment_id: parseInt(assignmentId),
            tg_template_id: assignmentData?.ta_template_id,
            tg_category_id: currentCategory.category_pid,
            tg_goal_owner: goalOwnerEmployeeId,
            tg_goal_weightage: parseFloat(formData.tg_goal_weightage) || 0,
            sub_task_or_goal_name: formData.sub_task_or_goal_name,
            tg_timeline: 'Q1', // Default or find from dynamic fields if needed
            tg_priority: 'Medium', // Default or find from dynamic fields if needed
            tg_status: 'Not Started',
            responsible_members: selectedResponsibleMembers || [],
            unselect_responsible_members: unselectedResponsibleMembers || [],
            goal_data: goalDataArray
        };

        const errors = validateGoalForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: `<div style="text-align: left;">${Object.values(errors).map(err => `<p>• ${err}</p>`).join('')}</div>`
            });
            return;
        }

        if (currentGoal) {
            goalData.tg_pid = currentGoal.tg_pid;
            console.log('Updating existing goal:', goalData.tg_pid)
            const data = {
                tg_pid: goalData.tg_pid, ...goalData,
            }
            dispatch(setLoading('add_new_goal', 'addNewGoalLoad', true));
            dispatch(updateAction('application/json', 'add_new_goal', 'AddNewGoalData', 'addNewGoalLoad', 'update_goal', data));
        } else {
            console.log('Adding new goal:', goalData)
            dispatch(setLoading('add_new_goal', 'addNewGoalLoad', true));
            dispatch(addAction('application/json', 'add_new_goal', 'AddNewGoalData', 'addNewGoalLoad', goalData));
        }
    };

    // ============================================================================
    // HANDLER: DELETE
    // ============================================================================
    const handleDeleteGoal = (goal) => {
        Swal.fire({
            title: 'Delete Goal?',
            text: 'Are you sure you want to delete this goal?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: theme.palette.error.main,
            confirmButtonText: 'Yes, delete it'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(setLoading('add_new_goal', 'addNewGoalLoad', true));
                dispatch(deleteAction('application/json', 'add_new_goal', 'AddNewGoalData', 'addNewGoalLoad', { tg_pid: goal.tg_pid, tg_assignment_id: parseInt(assignmentId) }));
            }

        });
    };

    // ============================================================================
    // HANDLER: SUBMIT FOR REVIEW
    // ============================================================================
    // const handleSubmit = () => {
    //     let hasErrors = false;
    //     let errorMessages = [];

    //     categories.forEach(category => {
    //         const categoryGoals = goalsByCategory[category.category_pid] || [];
    //         const totalWeightage = categoryGoals.reduce((sum, g) => sum + parseFloat(g.tg_goal_weightage), 0);

    //         if (categoryGoals.length === 0) {
    //             hasErrors = true;
    //             errorMessages.push(`<li>Category "<strong>${category.category_name}</strong>" must have at least one goal</li>`);
    //         }
    //         if (Math.abs(totalWeightage - category.tc_max_weightage) > Number.EPSILON) {
    //             hasErrors = true;
    //             errorMessages.push(`<li>Category "<strong>${category.category_name}</strong>" weightage must equal ${category.tc_max_weightage}%</li>`);
    //         }
    //     });

    //     if (hasErrors) {
    //         Swal.fire({
    //             icon: 'error',
    //             title: 'Validation Failed',
    //             html: `<div style="text-align: left;"><ul>${errorMessages.join('')}</ul></div>`
    //         });
    //         return;
    //     }

    //     Swal.fire({
    //         title: 'Submit for Review?',
    //         icon: 'question',
    //         showCancelButton: true,
    //         confirmButtonColor: theme.palette.success.main,
    //         confirmButtonText: 'Yes, Submit'
    //     }).then((result) => {
    //         if (result.isConfirmed) {

    //             const goalDetails = {
    //                 assignmentData: assignmentData,
    //                 goalsData: goalsData
    //             }

    //             const GoalDetailsForSubmitReviewer = {
    //                 assignmentId: parseInt(assignmentId),
    //                 goalDetails: goalDetails
    //             }

    //             dispatch(setLoading('add_new_goal', 'submitLoad', true));
    //             dispatch(addAction('application/json', 'add_new_goal', 'SubmitReview', 'submitLoad', GoalDetailsForSubmitReviewer));
    //             navigate('/goal-views');
    //         }
    //     });
    // };

    // ============================================================================
    // HELPER: GET CATEGORY PROGRESS
    // ============================================================================
    const getCategoryProgress = (category) => {
        const categoryGoals = goalsByCategory[category.category_pid] || [];
        const currentWeightage = categoryGoals.reduce((sum, g) => sum + parseFloat(g.tg_goal_weightage), 0);

        return {
            current: currentWeightage,
            max: category.tc_max_weightage,
            percentage: (currentWeightage / category.tc_max_weightage) * 100,
            remaining: category.tc_max_weightage - currentWeightage
        };
    };

    // ============================================================================
    // ✅ MOVED ABOVE EARLY RETURNS — fixes Rules of Hooks violation
    // ============================================================================
    const currentCategoryData = categories[selectedCategory];
    const currentCategoryGoals = currentCategoryData
        ? (goalsByCategory[currentCategoryData.category_pid] || [])
        : [];
    const progress = currentCategoryData
        ? getCategoryProgress(currentCategoryData)
        : { current: 0, max: 0, percentage: 0 };

    // Adds ta_status from assignmentData to each goal
    const currentCategoryGoalsWithStatus = useMemo(() => {
        if (!Array.isArray(currentCategoryGoals) || !assignmentData) {
            return currentCategoryGoals;
        }
        return currentCategoryGoals.map(goal => ({
            ...goal,
            ta_status: assignmentData.ta_status
        }));
    }, [currentCategoryGoals, assignmentData]);


    // ============================================================================
    // HELPER: TOGGLE COLUMN VISIBILITY
    // ============================================================================
    const toggleColumnVisibility = (columnId) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnId]: !prev[columnId]
        }));
    };

    // ============================================================================
    // HELPER: GET VALUE FROM GOAL DATA
    // ============================================================================
    const getGoalColumnValue = (goal, columnId) => {
        if (!goal.goal_data) return '-';
        const data = goal.goal_data.find(d => d.tgd_column_id === columnId);
        return data?.tgd_value || '-';
    };

    // ============================================================================
    // RENDER: DYNAMIC FIELD
    // ============================================================================
    const renderDynamicField = (column) => {
        const fieldKey = `column_${column.column_pid}`;
        const value = formData[fieldKey] || '';
        const isRequired = column.tcm_is_required === 1;
        const error = formErrors[fieldKey];
        const label = `${column.column_name}${isRequired ? ' *' : ''}`;

        switch (column.column_data_type) {
            case 'textarea':
                return (
                    <TextField
                        fullWidth multiline rows={3}
                        label={label} value={value}
                        onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        error={!!error} helperText={error}
                        size="small"
                    />
                );

            case 'number':
                return (
                    <TextField
                        fullWidth type="number"
                        label={label} value={value}
                        onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        error={!!error} helperText={error}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        size="small"
                    />
                );

            case 'date':
                return (
                    <TextField
                        fullWidth type="date"
                        label={label} value={value}
                        onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        error={!!error} helperText={error}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                );

            case 'dropdown':
            case 'select':
                let options = [];
                try {
                    options = JSON.parse(column.column_options || '[]');
                } catch (e) {
                    options = [];
                }

                return (
                    <FormControl fullWidth error={!!error} size="small">
                        <InputLabel>{label}</InputLabel>
                        <Select
                            value={value}
                            onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                            label={label}
                        >
                            <MenuItem value="">-- Select --</MenuItem>
                            {options.map((option, idx) => (
                                <MenuItem key={idx} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );

            default:
                return (
                    <TextField
                        fullWidth
                        label={label} value={value}
                        onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        error={!!error} helperText={error}
                        size="small"
                    />
                );
        }
    };

    // ============================================================================
    // LOADING STATE
    // ============================================================================
    if (goalDetails.loading.getAssignmentLoad) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
            </Container>
        );
    }

    if (!assignmentData) {
        return (
            <Container maxWidth="xl" sx={{ mt: 3 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <WarningIcon sx={{ fontSize: 60, color: theme.palette.warning.main, mb: 2 }} />
                    <Typography variant="h5" fontWeight="600" gutterBottom>
                        Assignment Not Found
                    </Typography>
                    <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/templates')} sx={{ mt: 2 }}>
                        Back to Templates
                    </Button>
                </Paper>
            </Container>
        );
    }



    const allowedStatusesForSubmit = [
        'Submitted',

    ];

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
            {/* ========== HEADER ========== */}
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white'
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 2, color: 'white !important' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                            <TableChartIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight="700" sx={{ flexWrap: 'wrap', gap: 2, color: 'white !important' }}>
                                {assignmentData.template_name}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, flexWrap: 'wrap', gap: 2, color: 'white !important' }}>
                                {goalOwnerName} • {assignmentData.template_year}
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <IconButton  onClick={() => window.history.back()} sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), color: 'white' }}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* ========== CATEGORY TABS ========== */}
            <Box sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <Tabs
                    value={selectedCategory}
                    onChange={(e, newValue) => setSelectedCategory(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTabs-indicator': {
                            display: 'none', // Hide default indicator
                        },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            py: 1.5,
                            px: 3,
                            color: 'text.secondary',
                            opacity: 0.7,
                            '&.Mui-selected': {
                                color: 'primary.main',
                                opacity: 1,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                        },
                    }}
                >
                    {categories.map((cat, index) => {
                        const catProgress = getCategoryProgress(cat);
                        const isComplete = Math.abs(catProgress.current - catProgress.max) < 0.01;
                        const goalsCount = goalsByCategory[cat.category_pid]?.length || 0;

                        return (
                            <Tab
                                key={cat.category_pid}
                                label={
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                                        <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                                            {cat.category_name}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Chip
                                                label={goalsCount}
                                                size="small"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    bgcolor: selectedCategory === index
                                                        ? 'primary.main'
                                                        : alpha(theme.palette.grey[500], 0.2),
                                                    color: selectedCategory === index ? 'white' : 'text.primary',
                                                }}
                                            />
                                            {isComplete && (
                                                <CheckCircleIcon color="success" sx={{ fontSize: 20, ml: 0.5 }} />
                                            )}
                                        </Box>
                                    </Stack>
                                }
                            />
                        );
                    })}
                </Tabs>

                {/* Category Progress Bar */}
                {currentCategoryData && (
                    <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="caption" fontWeight="600" color="text.secondary">
                                Category Weightage Progress
                            </Typography>
                            <Typography variant="caption" fontWeight="700" color="primary">
                                {progress.current.toFixed(2)}% / {progress.max}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(progress.percentage, 100)}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.grey[500], 0.1),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: progress.current > progress.max
                                        ? theme.palette.error.main
                                        : progress.percentage === 100
                                            ? theme.palette.success.main
                                            : theme.palette.warning.main
                                }
                            }}
                        />
                    </Box>
                )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog(currentCategoryData)}
                    disabled={!currentCategoryData || progress.current >= progress.max}
                    sx={{ fontWeight: '600', minWidth: 180, color: '#ffff !important' }}
                >
                    Add Sub Task / Sub Goal
                </Button>
            </Box>

            {/* ========== COLUMN VISIBILITY CONTROLS ========== */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, background: alpha(theme.palette.primary.main, 0.02) }}>
                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                    <FilterListIcon color="primary" />
                    <Typography variant="h6" fontWeight="600" color="text.primary">
                        Customize View
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    {filteredTemplateColums.map(col => (
                        <Chip
                            key={col.column_pid}
                            label={col.column_name}
                            size="small"
                            onClick={() => toggleColumnVisibility(col.column_pid)}
                            icon={visibleColumns[col.column_pid]
                                ? <VisibilityIcon sx={{ fontSize: '1rem !important' }} />
                                : <VisibilityOffIcon sx={{ fontSize: '1rem !important' }} />
                            }
                            sx={{
                                fontWeight: '600',
                                transition: 'all 0.2s ease-in-out',
                                bgcolor: visibleColumns[col.column_pid] ? 'primary.main' : 'background.paper',
                                color: visibleColumns[col.column_pid] ? 'white' : 'text.secondary',
                                border: `1px solid ${visibleColumns[col.column_pid] ? theme.palette.primary.main : theme.palette.divider}`,
                                '& .MuiChip-icon': {
                                    color: visibleColumns[col.column_pid] ? 'white' : 'text.secondary',
                                },
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[3],
                                    bgcolor: visibleColumns[col.column_pid] ? 'primary.dark' : alpha(theme.palette.grey[500], 0.1),
                                }
                            }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* ========== EXCEL-STYLE TABLE ========== */}
            <TableContainer
                component={Paper}
                elevation={2}
                sx={{
                    mb: 2,
                    maxHeight: 600,
                    border: `2px solid ${theme.palette.divider}`,
                    '& .MuiTableCell-root': {
                        borderRight: `1px solid ${theme.palette.divider}`,
                        '&:last-child': {
                            borderRight: 'none'
                        }
                    }
                }}
            >

                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    bgcolor: theme.palette.grey[100],
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    width: 50,
                                    textAlign: 'center'
                                }}
                            >
                                Sno
                            </TableCell>

                            <TableCell
                                sx={{
                                    bgcolor: theme.palette.grey[100],
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    minWidth: 250,
                                    textAlign: 'center'
                                }}
                            >
                                sub task /Sub goal
                            </TableCell>


                            {/* Dynamic Columns */}
                            {filteredTemplateColums
                                .filter(col => visibleColumns[col.column_pid])
                                .sort((a, b) => a.tcm_order - b.tcm_order)
                                .map(col => (
                                    <TableCell
                                        key={col.column_pid}
                                        sx={{
                                            bgcolor: theme.palette.grey[100],
                                            fontWeight: '700',
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            minWidth:
                                                col.column_name === 'Timeline' || col.column_name === 'Priority'
                                                    ? 120
                                                    : col.column_data_type === 'textarea' ? 200 : 150,
                                            textAlign: 'center'
                                        }}
                                    >
                                        {col.column_name}
                                        {(col.tcm_is_required === 1) && (
                                            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                                        )}
                                    </TableCell>
                                ))
                            }

                            {/* ✅ NEW: RESPONSIBLE MEMBERS COLUMN */}
                            <TableCell
                                sx={{
                                    bgcolor: theme.palette.grey[100],
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    minWidth: 150,
                                    textAlign: 'center'
                                }}
                            >
                                Sub goal Owner's
                            </TableCell>

                            <TableCell
                                sx={{
                                    bgcolor: theme.palette.grey[100],
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    minWidth: 150,
                                    textAlign: 'center'
                                }}
                            >
                                Sub Goal Status
                            </TableCell>

                            <TableCell
                                sx={{
                                    bgcolor: theme.palette.grey[100],
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    width: 100
                                }}
                            >
                                WEIGHTAGE
                            </TableCell>

                            <TableCell
                                sx={{
                                    bgcolor: theme.palette.grey[100],
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    width: 120,
                                    textAlign: 'center'
                                }}
                            >
                                ACTIONS
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {currentCategoryGoalsWithStatus.length > 0 ? (
                            currentCategoryGoalsWithStatus.map((goal, index) => (
                                <React.Fragment key={goal.tg_pid}>
                                    <TableRow
                                        hover
                                        sx={{
                                            '&:nth-of-type(odd)': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.02)
                                            },
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.08)
                                            }
                                        }}
                                    >
                                        {/* Row Number */}
                                        <TableCell sx={{ fontWeight: '700', textAlign: 'center', fontSize: '0.875rem' }}>
                                            {index + 1}
                                        </TableCell>

                                       {/*  <TableCell sx={{
                                            fontSize: '0.875rem',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}>
                                            <Tooltip title={goal.sub_task_name} placement="top">
                                                <span>{goal.sub_task_name}</span>
                                            </Tooltip>
                                        </TableCell> */}
                                        <TableCell sx={{
                                            fontSize: '0.875rem',
                                            width: '200px',
                                            maxWidth: '200px',
                                            minWidth: '200px',
                                        }}>
                                            <Tooltip  placement="top">
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
                                                    <span>{goal.sub_task_name}</span>
                                                </Box>
                                            </Tooltip>
                                        </TableCell>

                                        {/* Dynamic Column Values */}
                                        {filteredTemplateColums
                                            .filter(col => visibleColumns[col.column_pid])
                                            .sort((a, b) => a.tcm_order - b.tcm_order)
                                            .map(col => {
                                                const value = getGoalColumnValue(goal, col.column_pid);

                                                return (
                                                    <TableCell
                                                        key={col.column_pid}
                                                        sx={{
                                                            fontSize: '0.875rem',
                                                            maxWidth: col.column_data_type === 'textarea' ? 300 : 200,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <Tooltip title={value} placement="top">
                                                            <span>{value}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                );
                                            })
                                        }

                                        {/* ✅ NEW: RESPONSIBLE MEMBERS DISPLAY */}
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            {goal.responsible_members && goal.responsible_members.length > 0 ? (
                                                <Tooltip title="View Responsible Members">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenMembersDialog(goal)}
                                                        sx={{ color: theme.palette.info.main }}
                                                    >
                                                        <Badge badgeContent={goal.responsible_members.length} color="primary">
                                                            <VisibilityIcon fontSize="small" />
                                                        </Badge>
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Chip label="N/A" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={goal.tg_sub_goal_status || 'N/A'}
                                                color="primary"
                                                size="small"
                                                sx={{ fontWeight: '700', minWidth: 60 }}
                                            />
                                        </TableCell>

                                        {/* Weightage */}
                                        <TableCell>
                                            <Chip
                                                label={`${goal.tg_goal_weightage}%`}
                                                color="primary"
                                                size="small"
                                                sx={{ fontWeight: '700', minWidth: 60 }}
                                            />
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(currentCategoryData, goal)}
                                                        sx={{ color: theme.palette.primary.main }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {(goal?.tg_sub_goal_status === "Rejected" || goal?.ta_status === 'Submitted') && (
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteGoal(goal)}
                                                            sx={{ color: theme.palette.error.main }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={filteredTemplateColums.filter(c => visibleColumns[c.column_pid]).length + 4}
                                    sx={{ textAlign: 'center', py: 6 }}
                                >
                                    <WarningIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 1 }} />
                                    <Typography variant="h6" fontWeight="600" color="text.secondary">
                                        No Goals Added Yet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Click "Add Sub Task / Sub Goal" to get started
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ========== ACTION BUTTONS ========== */}
            {/* <Paper elevation={2} sx={{ p: 2, position: 'sticky', bottom: 16, zIndex: 100, bgcolor: 'white' }}>
                <Stack direction="row" spacing={2} justifyContent="end">


                    <Stack direction="row" spacing={2}>
                        {allowedStatusesForSubmit.includes(assignmentData?.ta_status) && (
                            <Button
                                variant="contained"
                                size="large"
                                color="success"
                                startIcon={<SendIcon />}
                                onClick={handleSubmit}
                                sx={{ fontWeight: '600', minWidth: 180 }}
                            >
                                Submit for Review
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Paper> */}

            {/* ========== ADD/EDIT DIALOG ========== */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle
                    sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="h6" fontWeight="700" sx={{ color: '#fff' }}>
                            {currentGoal ? 'Edit New Sub Task / Sub Goal' : 'Add New Sub Task / Sub Goal'}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {currentCategory &&
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                mb: 3,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}><CategoryIcon /></Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Category</Typography>
                                        <Typography variant="h6" fontWeight="600" color="primary.dark">
                                            {currentCategory.category_name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    <Avatar variant="rounded" sx={{ bgcolor: 'secondary.main', color: 'white' }}><TrendingUpIcon /></Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">KPI / Success Metric</Typography>
                                        <Typography variant="body1" fontWeight="500">{currentCategory.tc_kpi_metric || 'N/A'}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    <Avatar variant="rounded" sx={{ bgcolor: 'success.main', color: 'white' }}><TrackChangesIcon /></Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Target</Typography>
                                        <Typography variant="body1" fontWeight="500">{currentCategory.tc_target || 'N/A'}</Typography>
                                    </Box>
                                </Box>
                                {currentCategory.tc_category_description && (
                                    <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <Avatar variant="rounded" sx={{ bgcolor: 'info.main', color: 'white' }}><DescriptionIcon /></Avatar>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Description</Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                                                {currentCategory.tc_category_description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Paper>}


                    {currentCategory && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Available Goal Weightage for this Goal Category: </strong>
                                {(
                                    currentCategory.tc_max_weightage -
                                    getCategoryProgress(currentCategory).current +
                                    (currentGoal ? parseFloat(currentGoal.tg_goal_weightage || 0) : 0)
                                ).toFixed(2)}% out of a total of {currentCategory.tc_max_weightage}%
                            </Typography>
                        </Alert>
                    )}

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <TextField
                            label="Sub Task / Sub Goal *"
                            value={formData.sub_task_or_goal_name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, sub_task_or_goal_name: e.target.value }))}
                            error={!!formErrors.sub_task_or_goal_name}
                            helperText={formErrors.sub_task_or_goal_name}
                            size="small"
                            fullWidth
                            sx={{ gridColumn: 'span 2' }}
                        />


                        {/* Weightage */}
                        <TextField
                            type="number"
                            label="Task Weightage (%) *"
                            value={formData.tg_goal_weightage || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Only allow integers (no decimals)
                                if (value === '' || /^\d+$/.test(value)) {
                                    setFormData(prev => ({ ...prev, tg_goal_weightage: value }));
                                }
                            }}
                            onWheel={(e) => e.target.blur()} // Prevent scroll change
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault(); // Prevent arrow key increment/decrement
                                }
                                if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
                                    e.preventDefault(); // Prevent decimal point and scientific notation
                                }
                            }}
                            onPaste={(e) => {
                                const pastedText = e.clipboardData.getData('text');
                                if (!/^\d+$/.test(pastedText)) {
                                    e.preventDefault(); // Prevent pasting non-integer values
                                }
                            }}
                            error={!!formErrors.tg_goal_weightage}
                            helperText={formErrors.tg_goal_weightage}
                            InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                            size="small"
                            fullWidth
                            sx={{ gridColumn: 'span 2' }}
                        />

                        {/* Dynamic Fields */}
                        {filteredTemplateColums
                            .filter(col => col.tcm_is_visible === 1)
                            .sort((a, b) => a.tcm_order - b.tcm_order)
                            .map(column => (
                                <Box key={column.column_pid} sx={{ gridColumn: column.column_data_type === 'textarea' ? 'span 2' : 'auto' }}>
                                    {renderDynamicField(column)}
                                </Box>
                            ))
                        }

                        {/* Responsible Members */}
                        <Box sx={{ gridColumn: 'span 2' }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Select Sub goal Owner's"
                                value={employeeSearchTerm}
                                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                sx={{ mb: 1 }}
                                error={!!formErrors.responsible_members}
                                helperText={formErrors.responsible_members}
                            />
                            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                                {deptEmployees.filter(emp =>
                                    selectedResponsibleMembers.includes(emp.employee_id) ||
                                    emp.emp_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                                    emp.employee_id.toLowerCase().includes(employeeSearchTerm.toLowerCase())
                                ).map(emp => (
                                    <Box
                                        key={emp.emp_id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 0.5,
                                            borderRadius: 1,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                                        }}
                                    >
                                        {/* <Checkbox
                                            size="small"
                                            checked={selectedResponsibleMembers.includes(emp.employee_id)}
                                            onChange={() => {
                                                setSelectedResponsibleMembers(prev =>
                                                    prev.includes(emp.employee_id)
                                                        ? prev.filter(id => id !== emp.employee_id)
                                                        : [...prev, emp.employee_id]
                                                );
                                            }}
                                        /> */}
                                        <Checkbox
                                            size="small"
                                            checked={selectedResponsibleMembers.includes(emp.employee_id)}
                                            onChange={() => {
                                                if (selectedResponsibleMembers.includes(emp.employee_id)) {
                                                    // Uncheck
                                                    setSelectedResponsibleMembers(prev =>
                                                        prev.filter(id => id !== emp.employee_id)
                                                    );

                                                    setUnSelectedResponsibleMembers(prev =>
                                                        prev.includes(emp.employee_id)
                                                            ? prev
                                                            : [...prev, emp.employee_id]
                                                    );
                                                } else {
                                                    // Check
                                                    setSelectedResponsibleMembers(prev => [
                                                        ...prev,
                                                        emp.employee_id
                                                    ]);

                                                    // Remove from unselected list if re-selected
                                                    setUnSelectedResponsibleMembers(prev =>
                                                        prev.filter(id => id !== emp.employee_id)
                                                    );
                                                }
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="body2" fontWeight="600">
                                                {emp.emp_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {emp.employee_id} • {emp.emp_pos}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Paper>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={goalDetails.loading.addNewGoalLoad}
                        startIcon={currentGoal ? <SaveIcon /> : <AddIcon />}
                        sx={{ fontWeight: '600' }}
                    >
                        {goalDetails.loading.addNewGoalLoad
                            ? (currentGoal ? 'Updating...' : 'Adding...')
                            : (currentGoal ? 'Update New Sub Task / Sub Goal' : 'Add New Sub Task / Sub Goal')
                        }
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ========== RESPONSIBLE MEMBERS DIALOG ========== */}
            <Dialog
                open={membersDialogOpen}
                onClose={() => setMembersDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <PersonIcon />
                        <Typography variant="h6" fontWeight="700" sx={{ color: '#fff' }}>
                            Sub Goal Owner's
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setMembersDialogOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 2 }}>
                    {selectedGoalForMembers && (
                        <Box>

                            <Stack spacing={2} mt={2}>
                                {selectedGoalForMembers.responsible_members?.map((member, idx) => {
                                    const employeeId = member.grm_employee_id || member.employee_id;
                                    const empDetails = deptEmployees.find(
                                        emp => (emp.employee_id || emp.emp_id) === employeeId
                                    );

                                    return (
                                        <Paper key={idx} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: theme.palette.primary.main,
                                                    color: 'white',
                                                    width: 40,
                                                    height: 40
                                                }}
                                            >
                                                {(empDetails?.emp_name || member.emp_name || 'U')
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" fontWeight="600">
                                                    {empDetails?.emp_name || member.emp_name || 'Unknown'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ID: {employeeId}
                                                </Typography>
                                                {empDetails?.emp_pos && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {empDetails.emp_pos}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default AddGoalsTable;