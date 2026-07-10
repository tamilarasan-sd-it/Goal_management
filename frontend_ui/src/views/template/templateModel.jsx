import { useState, useEffect } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import {
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, addAction, updateAction, deleteAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';

// Redux Selectors
export const getPageData = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const templatesPage = pages?.templates || {};
        const employeesPage = pages?.employees || {};
        const templateCategoriesPage = pages?.templateCategories || {};
        const categoryPage = pages?.category || {};
        const columnsPage = pages?.columns || {};

        const templatesRawData = templatesPage?.data?.TemplatesData;
        const templatesData = Array.isArray(templatesRawData)
            ? templatesRawData
            : templatesRawData ? [templatesRawData] : [];

        const positionsData = employeesPage?.data?.PositionsData || [];
        const employeesByPositionData = pages?.employees?.data?.EmployeesByPositionData || [];

        const categoriesRawData = categoryPage?.data?.CategoryData;
        const categoriesData = Array.isArray(categoriesRawData)
            ? categoriesRawData
            : categoriesRawData ? [categoriesRawData] : [];

        const columnsRawData = columnsPage?.data?.ColumnsData;
        const columnsData = Array.isArray(columnsRawData)
            ? columnsRawData
            : columnsRawData ? [columnsRawData] : [];

        return {
            templatesLoading: templatesPage?.loading?.TemplatesLoad || false,
            categoriesLoading: templateCategoriesPage?.loading?.CategoriesLoad || false,
            columnsLoading: columnsPage?.loading?.ColumnsLoad || false,
            templatesData,
            categories: Array.isArray(categoriesData) ? categoriesData : [],
            columns: Array.isArray(columnsData) ? columnsData : [],
            positions: Array.isArray(positionsData) ? positionsData : [],
            employeesByPosition: Array.isArray(employeesByPositionData) ? employeesByPositionData : [],
        };
    }
);

export const getAuthData = createSelector(
    state => state.auth, // Assuming 'auth' slice holds user info
    (auth) => ({
        loggedInUser: auth?.user || null
    })
);

