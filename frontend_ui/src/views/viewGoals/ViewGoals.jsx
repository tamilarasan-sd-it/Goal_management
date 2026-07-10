// src/views/viewGoals/ViewGoals.jsx
// ✅ PROFESSIONAL UI IMPROVEMENTS + MOBILE RESPONSIVE + PAGINATION
// ✅ All functionality preserved - only UI/UX enhanced

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
    Container, Paper, Typography, Button, Box, Grid, FormControl,
    InputLabel, Select, MenuItem, Chip, Skeleton, Avatar, alpha, useTheme,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, TextField, InputAdornment, Card, CardContent,
    LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Divider, CircularProgress, Badge, Collapse, Fade, useMediaQuery,
    TablePagination
} from '@mui/material';
import {
    Visibility as VisibilityIcon, Search as SearchIcon,
    FileDownload as FileDownloadIcon,
    CheckCircle as CheckCircleIcon, Warning as WarningIcon,
    Assignment as AssignmentIcon, Refresh as RefreshIcon, TrackChanges as TrackChangesIcon,
    HourglassEmpty as HourglassEmptyIcon, DonutLarge as DonutLargeIcon, Block as BlockIcon,
    ExpandMore as ExpandMoreIcon, Update as UpdateIcon, Edit as EditIcon,
    Lock as LockIcon, Close as CloseIcon, Clear as ClearIcon,
    TuneOutlined as TuneOutlinedIcon, FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction, addAction } from '../../StoreRedux/actions/commonActions';
