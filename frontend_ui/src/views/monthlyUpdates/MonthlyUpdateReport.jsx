// src/views/monthlyUpdates/MonthlyUpdatesReport.jsx
// ✅ Admin Report with Status Statistics Dashboard
// Shows: Total Goal Owners, Completed, Pending, Not Started
// ✅ NEW: Added pagination for main report table and employee details dialog

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
    Container, Paper, Typography, Button, Box, IconButton, Chip,
    LinearProgress, Skeleton, Alert, TextField, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Tooltip, Avatar, alpha, useTheme, FormControl,
    InputLabel, Select, Stack, Card, CardContent, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Collapse, Badge, Divider, useMediaQuery, Fade, TablePagination
} from '@mui/material';
import {
    Assessment as AssessmentIcon, Refresh as RefreshIcon,
    CalendarToday as CalendarTodayIcon, FilterList as FilterListIcon,
    FileDownload as FileDownloadIcon, Visibility as VisibilityIcon,
    CheckCircle as CheckCircleIcon, PendingActions as PendingIcon,
    Error as ErrorIcon, Group as GroupIcon, Close as CloseIcon,
    TrendingUp as TrendingUpIcon, ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon, Warning as WarningIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ============================================================================
// REDUX SELECTOR
// ============================================================================
const getReportDetails = createSelector(
    state => state?.dataService?.pages?.monthly_updates,
    state => state?.dataService,
    (monthlyUpdates, dataService) => ({
        loading: monthlyUpdates?.loading || {},
        reportData: monthlyUpdates?.data?.MonthlyReportData || [],
        employeeDetail: monthlyUpdates?.data?.EmployeeDetailsData || [],
        error: dataService?.error,
        message: dataService?.message
    })
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MonthlyUpdatesReport = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const reportDetails = useSelector(getReportDetails);
    const currentUser = useSelector(state => state?.auth?.user);
    const employeeId = currentUser?.id || sessionStorage.getItem('employee_id');
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [selectedName, setSelectedName] = useState('all');

    // ✅ PAGINATION STATE - Main Table
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // ✅ PAGINATION STATE - Detail Dialog
    const [detailPage, setDetailPage] = useState(0);
    const [detailRowsPerPage, setDetailRowsPerPage] = useState(5);

    const { loading, reportData, employeeDetail } = reportDetails;
    // ============================================================================
    // COMPUTED - Status Statistics
    // ============================================================================
    const statusStats = useMemo(() => {
        if (!reportData || reportData.length === 0) {
            return {
                total: 0,
                completed: 0,
                pending: 0,
                notStarted: 0
            };
        }

        const stats = {
            total: reportData.length,
            completed: 0,
            pending: 0,
            notStarted: 0
        };

        reportData.forEach(employee => {
            const status = employee.status;

            if (status === 'Submitted') {
                stats.completed++;
            } else if (status === 'In Progress') {
                stats.pending++;
            } else if (status === 'Not Started') {
                stats.notStarted++;
            }
        });

        return stats;
    }, [reportData]);

    // ============================================================================
    // COMPUTED - Department List
    // ============================================================================
    const departments = useMemo(() => {
        if (!reportData) return [];
        const depts = [...new Set(reportData.map(emp => emp.dept_name).filter(Boolean))];
        return depts.sort();
    }, [reportData]);

    const employeeNames = useMemo(() => {
        if (!reportData) return [];
        const names = [...new Set(reportData.map(emp => emp.emp_name).filter(Boolean))];
        return names.sort();
    }, [reportData]);

    // ============================================================================
    // FILTERED DATA
    // ============================================================================
    const filteredData = useMemo(() => {
        if (!reportData) return [];

        let filtered = reportData;

        // Filter by department
        if (selectedDepartment !== 'all') {
            filtered = filtered.filter(emp => emp.dept_name === selectedDepartment);
        }

        // ✅ Filter by name
        if (selectedName !== 'all') {
            filtered = filtered.filter(emp => emp.emp_name === selectedName);
        }

        return filtered;
    }, [reportData, selectedDepartment, selectedName]);

    // ✅ PAGINATED DATA - Main Table
    const paginatedData = useMemo(() => {
        // If rowsPerPage is "All", return everything from the start
        if (rowsPerPage === -1) {
            return filteredData;
        }
        // Otherwise, ensure it's a number and do the normal pagination
        const rows = Number(rowsPerPage);
        const startIndex = page * rows;
        const endIndex = startIndex + rows;
        
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, page, rowsPerPage]);

    // ✅ Extract numeric suffix from "GOAL-YYYY-NNN" for sorting
    const getGoalNumber = (id) => {
        const match = id?.match(/GOAL-\d{4}-(\d+)$/);
        return match ? parseInt(match[1], 10) : -Infinity;
    };

    // ✅ SORTED DATA - descending by goal number
    const sortedEmployeeDetail = useMemo(() => {
        return [...employeeDetail].sort(
            (a, b) => getGoalNumber(b.tg_goal_generated_id) - getGoalNumber(a.tg_goal_generated_id)
        );
    }, [employeeDetail]);

    // ✅ PAGINATED DATA - Detail Dialog
    const paginatedDetailData = useMemo(() => {
        const startIndex = detailPage * detailRowsPerPage;
        const endIndex = startIndex + detailRowsPerPage;
        return sortedEmployeeDetail.slice(startIndex, endIndex);
    }, [sortedEmployeeDetail, detailPage, detailRowsPerPage]);
    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        if (selectedMonth && selectedYear) {

            dispatch(setLoading('monthly_updates', 'monthlyReportLoad', true));
            dispatch(fetchByIdAction(
                'application/json',
                'monthly_updates',
                'MonthlyReportData',
                'monthlyReportLoad',
                `${selectedMonth}/${selectedYear}/${selectedDepartment}`
            ));
        }
    }, [dispatch, selectedMonth, selectedYear, selectedDepartment, refreshTrigger]);

    // ✅ RESET PAGE WHEN FILTERS CHANGE
    useEffect(() => {
        setPage(0);
    }, [selectedDepartment, selectedName]);

    // ✅ RESET DETAIL PAGE WHEN EMPLOYEE DETAIL LOADS
    useEffect(() => {
        if (employeeDetail.length > 0) {
            setDetailPage(0);
        }
    }, [employeeDetail]);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // ✅ PAGINATION HANDLERS - Main Table
    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    // ✅ PAGINATION HANDLERS - Detail Dialog
    const handleChangeDetailPage = useCallback((event, newPage) => {
        setDetailPage(newPage);
    }, []);

    const handleChangeDetailRowsPerPage = useCallback((event) => {
        setDetailRowsPerPage(parseInt(event.target.value, 10));
        setDetailPage(0);
    }, []);

    const handleViewDetails = useCallback((employee) => {
        setSelectedEmployee(employee);

        dispatch(setLoading('monthly_updates', 'employeeDetailsLoad', true));
        dispatch(fetchByIdAction(
            'application/json',
            'monthly_updates',
            'EmployeeDetailsData',
            'employeeDetailsLoad',
            `${employee.employee_id}/${selectedMonth}/${selectedYear}`
        ));

        setDetailDialogOpen(true);
    }, [dispatch, selectedMonth, selectedYear]);


    // const handleExportFullCSV = useCallback(async (singleEmployee = null) => {
    //     if (!filteredData || filteredData.length === 0) {
    //         Swal.fire({
    //             icon: 'warning',
    //             title: 'No Data',
    //             text: 'No data available to export',
    //             confirmButtonColor: theme.palette.warning.main
    //         });
    //         return;
    //     }
    //     try {
    //         let allGoalsData = [];
    //         if (singleEmployee) {
    //             allGoalsData = employeeDetail;
    //         } else {
    //             const baseUrl = import.meta.env.VITE_BASE_URL;
    //             for (const employee of filteredData) {
    //                 try {
    //                     const response = await axios.get(`${baseUrl}/monthly_updates/EmployeeDetailsData/fetch`, {
    //                         params: {
    //                             id: `${employee.employee_id}/${selectedMonth}/${selectedYear}`
    //                         }
    //                     });

    //                     if (response.data && response.data.success && response.data.result) {
    //                         const employeeGoals = response.data.result.map(goal => ({
    //                             ...goal,
    //                             employee_id: employee.employee_id,
    //                             emp_name: employee.emp_name
    //                         }));
    //                         allGoalsData.push(...employeeGoals);
    //                         console.log(`Fetched ${employeeGoals.length} goals for ${employee.emp_name}`);
    //                     }
    //                 } catch (err) {
    //                     console.warn(`Failed to fetch goals for employee ${employee.employee_id}:`, err);
    //                 }
    //             }
    //         }

    //         // Create XLSX Workbook
    //         const wb = XLSX.utils.book_new();

    //         // Create month name mapping
    //         const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    //         const monthName = monthNames[selectedMonth - 1];

    //         // ===== SHEET 1: Monthly Updates Report =====
    //         const titleData = [[`Monthly Updated Report - ${monthName} ${selectedYear}`]];

    //         const ws1Data = filteredData.map(emp => ({
    //             'Employee ID': emp.employee_id,
    //             'Name': emp.emp_name,
    //             'Position': emp.emp_pos,
    //             'Department': emp.dept_name,
    //             'Total Sub Goals': emp.total_goals,
    //             'Updated': emp.updated_goals,
    //             'Status': emp.status,
    //             'Avg Completion %': emp.avg_completion || 0,
    //             'Monthly Notes': emp.mu_monthly_notes || '',
    //             'Last Updated': emp.last_updated ? new Date(emp.last_updated).toLocaleDateString() : 'N/A'
    //         }));

    //         // Initialize the sheet using the Title Array
    //         const ws1 = XLSX.utils.aoa_to_sheet(titleData);

    //         // Define styles
    //         const bannerStyle = {
    //             fill: { patternType: 'solid', fgColor: { rgb: "4F81BD" } }, // Nice Steel Blue
    //             font: { name: 'Arial', sz: 14, bold: true, color: { rgb: "FFFFFF" } },
    //             alignment: { horizontal: "center", vertical: "center" }
    //         };

    //         const headerStyle = {
    //             font: { bold: true, name: 'Arial', sz: 11 },
    //             fill: { patternType: 'solid', fgColor: { rgb: "EAEAEA" } }, // Subtle grey header
    //             alignment: { vertical: "center" }
    //         };

    //         const alternateRowStyle = {
    //             fill: { patternType: 'solid', fgColor: { rgb: "F2F5F9" } } // Soft tint for alternating rows
    //         };

    //         // Apply style to the banner cell safely
    //         ws1['A1'] = ws1['A1'] || { t: 's', v: titleData[0][0] };
    //         ws1['A1'].s = bannerStyle;

    //         // Give the top banner row some extra height to look professional (e.g., 35px)
    //         ws1['!rows'] = [{ hpt: 35 }];

    //         // Append your JSON data starting at cell A3
    //         XLSX.utils.sheet_add_json(ws1, ws1Data, { origin: 'A3' });

    //         // Merge the title banner across your 10 columns (A1 to J1)
    //         ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

    //         // Style headers and data rows dynamically for Sheet 1
    //         const ws1Range = XLSX.utils.decode_range(ws1['!ref']);
    //         for (let R = ws1Range.s.r; R <= ws1Range.e.r; ++R) {
    //             // Style the header row (Row 3, index 2)
    //             if (R === 2) {
    //                 for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
    //                     const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    //                     if (ws1[cellRef]) ws1[cellRef].s = headerStyle;
    //                 }
    //             }
    //             // Alternate row coloring for data rows (Starting from Row 4, index 3 onwards)
    //             if (R > 2) {
    //                 // If it's an odd index (which means every alternate data row)
    //                 if (R % 2 !== 0) {
    //                     for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
    //                         const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    //                         if (ws1[cellRef]) ws1[cellRef].s = alternateRowStyle;
    //                     }
    //                 }
    //             }
    //         }

    //         // --- Auto-fit Column Widths Logic for Sheet 1 ---
    //         const ws1Cols = [];
    //         for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
    //             let maxLen = 10; // set a fallback minimum column width
    //             for (let R = 2; R <= ws1Range.e.r; ++R) { // Start checking from row index 2 (headers) down to ignore title banner length
    //                 const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    //                 if (ws1[cellRef] && ws1[cellRef].v) {
    //                     const cellLen = ws1[cellRef].v.toString().length;
    //                     if (cellLen > maxLen) maxLen = cellLen;
    //                 }
    //             }
    //             ws1Cols.push({ wch: maxLen + 4 }); // Adds 4 spaces padding to avoid truncation
    //         }
    //         ws1['!cols'] = ws1Cols;

    //         // Append Sheet 1
    //         XLSX.utils.book_append_sheet(wb, ws1, 'Monthly Summary');


    //         // ===== SHEET 2: Goals Detail Report =====
    //         if (allGoalsData.length > 0) {
    //             // 1. Create a dynamic title banner array for Sheet 2
    //             const titleData2 = [[`Detailed Goals Report - ${monthName} ${selectedYear}`]];

    //             const ws2Data = allGoalsData.map(goal => ({
    //                 'Employee ID': goal.employee_id || '',
    //                 'Employee Name': goal.emp_name || '',
    //                 'Goal ID': goal.tg_goal_generated_id || '',
    //                 'Category': goal.tc_category_name || '',
    //                 'Weightage %': goal.tg_goal_weightage || 0,
    //                 'Status': goal.mu_status || 'Not Updated',
    //                 'Completion %': goal.mu_completed_weightage || 0,
    //                 'Notes': goal.mu_monthly_notes || '-',
    //                 'Last Update': goal.mu_updated_at ? new Date(goal.mu_updated_at).toLocaleDateString() : 'N/A'
    //             }));

    //             // 2. Initialize the sheet using the Title Array (instead of starting directly with JSON)
    //             const ws2 = XLSX.utils.aoa_to_sheet(titleData2);

    //             // Apply style to the banner cell safely
    //             ws2['A1'] = ws2['A1'] || { t: 's', v: titleData2[0][0] };
    //             ws2['A1'].s = bannerStyle;

    //             // Give the top banner row some extra height (35px)
    //             ws2['!rows'] = [{ hpt: 35 }];

    //             // 3. Append your JSON data starting at cell A3
    //             XLSX.utils.sheet_add_json(ws2, ws2Data, { origin: 'A3' });

    //             // 4. Merge the title banner across your 9 columns (A1 to I1)
    //             ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

    //             const ws2Range = XLSX.utils.decode_range(ws2['!ref']);
                
    //             // 5. Apply Header and Alternating Styles for Sheet 2 (adjusted row index offsets)
    //             for (let R = ws2Range.s.r; R <= ws2Range.e.r; ++R) {
    //                 // Style the header row (Row 3, index 2)
    //                 if (R === 2) { 
    //                     for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
    //                         const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    //                         if (ws2[cellRef]) ws2[cellRef].s = headerStyle;
    //                     }
    //                 } 
    //                 // Alternate row coloring for data rows (Starting from Row 4, index 3 onwards)
    //                 else if (R > 2) { 
    //                     // If it's an odd index (which means every alternate data row)
    //                     if (R % 2 !== 0) { 
    //                         for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
    //                             const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    //                             if (ws2[cellRef]) ws2[cellRef].s = alternateRowStyle;
    //                         }
    //                     }
    //                 }
    //             }

    //             // 6. --- Auto-fit Column Widths Logic for Sheet 2 ---
    //             const ws2Cols = [];
    //             for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
    //                 let maxLen = 10; // set a fallback minimum column width
    //                 for (let R = 2; R <= ws2Range.e.r; ++R) { // Start checking from row index 2 (headers) down to ignore title banner length
    //                     const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
    //                     if (ws2[cellRef] && ws2[cellRef].v) {
    //                         const cellLen = ws2[cellRef].v.toString().length;
    //                         if (cellLen > maxLen) maxLen = cellLen;
    //                     }
    //                 }
    //                 ws2Cols.push({ wch: maxLen + 4 }); // Adds 4 spaces padding to avoid truncation
    //             }
    //             ws2['!cols'] = ws2Cols;

    //             XLSX.utils.book_append_sheet(wb, ws2, 'Detailed Goals');
    //         }

    //         // ===== GENERATE AND DOWNLOAD WORKBOOK =====
    //         const fileName = singleEmployee 
    //             ? `Monthly_Report_${singleEmployee.emp_name}_${monthName}_${selectedYear}.xlsx`
    //             : `Monthly_Updates_Report_${monthName}_${selectedYear}.xlsx`;

    //         XLSX.writeFile(wb, fileName);

    //         Swal.fire({
    //             icon: 'success',
    //             title: 'Exported!',
    //             text: `${paginatedData.length} reports exported successfully`,
    //             timer: 2000,
    //             showConfirmButton: false,
    //             toast: true,
    //             position: 'top-end'
    //         });

    //     } catch (error) {
    //         console.error('Error during Excel export:', error);
    //         Swal.fire({
    //             icon: 'error',
    //             title: 'Export Failed',
    //             text: 'An error occurred while generating the Excel report.',
    //             confirmButtonColor: theme.palette.error.main
    //         });
    //     }

    // }, [filteredData, employeeDetail, selectedMonth, selectedYear, theme]);

    const handleExportFullCSV = useCallback(async (singleEmployee = null) => {
        if (!filteredData || filteredData.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No data available to export',
                confirmButtonColor: theme.palette.warning.main
            });
            return;
        }
        try {
            let allGoalsData = [];
            if (singleEmployee) {
                allGoalsData = employeeDetail;
            } else {
                const baseUrl = import.meta.env.VITE_BASE_URL;
                for (const employee of filteredData) {
                    try {
                        const response = await axios.get(`${baseUrl}/monthly_updates/EmployeeDetailsData/fetch`, {
                            params: {
                                id: `${employee.employee_id}/${selectedMonth}/${selectedYear}`
                            }
                        });

                        if (response.data && response.data.success && response.data.result) {
                            const employeeGoals = response.data.result.map(goal => ({
                                ...goal,
                                employee_id: employee.employee_id,
                                emp_name: employee.emp_name
                            }));
                            allGoalsData.push(...employeeGoals);
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch goals for employee ${employee.employee_id}:`, err);
                    }
                }
            }

            // Create XLSX Workbook
            const wb = XLSX.utils.book_new();

            // Create month name mapping
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[selectedMonth - 1];

            // ===== SHEET 1: Monthly Updates Report =====
            const titleData = [[`Monthly Updated Report - ${monthName} ${selectedYear}`]];

            const ws1Data = filteredData.map(emp => ({
                'Employee ID': emp.employee_id,
                'Name': emp.emp_name,
                'Position': emp.emp_pos,
                'Department': emp.dept_name,
                'Total Sub Goals': emp.total_goals,
                'Updated': emp.updated_goals,
                'Status': emp.status,
                'Avg Completion %': emp.avg_completion || 0,
                'Monthly Notes': emp.mu_monthly_notes || '',
                'Last Updated': emp.last_updated ? new Date(emp.last_updated).toLocaleDateString() : 'N/A'
            }));

            // Initialize the sheet using the Title Array
            const ws1 = XLSX.utils.aoa_to_sheet(titleData);

            // Define styles
            const bannerStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "4F81BD" } }, // Nice Steel Blue
                font: { name: 'Arial', sz: 14, bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" }
            };

            // Standard Header (Columns 4+)
            const headerStyle = {
                font: { bold: true, name: 'Arial', sz: 11 },
                fill: { patternType: 'solid', fgColor: { rgb: "EAEAEA" } }, // Subtle grey
                alignment: { vertical: "center" }
            };

            // NEW: Light Neutral Header for the first 4 columns
            const firstFourHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } }, 
                fill: { patternType: 'solid', fgColor: { rgb: "2E3B1E" } }, // Dark Olive
                alignment: { vertical: "center" }
            };              
            // NEW: Light tint for the first 4 columns (Even data rows)
            const firstFourRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "F4F6F0" } } // Pale Sage Green Tint
            };

            // Column E (Index 4): Total Sub Goals (Green)
            const totalGoalsHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                fill: { patternType: 'solid', fgColor: { rgb: "276A3C" } }, // Dark Green
                alignment: { vertical: "center" }
            };
            const totalGoalsRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "E2EFDA" } } // Light Green
            };

            // Column F (Index 5): Updated (Red)
            const updatedHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                fill: { patternType: 'solid', fgColor: { rgb: "9C0006" } }, // Dark Red
                alignment: { vertical: "center" }
            };
            const updatedRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "FFC7CE" } } // Light Red
            };

            const statusHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                fill: { patternType: 'solid', fgColor: { rgb: "5C1D24" } }, // Deep Burgundy
                alignment: { vertical: "center" }
            };
            const statusRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "F9F1F2" } } // Soft Rose/Gray Tint
            };

            // Column H (Index 7): Avg Completion %
            const completionHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                fill: { patternType: 'solid', fgColor: { rgb: "5C1D24" } }, // Deep Burgundy
                alignment: { vertical: "center" }
            };
            const completionRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "F9F1F2" } } // Soft Rose/Gray Tint
            };

            // --- Monthly Notes Style ---
            const monthlyNotesHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                fill: { patternType: 'solid', fgColor: { rgb: "1B365D" } }, // Dark Navy Blue
                alignment: { vertical: "center", wrapText: true } // Wrap text is usually helpful for notes
            };
            const monthlyNotesRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "F0F4F8" } }, // Light Ice Blue
                alignment: { vertical: "top", wrapText: true }
            };

            // --- Last Updated Style ---
            const lastUpdatedHeaderStyle = {
                font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                fill: { patternType: 'solid', fgColor: { rgb: "1B365D" } }, // Dark Navy Blue
                alignment: { vertical: "center", horizontal: "center" }
            };
            const lastUpdatedRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "F0F4F8" } }, // Light Ice Blue
                alignment: { vertical: "center", horizontal: "center" } // Center-aligns dates nicely
            };

            // Standard alternating rows (Columns 4+)
            const alternateRowStyle = {
                fill: { patternType: 'solid', fgColor: { rgb: "F2F5F9" } },
                alignment: { vertical: "center", horizontal: "center" }
            };

            // Apply style to the banner cell safely
            ws1['A1'] = ws1['A1'] || { t: 's', v: titleData[0][0] };
            ws1['A1'].s = bannerStyle;

            // Set heights: Banner row (index 0) = 35px, Header row (index 1) = 25px
            ws1['!rows'] = [{ hpt: 35 }, { hpt: 25 }];

            // Append your JSON data starting at cell A2 (No empty space)
            XLSX.utils.sheet_add_json(ws1, ws1Data, { origin: 'A2' });

            // Merge the title banner across your 10 columns (A1 to J1)
            ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

            // Style headers and data rows dynamically for Sheet 1
            const ws1Range = XLSX.utils.decode_range(ws1['!ref']);
            for (let R = ws1Range.s.r; R <= ws1Range.e.r; ++R) {
                // Style the header row (Row 2, index 1)
                if (R === 1) {
                    for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
                        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                        if (ws1[cellRef]) {
                            if (C < 4) {
                                ws1[cellRef].s = firstFourHeaderStyle;
                            } else if (C === 4) {
                                ws1[cellRef].s = totalGoalsHeaderStyle; // Column E
                            } else if (C === 5) {
                                ws1[cellRef].s = updatedHeaderStyle;    // Column F
                            } else if (C === 6) {
                                ws1[cellRef].s = statusHeaderStyle;     // Column G
                            } else if (C === 7) {
                                ws1[cellRef].s = completionHeaderStyle; // Column H
                            } else if (C === 8) {
                                ws1[cellRef].s = monthlyNotesHeaderStyle; // Column I (Monthly Notes)
                            } else if (C === 9) {
                                ws1[cellRef].s = lastUpdatedHeaderStyle;  // Column J (Last Updated)
                            } else {
                                ws1[cellRef].s = headerStyle;           // Columns K onwards
                            }
                        }
                    }
                }
                
                // Alternate row coloring for data rows (Starting from Row 3, index 2 onwards)
                if (R > 1) {
                    if (R % 2 === 0) {
                        for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
                            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                            if (ws1[cellRef]) {
                                if (C < 4) {
                                    ws1[cellRef].s = firstFourRowStyle;
                                } else if (C === 4) {
                                    ws1[cellRef].s = totalGoalsRowStyle; // Column E
                                } else if (C === 5) {
                                    ws1[cellRef].s = updatedRowStyle;    // Column F
                                } else if (C === 6) {
                                    ws1[cellRef].s = statusRowStyle;     // Column G
                                } else if (C === 7) {
                                    ws1[cellRef].s = completionRowStyle; // Column H
                                } else if (C === 8) {
                                    ws1[cellRef].s = monthlyNotesRowStyle; // Column I (Monthly Notes)
                                } else if (C === 9) {
                                    ws1[cellRef].s = lastUpdatedRowStyle;  // Column J (Last Updated)
                                } else {
                                    ws1[cellRef].s = alternateRowStyle;  // Columns K onwards
                                }
                            }
                        } 
                    }
                }
            }

            // --- Auto-fit Column Widths Logic for Sheet 1 ---
            const ws1Cols = [];
            for (let C = ws1Range.s.c; C <= ws1Range.e.c; ++C) {
                let maxLen = 10; 
                for (let R = 1; R <= ws1Range.e.r; ++R) { 
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws1[cellRef] && ws1[cellRef].v) {
                        const cellLen = ws1[cellRef].v.toString().length;
                        if (cellLen > maxLen) maxLen = cellLen;
                    }
                }
                ws1Cols.push({ wch: maxLen + 4 }); 
            }
            ws1['!cols'] = ws1Cols;

            // Append Sheet 1
            XLSX.utils.book_append_sheet(wb, ws1, 'Monthly Summary');


            // ===== SHEET 2: Goals Detail Report =====
            if (allGoalsData.length > 0) {
                // 1. Create a dynamic title banner array for Sheet 2
                const titleData2 = [[`Detailed Goals Report - ${monthName} ${selectedYear}`]];

                const ws2Data = allGoalsData.map(goal => ({
                    'Employee ID': goal.employee_id || '',
                    'Employee Name': goal.emp_name || '',
                    'Goal ID': goal.tg_goal_generated_id || '',
                    'Category': goal.tc_category_name || '',
                    'Weightage %': goal.tg_goal_weightage || 0,
                    'Status': goal.mu_status || 'Not Updated',
                    'Completion %': goal.mu_completed_weightage || 0,
                    'Notes': goal.mu_monthly_notes || '-',
                    'Last Update': goal.mu_updated_at ? new Date(goal.mu_updated_at).toLocaleDateString() : 'N/A'
                }));

                // 2. Initialize the sheet using the Title Array
                const ws2 = XLSX.utils.aoa_to_sheet(titleData2);

                // Define Sheet 2 specific styles
                // Columns A-D (0-2): Employee Details (Dark Charcoal / Pale Cream Accent)
                const empDetailsHeaderStyle = {
                    font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { patternType: 'solid', fgColor: { rgb: "34495E" } }, // Dark Slate Blue/Gray
                    alignment: { vertical: "center" }
                };
                const empDetailsRowStyle = {
                    fill: { patternType: 'solid', fgColor: { rgb: "F2F4F4" } } // Off-white/Gray Tint
                };

                const goalIDHeaderStyle = {
                    font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { patternType: 'solid', fgColor: { rgb: "4A235A" } }, 
                    alignment: { vertical: "center" }
                };

                const goalIDRowStyle = {
                    fill: { patternType: 'solid', fgColor: { rgb: "F5EEF8" } } 
                };
                
                const goalStatusHeaderStyle = {
                    font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { patternType: 'solid', fgColor: { rgb: "2C3E50" } }, // Midnight Blue
                    alignment: { vertical: "center" }
                };
                const goalStatusRowStyle = {
                    fill: { patternType: 'solid', fgColor: { rgb: "EAECEE" } } 
                };

                // Column E (4): Weightage % (Teal Theme)
                const weightageHeaderStyle = {
                    font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { patternType: 'solid', fgColor: { rgb: "16A085" } }, // Deep Teal
                    alignment: { vertical: "center", horizontal: "right" }
                };
                const weightageRowStyle = {
                    fill: { patternType: 'solid', fgColor: { rgb: "E8F8F5" } } // Light Mint/Teal Tint
                };

                // Columns H-I (7-8): Notes & Last Update (Warm Slate)
                const notesHeaderStyle = {
                    font: { bold: true, name: 'Arial', sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { patternType: 'solid', fgColor: { rgb: "7F8C8D" } }, // Slate Gray
                    alignment: { vertical: "center", wrapText: true }
                };
                const notesRowStyle = {
                    fill: { patternType: 'solid', fgColor: { rgb: "F8F9F9" } },
                    alignment: { vertical: "top", wrapText: true }
                };

                // Apply style to the banner cell safely (Row 1, index 0)
                ws2['A1'] = ws2['A1'] || { t: 's', v: titleData2[0][0] };
                ws2['A1'].s = bannerStyle;

                // Set heights: Banner row (index 0) = 35px, Header row (index 1) = 25px
                ws2['!rows'] = [{ hpt: 35 }, { hpt: 25 }];

                // 3. Append your JSON data starting at cell A2
                XLSX.utils.sheet_add_json(ws2, ws2Data, { origin: 'A2' });

                // 4. Merge the title banner across your 9 columns (A1 to I1)
                ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

                const ws2Range = XLSX.utils.decode_range(ws2['!ref']);
                // 5. Apply Column-Specific Header and Alternate Row Styles dynamically for Sheet 2
                for (let R = ws2Range.s.r; R <= ws2Range.e.r; ++R) {
                    
                    // --- Custom Colors for Header Row (Row 2, index 1) ---
                    if (R === 1) { 
                        for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
                            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                            if (ws2[cellRef]) {
                                if (C < 2) {
                                    ws2[cellRef].s = empDetailsHeaderStyle;
                                } else if (C === 2) {
                                    ws2[cellRef].s = goalIDHeaderStyle;
                                } else if (C === 3) {
                                    ws2[cellRef].s = goalStatusHeaderStyle;
                                } else if (C <= 6) {
                                    ws2[cellRef].s = weightageHeaderStyle;
                                } else {
                                    ws2[cellRef].s = notesHeaderStyle;
                                }
                            }
                        }
                    } 
                    
                    // --- Column-Specific Coloring for Even Data Rows (Row 3, index 2 onwards) ---
                    else if (R > 1) { 
                        if (R % 2 === 0) { // Striping applied to even indexes
                            for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
                                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                                if (ws2[cellRef]) {
                                    if (C < 2) {
                                        ws2[cellRef].s = empDetailsRowStyle;
                                    } else if (C === 2) {
                                        ws2[cellRef].s = goalIDRowStyle;
                                    } else if (C === 3) {
                                        ws2[cellRef].s = goalStatusRowStyle;
                                    } else if (C <= 6) {
                                        ws2[cellRef].s = weightageRowStyle;
                                    } else {
                                        ws2[cellRef].s = notesRowStyle;
                                    }
                                }
                            }
                        } else {
                            // Optional: Make sure odd rows have wrapping enabled for text consistency
                            for (let C = ws2Range.s.c; C <= ws2Range.e.c; ++C) {
                                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                                if (ws2[cellRef] && (C === 7 || C === 8)) {
                                    ws2[cellRef].s = { alignment: { vertical: "top", wrapText: true } };
                                }
                            }
                        }
                    }
                }

                // 6. --- Auto-fit Column Widths Logic for Sheet 2 ---
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
                    ws2Cols.push({ wch: maxLen + 4 }); 
                }
                ws2['!cols'] = ws2Cols;

                XLSX.utils.book_append_sheet(wb, ws2, 'Detailed Goals');
            }
            // ===== GENERATE AND DOWNLOAD WORKBOOK =====
            const fileName = singleEmployee 
                ? `Monthly_Report_${singleEmployee.emp_name}_${monthName}_${selectedYear}.xlsx`
                : `Monthly_Updates_Report_${monthName}_${selectedYear}.xlsx`;

            XLSX.writeFile(wb, fileName);

            Swal.fire({
                icon: 'success',
                title: 'Exported!',
                text: `${filteredData.length} reports exported successfully`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

        } catch (error) {
            console.error('Error during Excel export:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'An error occurred while generating the Excel report.',
                confirmButtonColor: theme.palette.error.main
            });
        }

    }, [filteredData, employeeDetail, selectedMonth, selectedYear, theme]);

    const handleExportCSV = useCallback(() => {
        if (!filteredData || filteredData.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No data available to export',
                confirmButtonColor: theme.palette.warning.main
            });
            return;
        }
 
        const csvContent = [
            ['Employee ID', 'Name', 'Position', 'Department', 'Total Sub Goals', 'Updated', 'Status', 'Avg Completion %', 'Monthly Notes', 'Last Updated'],
            ...filteredData.map(emp => [
                emp.employee_id,
                emp.emp_name,
                emp.emp_pos,
                emp.dept_name,
                emp.total_goals,
                emp.updated_goals,
                emp.status,
                emp.avg_completion || 0,
                emp.mu_monthly_notes || '',
                emp.last_updated ? new Date(emp.last_updated).toLocaleDateString() : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');
 
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monthly-report-${selectedMonth}-${selectedYear}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
 
        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: `${filteredData.length} records exported successfully`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }, [filteredData, selectedMonth, selectedYear, theme]);
    
    const toggleRowExpand = useCallback((employeeId) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId);
            } else {
                newSet.add(employeeId);
            }
            return newSet;
        });
    }, []);

    // ============================================================================
    // HELPERS
    // ============================================================================
    const getStatusColor = (status) => {
        switch (status) {
            case 'Submitted': return 'success';
            case 'In Progress': return 'warning';
            case 'Not Started': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Submitted': return <CheckCircleIcon />;
            case 'In Progress': return <PendingIcon />;
            case 'Not Started': return <ErrorIcon />;
            default: return null;
        }
    };

    const getCompletionRate = (employee) => {
        if (employee.total_goals === 0) return 0;
        return ((employee.updated_goals / employee.total_goals) * 100).toFixed(1);
    };

    // ============================================================================
    // LOADING STATE
    // ============================================================================
    if (loading.monthlyReportLoad && reportData.length === 0) {
        return (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Container>
        );
    }

    // ============================================================================
    // MAIN RENDER
    // ============================================================================
    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
            {/* HEADER */}
            <Paper elevation={3} sx={{
                p: 3, mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'white',
                borderRadius: 2
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                            <AssessmentIcon sx={{ fontSize: 36 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="700" sx={{ color: '#fff !important' }}>
                                Monthly Updates Report
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, color: '#fff !important' }}>
                                Track employee submission status and progress
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Export Full Report to Excel">
                            <IconButton onClick={() => handleExportFullCSV()} sx={{ color: 'white' }}>
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
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
                </Box>
            </Paper>

            {/* ✅ STATUS STATISTICS DASHBOARD */}
            <Box sx={{
                mb: 3,
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)'
                }
            }}>
                <Card elevation={2} sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
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
                                    Total Goal Owners
                                </Typography>
                                <Typography variant="h4" fontWeight="700" color="primary.main">
                                    {statusStats.total}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                                <GroupIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card elevation={2} sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderLeft: `4px solid ${theme.palette.success.main}`,
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
                                    Completed (Submitted)
                                </Typography>
                                <Typography variant="h4" fontWeight="700" color="success.main">
                                    {statusStats.completed}
                                </Typography>
                                {statusStats.total > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                        {((statusStats.completed / statusStats.total) * 100).toFixed(1)}%
                                    </Typography>
                                )}
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 56, height: 56 }}>
                                <CheckCircleIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card elevation={2} sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    borderLeft: `4px solid ${theme.palette.warning.main}`,
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
                                    Pending (In Progress)
                                </Typography>
                                <Typography variant="h4" fontWeight="700" color="warning.main">
                                    {statusStats.pending}
                                </Typography>
                                {statusStats.total > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                        {((statusStats.pending / statusStats.total) * 100).toFixed(1)}%
                                    </Typography>
                                )}
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 56, height: 56 }}>
                                <PendingIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card elevation={2} sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    borderLeft: `4px solid ${theme.palette.error.main}`,
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
                                    Not Started
                                </Typography>
                                <Typography variant="h4" fontWeight="700" color="error.main">
                                    {statusStats.notStarted}
                                </Typography>
                                {statusStats.total > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                        {((statusStats.notStarted / statusStats.total) * 100).toFixed(1)}%
                                    </Typography>
                                )}
                            </Box>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 56, height: 56 }}>
                                <ErrorIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* FILTERS */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                label="Month"
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                    },
                                }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <MenuItem key={month} value={month}>
                                        {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                label="Year"
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                    },
                                }}
                            >
                                {[2024, 2025, 2026, 2027].map(year => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Employee Name</InputLabel>
                            <Select
                                value={selectedName}
                                onChange={(e) => setSelectedName(e.target.value)}
                                label="Employee Name"
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="all">
                                    <em>All Employees ({employeeNames.length})</em>
                                </MenuItem>
                                {employeeNames.map(name => (
                                    <MenuItem key={name} value={name}>
                                        👤 {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                label="Department"
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            maxHeight: 48 * 5,
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="all">
                                    <em>All Departments ({departments.length})</em>
                                </MenuItem>
                                {departments.map(dept => (
                                    <MenuItem key={dept} value={dept}>
                                        {dept}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* OVERALL PROGRESS BAR */}
            {statusStats.total > 0 && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6" fontWeight="600">
                            Overall Submission Progress
                        </Typography>
                        <Chip
                            label={`${((statusStats.completed / statusStats.total) * 100).toFixed(1)}% Complete`}
                            color="primary"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(statusStats.completed / statusStats.total) * 100}
                        sx={{
                            height: 12,
                            borderRadius: 6,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 6,
                                background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`
                            }
                        }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                            {statusStats.completed} of {statusStats.total} employees submitted
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {statusStats.notStarted} not started, {statusStats.pending} in progress
                        </Typography>
                    </Box>
                </Paper>
            )}

            {/* ✅ REPORT TABLE WITH PAGINATION */}
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main' }}>EMPLOYEE ID</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main' }}>NAME</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main' }}>POSITION</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main' }}>DEPARTMENT</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>Total Sub Goals</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>UPDATED</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>AVG COMPLETION</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>Monthly Notes</TableCell>
                                <TableCell sx={{ fontWeight: '700', color: 'primary.main', textAlign: 'center' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((employee) => (
                                    <TableRow key={employee.employee_id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="600">
                                                {employee.employee_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                    {employee.emp_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {employee.emp_name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {employee.emp_pos}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.dept_name}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" fontWeight="600">
                                                {employee.total_goals}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" fontWeight="600" color={
                                                employee.updated_goals === employee.total_goals ? 'success.main' : 'warning.main'
                                            }>
                                                {employee.updated_goals}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Chip
                                                icon={getStatusIcon(employee.status)}
                                                label={employee.status}
                                                size="small"
                                                color={getStatusColor(employee.status)}
                                                sx={{ fontWeight: '600' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="600" color="primary">
                                                    {employee.avg_completion || 0}%
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={employee.avg_completion || 0}
                                                    sx={{
                                                        mt: 0.5,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        width: 80,
                                                        mx: 'auto',
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        {/* <TableCell sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" fontWeight="600">
                                                {employee.mu_monthly_notes || '-'}
                                            </Typography>
                                        </TableCell> */}
                                        <TableCell 
                                            sx={{ 
                                                textAlign: 'center',
                                                width: '200px',
                                                maxWidth: '200px',
                                                minWidth: '200px',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    maxHeight: '80px', // adjust height as needed
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                    whiteSpace: 'normal',
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
                                                <Typography variant="body2" fontWeight="600">
                                                    {employee.mu_monthly_notes || '-'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleViewDetails(employee)}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8 }}>
                                        <WarningIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
                                        <Typography variant="h6" fontWeight="600" color="text.secondary">
                                            No Data Available
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            No employees found for the selected period
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ✅ PAGINATION CONTROLS - Main Table */}
                <TablePagination
                    rowsPerPageOptions={[{ value: -1, label: 'All' }, 5, 10, 25, 50, 100]}
                    component="div"
                    count={filteredData.length}
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

            {/* ✅ EMPLOYEE DETAIL DIALOG WITH PAGINATION */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight="700" sx={{ color: '#fff !important' }}>
                            Employee Goal Details
                        </Typography>
                        {selectedEmployee && (
                            <Typography variant="caption" sx={{ color: '#fff !important' }}>
                                {selectedEmployee.emp_name} ({selectedEmployee.employee_id})
                            </Typography>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Export Employee Goal Details to Excel">
                            <IconButton
                                onClick={() => handleExportCSV(selectedEmployee)}
                                sx={{ color: 'white' }}
                            >
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton onClick={() => setDetailDialogOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 3, pb: 0 }}>
                    {loading.employeeDetailsLoad ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Skeleton variant="rectangular" height={200} />
                        </Box>
                    ) : employeeDetail.length > 0 ? (
                        <>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                            <TableCell sx={{ fontWeight: '700' }}>GOAL ID</TableCell>
                                            <TableCell sx={{ fontWeight: '700' }}>CATEGORY</TableCell>
                                            <TableCell sx={{ fontWeight: '700' }}>WEIGHTAGE</TableCell>
                                            <TableCell sx={{ fontWeight: '700' }}>STATUS</TableCell>
                                            <TableCell sx={{ fontWeight: '700' }}>COMPLETION</TableCell>
                                            <TableCell sx={{ fontWeight: '700' }}>Notes</TableCell>
                                            <TableCell sx={{ fontWeight: '700' }}>LAST UPDATE</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedDetailData.map(goal => (
                                            <TableRow key={goal.tg_pid} hover>
                                                <TableCell>
                                                    {goal.tg_goal_generated_id?.match(/GOAL-\d{4}-\d+$/)?.[0] || 'N/A'}
                                                    {/* {goal.tg_goal_generated_id} */}
                                                    </TableCell>
                                                <TableCell>
                                                    <Chip label={goal.tc_category_name} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell>{goal.tg_goal_weightage}%</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={goal.mu_status || 'Not Updated'}
                                                        size="small"
                                                        color={getStatusColor(goal.mu_status)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={goal.mu_completed_weightage || 0}
                                                            sx={{ width: 80, height: 6, borderRadius: 3 }}
                                                        />
                                                        <Typography variant="caption">
                                                            {goal.mu_completed_weightage || 0}%
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">
                                                        {goal.mu_monthly_notes || "-"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">
                                                        {goal.mu_updated_at
                                                            ? new Date(goal.mu_updated_at).toLocaleDateString()
                                                            : 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* ✅ PAGINATION CONTROLS - Detail Dialog */}
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={employeeDetail.length}
                                rowsPerPage={detailRowsPerPage}
                                page={detailPage}
                                onPageChange={handleChangeDetailPage}
                                onRowsPerPageChange={handleChangeDetailRowsPerPage}
                                sx={{
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    '.MuiTablePagination-toolbar': {
                                        minHeight: 56
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <Alert severity="info">
                            No goal details available for this employee
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MonthlyUpdatesReport;