export const useTemplateManagement = () => {
    const dispatch = useDispatch();

    // Local state
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        template_name: '',
        year: '',
        assigned_position: '',
        assigned_employee: '',
        selected_categories: [],
        selected_columns: []
    });
    const [editFormData, setEditFormData] = useState({
        template_name: '',
    });
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Redux data
    const {
        templatesData,
        categories,
        columns,
        positions,
        employeesByPosition
    } = useSelector(getPageData);
    const { loggedInUser } = useSelector(getAuthData);

    // Filter templates for display (Active and Draft)
    const displayTemplates = templatesData.filter(col => col.template_is_delete === 'Active' || col.template_is_delete === 'Draft');

    // DND sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Effects
    useEffect(() => {
        // When the dialog opens (and not in edit mode), initialize the columns for ordering
        if (openDialog && !selectedTemplate && columns.length > 0) {
            const activeColumns = columns.filter(c => c.column_is_delete === 'Active').sort((a, b) => a.column_order - b.column_order);
            setFormData(prev => ({ ...prev, selected_columns: activeColumns.map(c => ({
                ...c,
                is_active_in_template: c.column_type === 'Default'
            })) }));
        }
    }, [columns, openDialog, selectedTemplate]);

    useEffect(() => {
        // Fetch initial data
        dispatch(setLoading("templates", "TemplatesLoad", true));
        dispatch(fetchAction('application/json', "templates", "TemplatesData", "TemplatesLoad"));
        dispatch(setLoading("employees", "PositionsLoad", true));
        // dispatch(fetchAction('application/json', "employees", "PositionsData", "PositionsLoad"));
        dispatch(setLoading("category", "categoryLoad", true));
        dispatch(fetchAction('application/json', "category", "CategoryData", "categoryLoad"));
        dispatch(setLoading("columns", "ColumnsLoad", true));
        dispatch(fetchAction('application/json', "columns", "ColumnsData", "ColumnsLoad"));
    }, [dispatch]);

    // Handlers
    const handleMenuOpen = (event, template) => {
        setAnchorEl(event.currentTarget);
        setSelectedTemplate(template);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTemplate(null);
    };

    const handleOpenAddDialog = () => {
        setActiveStep(0);
        setOpenDialog(true);
        setFormData({
            template_name: '',
            year: new Date().getFullYear() + 1,
            assigned_position: '',
            assigned_employee: '',
            selected_categories: [],
            selected_columns: []
        });
        setErrors({});
    };

    const handleOpenEditDialog = (template) => {
        setSelectedTemplate(template);
        setOpenDialog(true);
        setEditFormData({
            template_name: template.template_name,
        });
        setErrors({});
    };

    const handleCloseDialog = () => {
        setActiveStep(0);
        setOpenDialog(false);
        setSelectedTemplate(null);
        setEditFormData({
            template_name: '',
        });
        setErrors({});
    };

    const handleOpenDeleteDialog = (template) => {
        setSelectedTemplate(template);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const targetData = selectedTemplate ? editFormData : formData;
        const setData = selectedTemplate ? setEditFormData : setFormData;
        setData({
            ...targetData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const handleCategorySelection = (categoryPid) => {
        setFormData(prev => {
            const isSelected = prev.selected_categories.some(c => c.category_pid === categoryPid);
            if (isSelected) {
                return {
                    ...prev,
                    selected_categories: prev.selected_categories.filter(c => c.category_pid !== categoryPid)
                };
            } else {
                return {
                    ...prev,
                    selected_categories: [...prev.selected_categories, {
                        category_pid: categoryPid,
                        weightage: '',
                        tc_kpi_metric: '',
                        tc_target: '',
                        tc_category_description: ''
                    }]
                };
            }
        });
    };

    const handleWeightageChange = (categoryPid, value) => {
        const numValue = Math.max(0, Math.min(100, Number(value)));

        setFormData(prev => {
            const isSelected = prev.selected_categories.some(c => c.category_pid === categoryPid);
            let newSelectedCategories;

            if (isSelected) {
                newSelectedCategories = prev.selected_categories.map(c =>
                    c.category_pid === categoryPid ? { ...c, weightage: numValue || '' } : c
                );
            } else {
                newSelectedCategories = [...prev.selected_categories, {
                    category_pid: categoryPid,
                    weightage: numValue || '',
                    tc_kpi_metric: '',
                    tc_target: '',
                    tc_category_description: ''
                }];
            }
            return { ...prev, selected_categories: newSelectedCategories };
        });
    };

    const handleCategoryInputChange = (categoryPid, fieldName, value) => {
        setFormData(prev => {
            const newSelectedCategories = prev.selected_categories.map(c =>
                c.category_pid === categoryPid ? { ...c, [fieldName]: value } : c
            );
            if (!newSelectedCategories.some(c => c.category_pid === categoryPid)) {
                newSelectedCategories.push({ category_pid: categoryPid, [fieldName]: value });
            }
            return { ...prev, selected_categories: newSelectedCategories };
        });
    };

    const handleSelectAllCategories = (event) => {
        setFormData(prev => {
            if (event.target.checked) {
                const allSelected = categories.map(c => ({
                    category_pid: c.category_pid,
                    weightage: '',
                    tc_kpi_metric: '',
                    tc_target: '',
                    tc_category_description: ''
                }));
                return { ...prev, selected_categories: allSelected };
            }
            return { ...prev, selected_categories: [] };
        });
    };

    const handleAutocompleteChange = (name, value) => {
        const targetData = selectedTemplate ? editFormData : formData;
        const setData = selectedTemplate ? setEditFormData : setFormData;
        setData({
            ...targetData,
            [name]: value || '',
            ...(name === 'assigned_position' && { assigned_employee: '' }),
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }

        if (name === 'assigned_position' && value) {
            dispatch(setLoading("employees", "EmployeesByPositionLoad", true));
            dispatch(fetchByIdAction('application/json', "employees", "EmployeesByPositionData", "EmployeesByPositionLoad", value));
        }
    };

    const handleDragEnd = (event) => {
        const { active, over, context } = event;

        if (over && active.id !== over.id) {
            if (context === 'columns') {
                setFormData((prev) => {
                    const oldIndex = prev.selected_columns.findIndex(c => c.column_pid === active.id);
                    const newIndex = prev.selected_columns.findIndex(c => c.column_pid === over.id);
                    return {
                        ...prev,
                        selected_columns: arrayMove(prev.selected_columns, oldIndex, newIndex)
                    };
                });
            }
        }
    };

    const handleColumnToggle = (columnPid, isEnabled) => {
        setFormData(prev => ({
            ...prev,
            selected_columns: prev.selected_columns.map(c =>
                c.column_pid === columnPid ? { ...c, is_active_in_template: isEnabled } : c
            )
        }));
    };

    const validateForm = (isSubmit = false) => {
        const newErrors = {};
        const data = selectedTemplate ? editFormData : formData;

        if (!data.template_name.trim()) {
            newErrors.template_name = 'Template name is required';
        } else if (data.template_name.length > 255) {
            newErrors.template_name = 'Template name cannot exceed 255 characters';
        }

        // Check for duplicate template name (excluding current template being edited)
        const templatesToCheck = selectedTemplate
            ? templatesData.filter(t => t.template_pid !== selectedTemplate.template_pid)
            : templatesData;

        if (templatesToCheck.some(t => t.template_name.toLowerCase() === data.template_name.trim().toLowerCase())) {
            newErrors.template_name = 'Template name already exists';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm(true)) {
            setIsLoading(true);

            if (selectedTemplate) {
                const updatedTemplate = {
                    ...selectedTemplate,
                    template_name: editFormData.template_name.trim(),
                    template_modified_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                dispatch(setLoading("templates", "TemplatesLoad", true));
                dispatch(updateAction('application/json', "templates", "TemplatesData", "TemplatesLoad", 'updateTemplate', updatedTemplate));

                setSnackbar({
                    open: true,
                    message: 'Template updated successfully!',
                    severity: 'success'
                });
            } else {
                const newTemplateOrder = templatesData.length > 0
                    ? Math.max(...templatesData.map(col => col.template_order)) + 1
                    : 1;
                const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const newTemplate = {
                    template_name: formData.template_name.trim(),
                    year: formData.year,
                    assigned_position: formData.assigned_position,
                    assigned_employee: formData.assigned_employee,
                    template_created_by: loggedInUser?.employee_id,
                    categories: formData.selected_categories.map((cat, index) => ({
                        ...cat,
                        tc_order: index + 1
                    })),
                    columns: formData.selected_columns.map((col, index) => ({
                        column_pid: col.column_pid,
                        column_order: index + 1
                    })),
                    template_order: newTemplateOrder,
                    template_created_date: currentTimestamp,
                    template_modified_at: currentTimestamp,
                    template_is_delete: 'Active' // Default to Active for new templates
                };

                dispatch(setLoading("templates", "TemplatesLoad", true));
                dispatch(addAction('application/json', "templates", "TemplatesData", "TemplatesLoad", newTemplate));

                setSnackbar({
                    open: true,
                    message: 'Template added successfully!',
                    severity: 'success'
                });
            }

            setIsLoading(false);
            handleCloseDialog();
        }
    };

    const handleDelete = () => {
        setIsLoading(true);

        const templateToDelete = {
            ...selectedTemplate,
            template_is_delete: 'In Active', // Soft delete
        };
        dispatch(setLoading("templates", "TemplatesLoad", true));
        dispatch(deleteAction('application/json', "templates", "TemplatesData", "TemplatesLoad", templateToDelete));

        setSnackbar({
            open: true,
            message: 'Template deleted successfully!',
            severity: 'warning'
        });

        setIsLoading(false);
        handleCloseDeleteDialog();
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleNext = () => {
        if (activeStep === 1) {
            const totalWeightage = formData.selected_categories.reduce((sum, cat) => sum + (Number(cat.weightage) || 0), 0);
            if (formData.selected_categories.length > 0 && totalWeightage !== 100) {
                setSnackbar({
                    open: true,
                    message: `Total weightage must be 100%. Current total is ${totalWeightage}%.`,
                    severity: 'error'
                });
                return;
            }

            const hasEmptyWeightage = formData.selected_categories.some(cat => !cat.weightage);
            if (hasEmptyWeightage) {
                setSnackbar({
                    open: true,
                    message: 'Please provide a weightage for all selected categories.',
                    severity: 'error'
                });
                return;
            }
        }

        if (validateForm(false)) { // Validate without checking for duplicates on every step
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else {
            setSnackbar({
                open: true,
                message: 'Please correct the errors in the form.',
                severity: 'error'
            });
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return {
        // State
        openDialog,
        deleteDialogOpen,
        isLoading,
        activeStep,
        anchorEl,
        selectedTemplate,
        formData,
        editFormData,
        errors,
        snackbar,
        // Data from Redux
        templatesData, // Keep for total count if needed elsewhere
        displayTemplates,
        categories,
        columns,
        positions,
        employeesByPosition,
        loggedInUser,
        // Handlers
        handleMenuOpen,
        handleMenuClose,
        handleOpenAddDialog,
        handleOpenEditDialog,
        handleCloseDialog,
        handleOpenDeleteDialog,
        handleCloseDeleteDialog,
        handleInputChange,
        handleCategorySelection,
        handleWeightageChange,
        handleCategoryInputChange,
        handleSelectAllCategories,
        handleAutocompleteChange,
        handleDragEnd,
        handleColumnToggle,
        handleSubmit,
        handleDelete,
        handleSnackbarClose,
        handleNext,
        handleBack,
        // DND
        sensors,
    };
};