import * as XLSX from 'xlsx';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ============================================================================
// REDUX SELECTORS
// ============================================================================
const getViewGoalsState = createSelector(
    state => state?.dataService?.pages,
    state => state?.dataService,
    (pages, dataService) => {
        const vg = pages?.view_goals || {};
        return {
            loading: vg.loading || {},
            data: vg.data || {},
            AddSuccess: dataService?.AddSuccess,
            error: dataService?.error
        };
    }
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ViewGoals = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const viewGoals = useSelector(getViewGoalsState);

    // Responsive breakpoints
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    // Auth
    const currentUser = useSelector(state => state?.auth?.user);
    const employeeId = currentUser?.id || sessionStorage.getItem('employee_id');

    const isAdmin = employeeId === '12345';
    const currentYear = new Date().getFullYear();

    // ============================================================================
    // STATE
    // ============================================================================
    const [filters, setFilters] = useState({
        goalOwner: '',
        department: '',
        templateId: '',
        year: currentYear,
        categoryId: '',
        status: '',
        priority: '',
        timeline: '',
        searchKeyword: ''
    });

    const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [selectedGoalId, setSelectedGoalId] = useState(null);

    // Monthly Update Dialog
    const [muDialogOpen, setMuDialogOpen] = useState(false);
    const [muGoal, setMuGoal] = useState(null);
    const [muForm, setMuForm] = useState({
        mu_status: 'Not Started',
        mu_completed_weightage: 0,
        notes: ''
    });

    // Trigger states for refetching
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Data from Redux
    const goalsData = viewGoals.data.GoalsListData || [];
    const filterOptions = viewGoals.data.FilterOptionsData || {};
    const summaryStats = viewGoals.data.SummaryStatsData || {};
    const goalDetail = viewGoals.data.GoalDetailsData || null;

    // ============================================================================
    // COMPUTED - Active Filter Count
    // ============================================================================
    const activeFilterCount = useMemo(() => {
        return Object.entries(filters).filter(([key, value]) => {
            if (key === 'year') return false;
            if (key === 'searchKeyword') return value.trim() !== '';
            return value !== '';
        }).length;
    }, [filters]);

    // ============================================================================
    // COMPUTED - Paginated Data
    // ============================================================================
     // ✅ Extract numeric suffix from "GOAL-YYYY-NNN" for sorting
    const getGoalNumber = (id) => {
        const match = id?.match(/GOAL-\d{4}-(\d+)$/);
        return match ? parseInt(match[1], 10) : Infinity; // unmatched/null IDs go to the end
    };

    // ✅ SORTED DATA - ascending by goal number
    const sortedGoalsData = useMemo(() => {
        return [...goalsData].sort(
            (a, b) => getGoalNumber(a.tg_goal_generated_id) - getGoalNumber(b.tg_goal_generated_id)
        );
    }, [goalsData]);

    const paginatedGoals = useMemo(() => {
        if (rowsPerPage === -1) {
            return sortedGoalsData;
        }
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedGoalsData.slice(startIndex, endIndex);
    }, [sortedGoalsData, page, rowsPerPage]);
   /*  const paginatedGoals = useMemo(() => {
        if (rowsPerPage === -1) {
            return goalsData;
        }
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return goalsData.slice(startIndex, endIndex);
    }, [goalsData, page, rowsPerPage]);
 */
    // ============================================================================
    // HELPER - Build Query String from Filters
    // ============================================================================
    const buildFilterQueryString = useMemo(() => {
        const hasActiveFilters = activeFilterCount > 0;
        
        if (!hasActiveFilters) {
            return employeeId;
        }

        const params = new URLSearchParams({
            userId: employeeId,
            ...filters
        });

        return params.toString();
    }, [employeeId, filters, activeFilterCount]);

    // ============================================================================
    // EFFECTS - FETCH FILTER OPTIONS
    // ============================================================================
    useEffect(() => {
        if (!employeeId) return;
        
        console.log('📋 Fetching FilterOptionsData for:', employeeId);
        dispatch(setLoading('view_goals', 'filterOptionsLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'view_goals',
            'FilterOptionsData',
            'filterOptionsLoad',
            employeeId
        ));
    }, [dispatch, employeeId]);

    // ============================================================================
    // EFFECTS - FETCH SUMMARY STATS
    // ============================================================================
    useEffect(() => {
        if (!employeeId) return;
        
        console.log('📊 Fetching SummaryStatsData for:', employeeId);
        dispatch(setLoading('view_goals', 'summaryStatsLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'view_goals',
            'SummaryStatsData',
            'summaryStatsLoad',
            employeeId
        ));
    }, [dispatch, employeeId, refreshTrigger]);

    // ============================================================================
    // EFFECTS - FETCH GOALS
    // ============================================================================
    useEffect(() => {
        if (!employeeId) return;

        const queryString = buildFilterQueryString;
        
        console.log('🎯 Fetching GoalsListData with query string:', queryString);
        dispatch(setLoading('view_goals', 'goalsListLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'view_goals',
            'GoalsListData',
            'goalsListLoad',
            queryString
        ));
    }, [dispatch, employeeId, buildFilterQueryString, refreshTrigger]);

    // ============================================================================
    // EFFECTS - FETCH GOAL DETAIL
    // ============================================================================
    useEffect(() => {
        if (!selectedGoalId) return;
        
        console.log('🔍 Fetching GoalDetailsData for goal:', selectedGoalId);
        dispatch(setLoading('view_goals', 'goalDetailsLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'view_goals',
            'GoalDetailsData',
            'goalDetailsLoad',
            selectedGoalId
        ));
    }, [dispatch, selectedGoalId]);

    // ============================================================================
    // EFFECTS - Auto-set year filter
    // ============================================================================
    useEffect(() => {
        if (!filters.year && filterOptions.years?.length > 0) {
            const hasCurrentYear = filterOptions.years.some(
                y => Number(y.template_year) === currentYear
            );
            setFilters(prev => ({
                ...prev,
                year: hasCurrentYear ? currentYear : filterOptions.years[0].template_year
            }));
        }
    }, [filterOptions.years, currentYear, filters.year]);

    // ============================================================================
    // EFFECTS - Handle MU success / error
    // ============================================================================
    useEffect(() => {
        if (viewGoals.AddSuccess && muDialogOpen) {
            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Monthly update saved successfully',
                timer: 1800,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            setMuDialogOpen(false);
            setMuForm({ mu_status: 'Not Started', mu_completed_weightage: 0, notes: '' });
            setRefreshTrigger(prev => prev + 1);
        }
        
        if (viewGoals.error && muDialogOpen) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: viewGoals.error,
                confirmButtonColor: theme.palette.error.main
            });
        }
    }, [viewGoals.AddSuccess, viewGoals.error, muDialogOpen, theme.palette.error.main]);

    // ============================================================================
    // EFFECTS - Reset page when filters change
    // ============================================================================
    useEffect(() => {
        setPage(0);
    }, [filters, goalsData.length]);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        console.log('🧹 Clearing all filters');
        setFilters({
            goalOwner: '',
            department: '',
            templateId: '',
            year: currentYear,
            categoryId: '',
            status: '',
            priority: '',
            timeline: '',
            searchKeyword: ''
        });
    };

    const handleRefresh = () => {
        console.log('🔄 Refreshing data');
        setRefreshTrigger(prev => prev + 1);
    };

    const handleViewDetails = (goal) => {
        setSelectedGoal(goal);
        setSelectedGoalId(goal.tg_pid);
        setDetailOpen(true);
    };

    const handleOpenMU = (goal) => {
        const isFirst = !goal.current_mu_pid;
        setMuGoal(goal);
        setMuForm({
            mu_status: isFirst ? 'Not Started' : (goal.current_mu_status || 'Not Started'),
            mu_completed_weightage: isFirst ? 0 : (parseFloat(goal.current_mu_weightage) || 0),
            notes: ''
        });
        setMuDialogOpen(true);
    };

    const handleSaveMU = () => {
        if (!muGoal) return;

        const isFirst = !muGoal.current_mu_pid;
        const payload = {
            mu_goal_id: muGoal.tg_pid,
            mu_month: new Date().getMonth() + 1,
            mu_year: new Date().getFullYear(),
            mu_status: isFirst ? 'Not Started' : muForm.mu_status,
            mu_completed_weightage: isFirst ? 0 : (parseFloat(muForm.mu_completed_weightage) || 0),
            mu_updated_by: employeeId,
            update_data: muForm.notes ? [{ column_id: 7, value: muForm.notes }] : []
        };

        dispatch(setLoading('view_goals', 'muSaveLoad', true));
        dispatch(addAction(
            'application/json',
            'view_goals',
            'SaveMonthlyUpdate',
            'muSaveLoad',
            payload
        ));
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // ============================================================================
    // HELPERS
    // ============================================================================
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'warning';
            case 'Blocked': return 'error';
            default: return 'default';
        }
    };

    const getPriorityDot = (priority) => {
        const map = { High: 'error', Medium: 'warning', Low: 'success' };
        return map[priority] || 'default';
    };

    // const handleExportCSV = useCallback(() => {
    //     // 1. Check if there is data to export from the active goals list
    //     if (!goalsData || goalsData.length === 0) {
    //         Swal.fire({
    //             icon: 'warning',
    //             title: 'No Data',
    //             text: 'No data available to export based on current filters.',
    //             confirmButtonColor: theme.palette.warning.main
    //         });
    //         return;
    //     }

    //     // 2. Map CSV Headers & Columns to match your current data structure (GoalsListData)
    //     // Adjust the keys (e.g., goal_title, current_mu_status) to perfectly match your backend response fields.
    //     const csvContent = [
    //         [
    //             'Goal Owner', 'Goal Owner Department', 'Goal Owner Position', 'Task Name', 'Task ID', 'Goal Description', 'KPI / Success Metric', 'Category', 'Task Weightage', 'Status', 'Priority', 'Progress', 'This Month', 'Notes', 'Target', 'Timeline', 'Dependencies'         ],
    //             ...goalsData.map(goal => [
    //             goal.goal_owner_name ?? '',
    //             goal.goal_owner_department ?? '',
    //             goal.goal_owner_position ?? '',
    //             goal.sub_task_name ?? '',
    //             goal.tg_goal_generated_id ?? '',
    //             goal.goal_data?.[0]?.tgd_value ?? '',
    //             goal.goal_data?.[1]?.tgd_value ?? '',
    //             goal.category_name ?? '',
    //             goal.tg_goal_weightage ?? '',
    //             goal.current_mu_status ?? '',
    //             goal.tg_priority ?? '',
    //             goal.tg_status ?? '',
    //             goal.goal_data?.[5]?.tgd_value ?? '',
    //             goal.goal_data?.[2]?.tgd_value ?? '',
    //             goal.goal_data?.[3]?.tgd_value ?? '',
    //             goal.goal_data?.[7]?.tgd_value ?? '',
    //             goal.dependencies ?? '', // Aligned with the 'Dependencies' header
    //         ])
    //     ].map(row => row.join(',')).join('\n');

    //     // 3. Generate file name dynamically based on the filter's selected year
    //     const exportYear = filters.year || currentYear;

    //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    //     const url = window.URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = `goals-report-${exportYear}.csv`;
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    //     window.URL.revokeObjectURL(url);

    //     // 4. Alert user of success
    //     Swal.fire({
    //         icon: 'success',
    //         title: 'Exported!',
    //         text: `${goalsData.length} records exported successfully`,
    //         timer: 2000,
    //         showConfirmButton: false,
    //         toast: true,
    //         position: 'top-end'
    //     });
    // // Add correct dependency array strings to avoid stale closures
    // }, [goalsData, filters.year, currentYear, employeeId, theme]);

    const handleExportCSV = useCallback(() => {
        // 1. Check if there is data to export from the active goals list
        if (!goalsData || goalsData.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No data available to export based on current filters.',
                confirmButtonColor: theme.palette.warning.main
            });
            return;
        }

        try {
            // Create XLSX Workbook
            const wb = XLSX.utils.book_new();

            // Dynamically get the export year and context
            const exportYear = filters.year || currentYear;

            // Global styles inherited from your configuration layout
            const bannerStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "4F81BD" } }, // Steel Blue Banner
                font: { name: 'Arial', sz: 14, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
            const titleData = [[`View Sub Tasks / Sub Goals`]];
            const ws1Data = goalsData.map(goal => ({
                'Task Name': goal.sub_task_name || '',
                'Task ID': goal.tg_goal_generated_id || '',
                'Owner': goal.goal_owner_name || '',
                'Department': goal.goal_owner_department || '',
                'Category': goal.category_name || '',
                'Task Weightage': goal.tg_goal_weightage || 0,
                'Status': goal.current_mu_status || '',
                'Priority': goal.tg_priority || '',
                'Progress': goal.progress_percentage || 0,
                'This Month': goal.current_mu_status || '',
                
            }));
            const ws1 = XLSX.utils.aoa_to_sheet(titleData);
            ws1['!rows'] = [{ hpt: 35 }, { hpt: 25 }];
            XLSX.utils.sheet_add_json(ws1, ws1Data, { origin: 'A2' });
            ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9} }];
            ws1['A1'] = ws1['A1'] || { t: 's', v: titleData[0][0] };
            ws1['A1'].s = bannerStyle;

            const OwnerHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "228B22" } }, alignment: { vertical: "center" } }; 
            const OwnerRowStyle      = { fill: { patternType: 'solid', fgColor: { rgb: "90EE90" } }, alignment: { vertical: "center" } }; // Even
            const OwnerRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "E8FBE8" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            const TaskHeaderStyle  = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "8C6212" } }, alignment: { vertical: "center" } }; 
            const TaskRowStyle     = { fill: { patternType: 'solid', fgColor: { rgb: "D4AF37" } }, alignment: { vertical: "center" } }; // Even
            const TaskRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "F3E5AB" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            const CategoryHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "115E59" } }, alignment: { vertical: "center" } }; 
            const CategoryRowStyle    = { fill: { patternType: 'solid', fgColor: { rgb: "CCFBFA" } }, alignment: { vertical: "center" } }; // Even
            const CategoryRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "F0FDFA" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            const TaskWeightageHeaderStyle  = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "301934" } }, alignment: { vertical: "center" } }; 
            const TaskWeightageRowStyle     = { fill: { patternType: 'solid', fgColor: { rgb: "9966CC" } }, alignment: { vertical: "center" } }; // Even
            const TaskWeightageRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "E6E6FA" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            const StatusHeaderStyle  = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "6B0D2F" } }, alignment: { vertical: "center" } }; 
            const StatusRowStyle     = { fill: { patternType: 'solid', fgColor: { rgb: "D21F54" } }, alignment: { vertical: "center" } }; // Even
            const StatusRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "F0AEC3" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            const PriorityProgressHeaderStyle  = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "9E4716" } }, alignment: { vertical: "center" } }; 
            const PriorityProgressRowStyle     = { fill: { patternType: 'solid', fgColor: { rgb: "FF6600" } }, alignment: { vertical: "center" } }; // Even
            const PriorityProgressRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "FFC299" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            // Notes (Column N / Index 13)
            const NotesHeaderStyle   = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "0A192F" } }, alignment: { vertical: "center", wrapText: true } }; 
            const NotesRowStyle      = { fill: { patternType: 'solid', fgColor: { rgb: "007FFF" } }, alignment: { vertical: "top", wrapText: true } }; 
            const NotesRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "B3D9FF" } }, alignment: { vertical: "top", wrapText: true } }; 

            // Default Styles (Fallback for unmapped columns)
            const DefaultHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11 }, fill: { patternType: 'solid', fgColor: { rgb: "EAEAEA" } }, alignment: { vertical: "center" } }; 
            const DefaultRowStyle    = { fill: { patternType: 'solid', fgColor: { rgb: "EAEFF5" } }, alignment: { vertical: "center" } }; // Even
            const DefaultRowStyleLight = { fill: { patternType: 'solid', fgColor: { rgb: "F2F5F9" } }, alignment: { vertical: "center" } }; // Odd (Lighter)

            function getHeaderStyle(C) {
                if (C <= 1)      return OwnerHeaderStyle;
                if (C <= 3)      return TaskHeaderStyle;
                if (C === 4)     return CategoryHeaderStyle;
                if (C === 5)     return TaskWeightageHeaderStyle;
                if (C === 6)     return StatusHeaderStyle;
                if (C <= 8)      return PriorityProgressHeaderStyle;
                if (C === 9)    return NotesHeaderStyle;
                return DefaultHeaderStyle; 
            }

            // Updated to return the lighter palette when isOdd is true
            function getRowStyle(C, isOdd) {
                if (C <= 1)      return isOdd ? OwnerRowStyleLight : OwnerRowStyle; 
                if (C <= 3)      return isOdd ? TaskRowStyleLight : TaskRowStyle;
                if (C === 4)     return isOdd ? CategoryRowStyleLight : CategoryRowStyle;
                if (C === 5)     return isOdd ? TaskWeightageRowStyleLight : TaskWeightageRowStyle;
                if (C === 6)     return isOdd ? StatusRowStyleLight : StatusRowStyle;
                if (C <= 8)      return isOdd ? PriorityProgressRowStyleLight : PriorityProgressRowStyle;
                if (C === 9)    return isOdd ? NotesRowStyleLight : NotesRowStyle;
                return isOdd ? DefaultRowStyleLight : DefaultRowStyle;
            }

            // --- 3. Parse Sheet & Apply Styles ---

            const ws1Range = XLSX.utils.decode_range(ws1['!ref']);
            for (let R = ws1Range.s.r; R <= ws1Range.e.r; ++R) {
                
                if (R === 1) { // Header Row Formatting
                    for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
                        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws1[cellRef]) continue;
                        
                        if (C === 10 || C === 11 || C === 12) continue; // Skip Progress/This Month columns

                        ws1[cellRef].s = getHeaderStyle(C);
                    }
                } 
                
                else if (R > 1) { // Data Row Formatting (Handles both Even and Odd rows)
                    const isOdd = (R % 2 !== 0); // Determine if row is odd
                    
                    for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
                        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws1[cellRef]) continue;
                        
                        if (C === 10 || C === 11 || C === 12) continue; // Skip Progress/This Month columns

                        // Applies the correctly tinted color while preserving formatting/wrapping rules
                        ws1[cellRef].s = getRowStyle(C, isOdd);
                    }
                }
            }

            // --- 4. Auto-fit Column Logic ---
            const ws1Cols = [];
            // Process columns up to index 9 (Column J)
            for (let C = ws1Range.s.c; C <= Math.min(ws1Range.e.c, 9); ++C) {
                let maxLen = 11;
                for (let R = 1; R <= ws1Range.e.r; ++R) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws1[cellRef] && ws1[cellRef].v) {
                        const cellLen = ws1[cellRef].v.toString().length;
                        if (cellLen > maxLen) maxLen = cellLen;
                    }
                }
                // Cap column width to 45 max for visual scaling, otherwise pad length
                ws1Cols.push({ wch: maxLen > 45 ? 45 : maxLen + 4 }); 
            }
            ws1['!cols'] = ws1Cols;

            // --- 5. Commit Sheet to Workbook ---
            XLSX.utils.book_append_sheet(wb, ws1, 'Goals Summary');

            const titleData2 = [[`Goal Details`]];

            const ws2Data = goalsData.map(goal => ({
                'Goal Owner': goal.goal_owner_name || '',
                'Goal Owner Department': goal.goal_owner_department || '',
                'Goal Owner Position': goal.goal_owner_position || '',
                'Template': goal.sub_task_name || '',                  // Col D (Index 3) -> Wrapped
                'Goal Description': goal.goal_data?.[0]?.tgd_value || '',// Col E (Index 4) -> Wrapped
                'KPI / Success Metric': goal.goal_data?.[1]?.tgd_value || '', // Col F (Index 5) -> Wrapped
                'Target': goal.goal_data?.[2]?.tgd_value || '',         // Col G (Index 6) -> Wrapped
                'Timeline': goal.goal_data?.[3]?.tgd_value || '',
                'Priority': goal.goal_data?.[4]?.tgd_value || '',
                'Notes': goal.goal_data?.[5]?.tgd_value || '',
                'Dependencies': goal.dependencies || '',
            }));

            // Initialize the sheet using the Title Array
            const ws2 = XLSX.utils.aoa_to_sheet(titleData2);
            ws2['!rows'] = [{ hpt: 35 }, { hpt: 25 }];
            XLSX.utils.sheet_add_json(ws2, ws2Data, { origin: 'A2' });
            ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10} }];
            ws2['A1'] = ws2['A1'] || { t: 's', v: titleData2[0][0] };
            ws2['A1'].s = bannerStyle;


            const EmpDetailsHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "3D2314" } }, alignment: { vertical: "center" } };
            const EmpDetailsRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "A0522D" } }, alignment: { vertical: "top" } }; // Even
            const EmpDetailsRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "E2725B" } }, alignment: { vertical: "top" } }; // Odd (Pure White)

            const TemplateHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "2B321A" } }, alignment: { vertical: "center" } };
            const TemplateRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "A3B18A" } }, alignment: { vertical: "top" } }; // Even
            const TemplateRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "E8EFE0" } }, alignment: { vertical: "top" } }; 

            const GoalHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "5C4033" } }, alignment: { vertical: "center" } };
            const GoalRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "A8826F" } }, alignment: { vertical: "top" } }; // Even
            const GoalRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "EBDED6" } }, alignment: { vertical: "top" } }; 

            const SuccessHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "4A151C" } }, alignment: { vertical: "center" } };
            const SuccessRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "A85A65" } }, alignment: { vertical: "top" } }; // Even
            const SuccessRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "F8C7CE" } }, alignment: { vertical: "top" } };

            const TargetHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "4A1715" } }, alignment: { vertical: "center" } };
            const TargetRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "E1706D" } }, alignment: { vertical: "top" } }; // Even
            const TargetRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "F2B2B0" } }, alignment: { vertical: "top" } }; 

            const TimelineHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "3B4214" } }, alignment: { vertical: "center" } };
            const TimelineRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "758031" } }, alignment: { vertical: "top" } }; // Even
            const TimelineRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "DDE6A3" } }, alignment: { vertical: "top" } }; 

            const NotesDependenciesHeaderStyle = { font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, fill: { patternType: 'solid', fgColor: { rgb: "3D0725" } }, alignment: { vertical: "center" } };
            const NotesDependenciesRowStyle       = { fill: { patternType: 'solid', fgColor: { rgb: "B22C7B" } }, alignment: { vertical: "top" } }; // Even
            const NotesDependenciesRowStyleLight  = { fill: { patternType: 'solid', fgColor: { rgb: "E388BE" } }, alignment: { vertical: "top" } }; 

            function cloneStyle(sourceStyle) {
                let cloned = Object.assign({}, sourceStyle);
                cloned.alignment = Object.assign({}, sourceStyle.alignment || {});
                return cloned;
            }

            function getHeaderStyle1(C) {
                let baseStyle;

                // Direct assignment based on column ranges
                if (C <= 2) {
                    baseStyle = cloneStyle(EmpDetailsHeaderStyle);
                } else if (C === 3) {
                    baseStyle = cloneStyle(TemplateHeaderStyle);
                } else if (C === 4) {
                    baseStyle = cloneStyle(GoalHeaderStyle);
                } else if (C === 5) {
                    baseStyle = cloneStyle(SuccessHeaderStyle);
                } else if (C === 6) {
                    baseStyle = cloneStyle(TargetHeaderStyle);
                } else if (C <=8 ) {
                    baseStyle = cloneStyle(TimelineHeaderStyle);
                } else if (C <=10 ) {
                    baseStyle = cloneStyle(NotesDependenciesHeaderStyle);
                } else {
                    baseStyle = cloneStyle(DefaultHeaderStyle);
                }
                
                // Formatting specific to the Template header zone (Columns D through G)
                if (C >= 3 && C <= 6) {
                    baseStyle.alignment.wrapText = true;
                    baseStyle.alignment.horizontal = "center";
                    baseStyle.alignment.vertical = "center";
                }
                
                return baseStyle;
            }

            function getRowStyle1(C, isOdd) {
                let baseStyle;

                // Distribute row styles safely using the clone tool
                if (C <= 2) {
                    baseStyle = isOdd ? cloneStyle(EmpDetailsRowStyleLight) : cloneStyle(EmpDetailsRowStyle);
                } else if (C === 3 ) {
                    baseStyle = isOdd ? cloneStyle(TemplateRowStyleLight) : cloneStyle(TemplateRowStyle);
                } else if (C === 4) {
                    baseStyle = isOdd ? cloneStyle(GoalRowStyleLight) : cloneStyle(GoalRowStyle);
                } else if (C === 5) {
                    baseStyle = isOdd ? cloneStyle(SuccessRowStyleLight) : cloneStyle(SuccessRowStyle);
                } else if (C === 6) {
                    baseStyle = isOdd ? cloneStyle(TargetRowStyleLight) : cloneStyle(TargetRowStyle);
                } else if (C <= 8) {
                    baseStyle = isOdd ? cloneStyle(TimelineRowStyleLight) : cloneStyle(TimelineRowStyle);
                } else if (C <= 10) {
                    baseStyle = isOdd ? cloneStyle(NotesDependenciesRowStyleLight) : cloneStyle(NotesDependenciesRowStyle);
                } else {
                    baseStyle = isOdd ? cloneStyle(DefaultRowStyleLight) : cloneStyle(DefaultRowStyle);
                }

                // Force word wrap configuration on Template details rows
                if (C >= 3 && C <= 6) {
                    baseStyle.alignment.wrapText = true;
                    baseStyle.alignment.vertical = "top";
                }
                
                return baseStyle;
            }
            const ws2Range = XLSX.utils.decode_range(ws2['!ref']);
            for (let R = ws2Range.s.r; R <= ws2Range.e.r; ++R) {
                for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws2[cellRef]) continue;

                    if (R === 1) { 
                        // Header row gets formatted here
                        ws2[cellRef].s = getHeaderStyle1(C);
                    } else if (R > 1) { 
                        // Data rows receive striping matrix configurations 
                        ws2[cellRef].s = getRowStyle1(C, R % 2 !== 0);
                    }
                }
            }

            // Auto-fit & Clamping Logic
            const ws2Cols = [];
            for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
                let maxLen = 10; 
                for (let R = 1; R <= ws2Range.e.r; ++R) { 
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws2[cellRef] && ws2[cellRef].v) {
                        const cellLen = ws2[cellRef].v.toString().length;
                        if (cellLen > maxLen) maxLen = cellLen;
                    }
                }
                
                // Clamp text-heavy columns so word wrap can clean up formatting cleanly
                if (C >= 3 && C <= 6) {
                    ws2Cols.push({ wch: Math.min(maxLen + 4, 40) });
                } else {
                    ws2Cols.push({ wch: maxLen + 4 }); 
                }
            }
            ws2['!cols'] = ws2Cols;

            XLSX.utils.book_append_sheet(wb, ws2, 'Detailed Goals');
            // ==========================================
            // ===== DOWNLOAD GENERATED EXCEL FILE ======
            // ==========================================
            XLSX.writeFile(wb, `Goals_Full_Report_${exportYear}.xlsx`);

            // Success Alert Callback Pop
            Swal.fire({
                icon: 'success',
                title: 'Exported!',
                text: `${goalsData.length} records with details compiled successfully.`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

        } catch (error) {
            console.error('Error executing sheet data matrix generation:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'An error occurred while rendering columns into the workbook sheets.',
                confirmButtonColor: theme.palette.error.main
            });
        }

    // Sync exact configuration elements context dependency bindings
    }, [goalsData, goalDetail, filters.year, currentYear, theme]);

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* HEADER - Responsive */}
            <Paper elevation={3} sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                mb: { xs: 2, md: 3 },
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                borderRadius: 2
            }}>
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            width: { xs: 48, sm: 56 }, 
                            height: { xs: 48, sm: 56 } 
                        }}>
                            <AssignmentIcon fontSize={isMobile ? 'medium' : 'large'} />
                        </Avatar>
                        <Box>
                            <Typography 
                                variant={isMobile ? 'h5' : 'h4'} 
                                fontWeight="700" 
                                sx={{ color: 'white' }}
                            >
                                View Sub Tasks / Sub Goals
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ opacity: 0.9, color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem'} }}
                            >
                                {isAdmin ? 'All goals across organization' : 'Your personal goals'}
                            </Typography>
                            
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} >
                        <Tooltip title="Export to CSV">
                            <IconButton  onClick={handleExportCSV} sx={{ color: 'white' }}>
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh Data">
                            <IconButton 
                                onClick={handleRefresh} 
                                sx={{ 
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            onClick={() => window.history.back()}
                            startIcon={<ArrowBackIcon />}
                            variant="text"
                            sx={{ 
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)' // Subtle hover effect
                                }
                            }}
                        >
                            Back
                        </Button>
                    </Stack>
                    
                </Stack>
            </Paper>

            {/* SUMMARY STATS - Responsive Grid */}
           <Box sx={{ 
                mb: { xs: 2, md: 3 },
                display: 'grid',
                gap: { xs: 2, sm: 2, md: 3 },
                gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(5, 1fr)'
                }
            }}>
                {[
                    { label: 'Total Sub Goals', key: 'total_goals', color: 'primary', icon: <TrackChangesIcon /> },
                    { label: 'Not Started', key: 'not_started_goals', color: 'info', icon: <HourglassEmptyIcon /> },
                    { label: 'In Progress', key: 'in_progress_goals', color: 'warning', icon: <DonutLargeIcon /> },
                     { label: 'Partially Completed', key: 'Partially_Completed', color: 'secondary', icon: <DonutLargeIcon /> },
                    { label: 'Completed', key: 'completed_goals', color: 'success', icon: <CheckCircleIcon /> },
                ].map(card => (
                        <Card elevation={2} sx={{
                            bgcolor: alpha(theme.palette[card.color]?.main || theme.palette.grey[500], 0.05),
                            borderLeft: `4px solid ${theme.palette[card.color]?.main || theme.palette.grey[500]}`,
                            height: '100%',
                            borderRadius: 2,
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[3],
                            }
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {card.label}
                                        </Typography>
                                        {viewGoals.loading.summaryStatsLoad ? (
                                            <Skeleton variant="text" height={isMobile ? 32 : 40} width={60} />
                                        ) : (
                                            <Typography variant="h4" fontWeight="700" color={`${card.color}.main`}>
                                                {summaryStats[card.key] || 0}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Avatar sx={{
                                        bgcolor: alpha(theme.palette[card.color]?.main || theme.palette.grey[500], 0.1),
                                        color: `${card.color}.main`,
                                        width: 56,
                                        height: 56
                                    }}>
                                        {React.cloneElement(card.icon, { sx: { fontSize: 32 } })}
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                ))}
            </Box>

            {/* FILTERS - Enhanced Responsive Design */}
            <Paper elevation={2} sx={{ mb: { xs: 2, md: 3 }, overflow: 'hidden', borderRadius: 2 }}>
                {/* Filter Header */}
                <Box 
                    sx={{ 
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                    }}
                    onClick={() => setFiltersExpanded(p => !p)}
                >
                    <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                        <Badge badgeContent={activeFilterCount} color="primary">
                            <FilterAltIcon 
                                color="primary" 
                                sx={{ fontSize: { xs: 24, sm: 28 } }} 
                            />
                        </Badge>
                        <Box>
                            <Typography 
                                variant={isMobile ? 'subtitle1' : 'h6'} 
                                fontWeight="600"
                            >
                                Filters & Search
                            </Typography>
                            <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                            >
                                {activeFilterCount > 0 
                                    ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                                    : 'Click to expand filters'
                                }
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {activeFilterCount > 0 && !isMobile && (
                            <Fade in={activeFilterCount > 0}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearFilters();
                                    }}
                                    sx={{ mr: 1 }}
                                >
                                    Clear All
                                </Button>
                            </Fade>
                        )}
                        <ExpandMoreIcon 
                            sx={{ 
                                transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                                fontSize: { xs: 20, sm: 24 }
                            }} 
                        />
                    </Stack>
                </Box>

                {/* Filter Content */}
                <Collapse in={filtersExpanded} timeout={300}>
                    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                        {/* Search - Full Width */}
                        <Box sx={{ mb: { xs: 2, md: 3 } }}>
                            <TextField 
                                fullWidth 
                                size={isMobile ? 'small' : 'medium'}
                                placeholder="🔍 Search by goal name, owner, template, or ID..."
                                value={filters.searchKeyword}
                                onChange={e => handleFilterChange('searchKeyword', e.target.value)}
                                InputProps={{ 
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filters.searchKeyword && (
                                        <InputAdornment position="end">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleFilterChange('searchKeyword', '')}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        borderRadius: 2,
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                                        }
                                    }
                                }}
                            />
                        </Box>

                        <Divider sx={{ mb: 2 }}>
                            <Chip label="FILTER BY" size="small" />
                        </Divider>

                        {/* Mobile: Clear All Button */}
                        {isMobile && activeFilterCount > 0 && (
                            <Button
                                fullWidth
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<ClearIcon />}
                                onClick={handleClearFilters}
                                sx={{ mb: 2 }}
                            >
                                Clear All Filters
                            </Button>
                        )}

                        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                            {/* Admin-only filters */}
                            {isAdmin && (
                                <>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <FormControl size="small" style={{minWidth: 'fit-content'}}>
                                            <InputLabel>Goal Owner</InputLabel>
                                            <Select 
                                                value={filters.goalOwner} 
                                                onChange={e => handleFilterChange('goalOwner', e.target.value)} 
                                                label="Goal Owner"
                                                 sx={{ width: 150 }} 
                                            >
                                                <MenuItem value=""><em>All Owners</em></MenuItem>
                                                {(filterOptions.goalOwners || []).map(o => (
                                                    <MenuItem key={o.employee_id} value={o.employee_id}>
                                                        {o.emp_name} ({o.employee_id})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4} sx={{ width: 'fit-content' }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Department</InputLabel>
                                            <Select 
                                                value={filters.department} 
                                                onChange={e => handleFilterChange('department', e.target.value)} 
                                                label="Department"
                                                 sx={{ width: 150 }} 
                                            >
                                                <MenuItem value=""><em>All Departments</em></MenuItem>
                                                {(filterOptions.departments || []).map(d => (
                                                    <MenuItem key={d.emp_dept} value={d.emp_dept}>
                                                        {d.emp_dept}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </>
                            )}

                            {/* Year */}
                            <Grid item xs={6} sm={4} md={isAdmin ? 4 : 3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Year</InputLabel>
                                    <Select 
                                        value={filters.year || ''} 
                                        onChange={e => handleFilterChange('year', e.target.value)} 
                                        label="Year"
                                        sx={{ width: 150 }} 
                                         MenuProps={{
                                            PaperProps: {
                                            sx: {
                                                maxHeight: 48 * 5,
                                            },
                                            },
                                        }}
                                     >
                                        {(filterOptions.years || []).map(y => (
                                            <MenuItem key={y.template_year} value={y.template_year}>
                                                📅 {y.template_year}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Template */}
                            <Grid item xs={12} sm={8} md={isAdmin ? 6 : 4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Template</InputLabel>
                                    <Select 
                                        value={filters.templateId} 
                                        onChange={e => handleFilterChange('templateId', e.target.value)} 
                                        label="Template"
                                         sx={{ width: 200 }} 
                                          MenuProps={{
                                        PaperProps: {
                                         sx: {
                                                maxHeight: 48 * 5,
                                                width: 200,
                                            },
                                        },
                                    }}
                                    >
                                        <MenuItem value=""><em>All Templates</em></MenuItem>
                                        {(filterOptions.templates || []).map(t => (
                                            <MenuItem key={t.template_pid} value={t.template_pid}  sx={{
                                                    whiteSpace: "normal",  
                                                    wordBreak: "break-word", 
                                                    alignItems: "flex-start", 
                                            }}>
                                                📄 {t.template_name} ({t.template_year})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Category */}
                            <Grid item xs={12} sm={6} md={isAdmin ? 6 : 5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select 
                                        value={filters.categoryId} 
                                        onChange={e => handleFilterChange('categoryId', e.target.value)} 
                                        label="Category"
                                         sx={{ width: 150 }} 
                                          MenuProps={{
                                        PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                        },
                                    }}
                                    >
                                        <MenuItem value=""><em>All Categories</em></MenuItem>
                                        {(filterOptions.categories || []).map(c => (
                                            <MenuItem key={c.category_pid} value={c.category_pid}>
                                                🏷️ {c.category_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Status */}
                            <Grid item xs={6} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select 
                                        value={filters.status} 
                                        onChange={e => handleFilterChange('status', e.target.value)} 
                                        label="Status"
                                         sx={{ width: 150 }} 
                                          MenuProps={{
                                        PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                        },
                                    }}
                                    >
                                        <MenuItem value=""><em>All Status</em></MenuItem>
                                        <MenuItem value="Not Started">📋 Not Started</MenuItem>
                                        <MenuItem value="In Progress">⏳ In Progress</MenuItem>
                                        <MenuItem value="Completed">✅ Completed</MenuItem>
                                        <MenuItem value="Blocked">🚫 Blocked</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Priority */}
                            <Grid item xs={6} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Priority</InputLabel>
                                    <Select 
                                        value={filters.priority} 
                                        onChange={e => handleFilterChange('priority', e.target.value)} 
                                        label="Priority"
                                         sx={{ width: 150 }} 
                                          MenuProps={{
                                        PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                        },
                                    }}
                                    >
                                        <MenuItem value=""><em>All Priority</em></MenuItem>
                                        <MenuItem value="High">🔴 High</MenuItem>
                                        <MenuItem value="Medium">🟡 Medium</MenuItem>
                                        <MenuItem value="Low">🟢 Low</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Timeline */}
                            <Grid item xs={12} sm={4} md={isAdmin ? 6 : 3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Timeline</InputLabel>
                                    <Select 
                                        value={filters.timeline} 
                                        onChange={e => handleFilterChange('timeline', e.target.value)} 
                                        label="Timeline"
                                         sx={{ width: 150 }} 
                                          MenuProps={{
                                        PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                        },
                                    }}
                                    >
                                        <MenuItem value=""><em>All Timeline</em></MenuItem>
                                        <MenuItem value="Q1">📊 Q1 (Jan-Mar)</MenuItem>
                                        <MenuItem value="Q2">📊 Q2 (Apr-Jun)</MenuItem>
                                        <MenuItem value="Q3">📊 Q3 (Jul-Sep)</MenuItem>
                                        <MenuItem value="Q4">📊 Q4 (Oct-Dec)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Active Filters Display */}
                        {activeFilterCount > 0 && (
                            <Fade in={activeFilterCount > 0}>
                                <Box sx={{ mt: { xs: 2, md: 3 }, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        fontWeight="600" 
                                        gutterBottom
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                    >
                                        ACTIVE FILTERS ({activeFilterCount})
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                                        {filters.searchKeyword && (
                                            <Chip
                                                size="small"
                                                label={`Search: "${filters.searchKeyword.slice(0, 20)}${filters.searchKeyword.length > 20 ? '...' : ''}"`}
                                                onDelete={() => handleFilterChange('searchKeyword', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.goalOwner && (
                                            <Chip
                                                size="small"
                                                label={`Owner: ${filterOptions.goalOwners?.find(o => o.employee_id === filters.goalOwner)?.emp_name || filters.goalOwner}`}
                                                onDelete={() => handleFilterChange('goalOwner', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.department && (
                                            <Chip
                                                size="small"
                                                label={`Dept: ${filters.department}`}
                                                onDelete={() => handleFilterChange('department', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.templateId && (
                                            <Chip
                                                size="small"
                                                label={`Template: ${filterOptions.templates?.find(t => t.template_pid === filters.templateId)?.template_name || filters.templateId}`}
                                                onDelete={() => handleFilterChange('templateId', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.categoryId && (
                                            <Chip
                                                size="small"
                                                label={`Category: ${filterOptions.categories?.find(c => c.category_pid === filters.categoryId)?.category_name || filters.categoryId}`}
                                                onDelete={() => handleFilterChange('categoryId', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.status && (
                                            <Chip
                                                size="small"
                                                label={`Status: ${filters.status}`}
                                                onDelete={() => handleFilterChange('status', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.priority && (
                                            <Chip
                                                size="small"
                                                label={`Priority: ${filters.priority}`}
                                                onDelete={() => handleFilterChange('priority', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                        {filters.timeline && (
                                            <Chip
                                                size="small"
                                                label={`Timeline: ${filters.timeline}`}
                                                onDelete={() => handleFilterChange('timeline', '')}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Fade>
                        )}
                    </Box>
                </Collapse>
            </Paper>

            {/* GOALS TABLE - Responsive with Pagination */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer 
                    sx={{ 
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': {
                            height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.3),
                            borderRadius: 4,
                        }
                    }}
                >
                    <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Sno</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 150 }}>Task Name & ID</TableCell>
                                {isAdmin && <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 120 }}>Owner</TableCell>}
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 100 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Task Weightage</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 100 }}>Progress</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>This Month</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {viewGoals.loading.goalsListLoad && goalsData.length === 0 && (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        {[50, 150, 120, 100, 70, 90, 80, 100, 90, 80].slice(0, isAdmin ? 10 : 9).map((w, j) => (
                                            <TableCell key={j}><Skeleton width={w} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}

                            {!viewGoals.loading.goalsListLoad && goalsData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 10 : 9} sx={{ textAlign: 'center', py: { xs: 4, md: 6 } }}>
                                        <WarningIcon sx={{ fontSize: { xs: 48, md: 64 }, color: theme.palette.warning.main, mb: 2 }} />
                                        <Typography variant={isMobile ? 'subtitle1' : 'h6'} color="text.secondary" gutterBottom>
                                            No Goals Found
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {activeFilterCount > 0 
                                                ? 'Try adjusting your filters or search criteria' 
                                                : 'No goals available for the selected year'
                                            }
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            {paginatedGoals.map((goal, idx) => {
                                const hasCurrentMU = !!goal.current_mu_pid;
                                const isLocked = goal.current_mu_locked === 1;
                                const muStatus = goal.current_mu_status || null;
                                const absoluteIndex = page * rowsPerPage + idx + 1;

                                return (
                                    <TableRow 
                                        key={goal.tg_pid} 
                                        hover
                                        sx={{
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.02)
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{absoluteIndex}</TableCell>
                                        <TableCell>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight="600" 
                                                noWrap 
                                                sx={{ 
                                                    maxWidth: { xs: 150, sm: 200 },
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                }}
                                            >
                                                {goal?.sub_task_name }
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            >
                                                 {goal.tg_goal_generated_id?.match(/GOAL-\d{4}-\d+$/)?.[0] || 'N/A'}
                                                {/* {goal.tg_goal_generated_id} */}
                                            </Typography>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <Typography 
                                                    variant="body2" 
                                                    fontWeight="600"
                                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                                >
                                                    {goal.goal_owner_name}
                                                </Typography>
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                >
                                                    {goal.goal_owner_department}
                                                </Typography>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Chip 
                                                label={goal.category_name || '—'} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={`${goal.tg_goal_weightage}%`} 
                                                size="small" 
                                                color="primary"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={goal.tg_status} 
                                                size="small" 
                                                color={getStatusColor(goal.tg_status)}
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Box sx={{
                                                    width: { xs: 8, sm: 10 }, 
                                                    height: { xs: 8, sm: 10 }, 
                                                    borderRadius: '50%',
                                                    bgcolor: theme.palette[getPriorityDot(goal.tg_priority)]?.main || theme.palette.grey[400]
                                                }} />
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                                >
                                                    {goal.tg_priority}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ width: { xs: 80, sm: 100 } }}>
                                                <LinearProgress 
                                                    variant="determinate"
                                                    value={Math.min(goal.progress_percentage || 0, 100)}
                                                    sx={{ 
                                                        height: { xs: 5, sm: 6 }, 
                                                        borderRadius: 3,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                    }}
                                                />
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                >
                                                    {(goal.progress_percentage || 0).toFixed(0)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {hasCurrentMU
                                                ? <Chip 
                                                    label={muStatus} 
                                                    size="small" 
                                                    color={getStatusColor(muStatus)}
                                                    icon={isLocked ? <LockIcon fontSize="small" /> : undefined}
                                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                />
                                                : <Typography 
                                                    variant="caption" 
                                                    color="text.disabled"
                                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                >
                                                    —
                                                </Typography>
                                            }
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Stack direction="row" justifyContent="center" spacing={0.5}>
                                                <Tooltip title="View Details">
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary" 
                                                        onClick={() => handleViewDetails(goal)}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {(!isAdmin || goal.tg_goal_owner === employeeId) && (
                                                    <Tooltip sx={{display:'none !important'}} title={isLocked ? 'Already submitted this month' : (hasCurrentMU ? 'Edit Monthly Update' : 'Add Monthly Update')}>
                                                        <span sx={{display:'none !important'}}>
                                                            <IconButton 
                                                                size="small" 
                                                                color={hasCurrentMU ? 'warning' : 'success'}
                                                                disabled={isLocked} 
                                                                onClick={() => handleOpenMU(goal)}
                                                                sx={{display:'none !important'}}
                                                            >
                                                                {hasCurrentMU ? <EditIcon fontSize="small" /> : <UpdateIcon fontSize="small" />}
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                    component="div"
                    count={goalsData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[{ value: -1, label: 'All' }, 5, 10, 25, 50]}
                    sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '.MuiTablePagination-select': {
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        },
                        '.MuiTablePagination-displayedRows': {
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                    }}
                />
            </Paper>

            {/* GOAL DETAIL DIALOG - Responsive */}
            <Dialog 
                open={detailOpen} 
                onClose={() => setDetailOpen(false)} 
                maxWidth="lg" 
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    py: { xs: 2, sm: 2.5 }
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="600">
                            Goal Details
                        </Typography>
                        {isMobile && (
                            <IconButton 
                                onClick={() => setDetailOpen(false)}
                                sx={{ color: 'white' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        )}
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
                    {viewGoals.loading.goalDetailsLoad ? (
                        <Box><Skeleton height={50} /><Skeleton height={50} /><Skeleton height={50} /></Box>
                    ) : goalDetail ? (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        fontWeight="600"
                                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                    >
                                        GOAL OWNER
                                    </Typography>
                                    <Typography 
                                        variant="body1" 
                                        fontWeight="600"
                                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                    >
                                        {goalDetail.goal_owner_name}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                    >
                                        {goalDetail.goal_owner_department} • {goalDetail.goal_owner_position}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        fontWeight="600"
                                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                    >
                                        TEMPLATE
                                    </Typography>
                                    <Typography 
                                        variant="body1" 
                                        fontWeight="600"
                                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                    >
                                        {goalDetail.template_name} ({goalDetail.template_year})
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                            <Typography 
                                variant="h6" 
                                fontWeight="600" 
                                gutterBottom
                                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                            >
                                Goal Information
                            </Typography>
                            <Grid container spacing={2}>
                                {(goalDetail.goal_data || []).map((d, i) => (
                                    <Grid item xs={12} md={6} key={i}>
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary" 
                                            fontWeight="600"
                                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                        >
                                            {d.column_name?.toUpperCase()}
                                        </Typography>
                                        <Typography 
                                            variant="body2"
                                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                        >
                                            {d.tgd_value || '—'}
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>
                            {goalDetail.responsible_members?.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography 
                                        variant="h6" 
                                        fontWeight="600" 
                                        gutterBottom
                                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        Responsible Members
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {goalDetail.responsible_members.map(m => (
                                            <Chip 
                                                key={m.grm_employee_id}
                                                label={`${m.emp_name} (${m.grm_role})`}
                                                size="small" 
                                                color="primary" 
                                                variant="outlined"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                            />
                                        ))}
                                    </Box>
                                </>
                            )}
                            {goalDetail.monthly_updates?.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography 
                                        variant="h6" 
                                        fontWeight="600" 
                                        gutterBottom
                                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        Monthly Updates
                                    </Typography>
                                    <TableContainer sx={{ overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Month / Year</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Status</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Weightage</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Updated By</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Locked</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Date</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {goalDetail.monthly_updates.map(u => (
                                                    <TableRow key={u.mu_pid}>
                                                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                                            {new Date(u.mu_year, u.mu_month - 1).toLocaleString('default', { month: 'long' })} {u.mu_year}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={u.mu_status} 
                                                                size="small" 
                                                                color={getStatusColor(u.mu_status)}
                                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{u.mu_completed_weightage}%</TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{u.updater_name || u.mu_updated_by}</TableCell>
                                                        <TableCell>
                                                            {u.mu_is_locked ? <CheckCircleIcon color="success" fontSize="small" /> : '—'}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{new Date(u.mu_updated_at).toLocaleDateString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </Box>
                    ) : (
                        <Typography color="text.secondary">No details available</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                    <Button onClick={() => setDetailOpen(false)} size={isMobile ? 'medium' : 'large'}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MONTHLY UPDATE DIALOG - Responsive */}
            <Dialog 
                open={muDialogOpen} 
                onClose={() => setMuDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                    color: 'white',
                    py: { xs: 2, sm: 2.5 }
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="600">
                            {muGoal?.current_mu_pid ? 'Edit' : 'Add'} Monthly Update
                        </Typography>
                        <IconButton 
                            size="small" 
                            sx={{ color: 'white' }} 
                            onClick={() => setMuDialogOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
                    {muGoal && (
                        <Box>
                            <Paper 
                                variant="outlined" 
                                sx={{ 
                                    p: { xs: 1.5, sm: 2 }, 
                                    mb: 2, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.04) 
                                }}
                            >
                                <Typography 
                                    variant="body2" 
                                    fontWeight="600"
                                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                >
                                    {muGoal.goal_data?.[0]?.tgd_value || 'Goal'}
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                >
                                    {muGoal.tg_goal_generated_id} • Category: {muGoal.category_name} • Weightage: {muGoal.tg_goal_weightage}%
                                </Typography>
                            </Paper>

                            <Chip 
                                label={`${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
                                color="primary" 
                                variant="outlined" 
                                size="small" 
                                sx={{ 
                                    mb: 2,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                }} 
                            />

                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Status</InputLabel>
                                <Select 
                                    value={muForm.mu_status}
                                    onChange={e => setMuForm(p => ({ ...p, mu_status: e.target.value }))}
                                    label="Status"
                                    disabled={!muGoal.current_mu_pid}
                                >
                                    <MenuItem value="Not Started">Not Started</MenuItem>
                                    <MenuItem value="In Progress">In Progress</MenuItem>
                                    <MenuItem value="Completed">Completed</MenuItem>
                                    <MenuItem value="Blocked">Blocked</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField 
                                fullWidth 
                                size="small" 
                                label="Completed Weightage (%)" 
                                type="number"
                                value={muForm.mu_completed_weightage}
                                onChange={e => setMuForm(p => ({ ...p, mu_completed_weightage: e.target.value }))}
                                disabled={!muGoal.current_mu_pid}
                                inputProps={{ min: 0, max: parseFloat(muGoal.tg_goal_weightage) }}
                                sx={{ mb: 2 }}
                                helperText={`Max: ${muGoal.tg_goal_weightage}%`}
                            />

                            <TextField 
                                fullWidth 
                                size="small" 
                                label="Monthly Notes" 
                                multiline 
                                rows={isMobile ? 4 : 3}
                                value={muForm.notes}
                                onChange={e => setMuForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Describe progress this month…"
                            />

                            {!muGoal.current_mu_pid && (
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: { xs: 1.5, sm: 2 }, 
                                        mt: 2, 
                                        bgcolor: alpha(theme.palette.info.main, 0.06), 
                                        borderColor: theme.palette.info.main 
                                    }}
                                >
                                    <Typography 
                                        variant="caption" 
                                        color="info.main"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                    >
                                        This is the first monthly update for this goal. Status will be set to <strong>Not Started</strong> automatically.
                                        You can change it next month.
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                    <Button onClick={() => setMuDialogOpen(false)} size={isMobile ? 'medium' : 'large'}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        onClick={handleSaveMU}
                        disabled={viewGoals.loading.muSaveLoad}
                        startIcon={viewGoals.loading.muSaveLoad ? <CircularProgress size={16} color="inherit" /> : null}
                        size={isMobile ? 'medium' : 'large'}
                    >
                        Save Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ViewGoals;
