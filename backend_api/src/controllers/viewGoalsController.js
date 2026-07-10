// src/controllers/viewGoalsController.js
// UPDATED to handle filters from query string (GET request with params)

import connectionPool from "../database/dbConfig.js";
import { ViewGoals } from '../models/viewGoalsModel.js';
import { MonthlyUpdates } from '../models/monthlyUpdatesModel.js';

const getConnection = () =>
    new Promise((resolve, reject) => {
        connectionPool.getConnection((err, conn) => {
            if (err) return reject({ error: err, success: false });
            resolve(conn);
        });
    });

// ============================================================================
// GET GOALS LIST - Handles BOTH initial load AND filtered requests
// GET /api/v1/view_goals/GoalsListData/fetch?id=<employeeId>
// OR
// GET /api/v1/view_goals/GoalsListData/fetch?id=userId=1981&status=Completed&...
// ============================================================================
export const getGoalsByRole = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        // Check if id is a simple employeeId or a query string with filters
        const idParam = req.query.id;
        
        if (!idParam) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'GoalsListData',
                loading: loading || 'goalsListLoad',
                message: 'Employee ID is required'
            });
        }

        let employeeId;
        let filters = {};

        // Check if idParam contains filters (has '=' sign)
        if (idParam.includes('=')) {
            // Parse query string from id parameter
            const params = new URLSearchParams(idParam);
            employeeId = params.get('userId');
            
            // Extract all filters
            filters = {
                goalOwner: params.get('goalOwner') || '',
                department: params.get('department') || '',
                templateId: params.get('templateId') || '',
                year: params.get('year') || new Date().getFullYear(),
                categoryId: params.get('categoryId') || '',
                status: params.get('status') || '',
                priority: params.get('priority') || '',
                timeline: params.get('timeline') || '',
                searchKeyword: params.get('searchKeyword') || ''
            };
            
            console.log('📋 Filters extracted from query string:', filters);
        } else {
            // Simple employeeId - no filters
            employeeId = idParam;
            filters = {
                year: new Date().getFullYear() // Only default year
            };
            console.log('👤 No filters - initial load for:', employeeId);
        }

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'GoalsListData',
                loading: loading || 'goalsListLoad',
                message: 'Employee ID is required'
            });
        }

        const userRole = String(employeeId) === '12345' ? 'Super Admin' : 'Goal Owner';

        connection = await getConnection();
        const result = await ViewGoals.getGoalsByRole(connection, userRole, employeeId, filters);

        res.status(200).json({
            success: true,
            page: page || 'view_goals',
            component: component || 'GoalsListData',
            loading: loading || 'goalsListLoad',
            result: result.result
        });

    } catch (error) {
        console.error('❌ getGoalsByRole error:', error);
        res.status(500).json({
            success: false,
            page: page || 'view_goals',
            component: component || 'GoalsListData',
            loading: loading || 'goalsListLoad',
            message: error.message || 'Failed to fetch goals'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// POST GOALS LIST - Can be removed if you're not using it anymore
// (Keeping it for backward compatibility)
// ============================================================================
export const postGoalsByRole = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const employeeId = req.body.userId;
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'GoalsListData',
                loading: loading || 'goalsListLoad',
                message: 'Employee ID is required in request body'
            });
        }

        const userRole = String(employeeId) === '12345' ? 'Super Admin' : 'Goal Owner';

        const filters = {
            goalOwner: req.body.goalOwner || '',
            department: req.body.department || '',
            templateId: req.body.templateId || '',
            year: req.body.year || new Date().getFullYear(),
            categoryId: req.body.categoryId || '',
            status: req.body.status || '',
            priority: req.body.priority || '',
            timeline: req.body.timeline || '',
            assignmentStatus: req.body.assignmentStatus || '',
            searchKeyword: req.body.searchKeyword || ''
        };

        connection = await getConnection();
        const result = await ViewGoals.getGoalsByRole(connection, userRole, employeeId, filters);

        res.status(200).json({
            success: true,
            page: page || 'view_goals',
            component: component || 'GoalsListData',
            loading: loading || 'goalsListLoad',
            result: result.result
        });

    } catch (error) {
        console.error('❌ postGoalsByRole error:', error);
        res.status(500).json({
            success: false,
            page: page || 'view_goals',
            component: component || 'GoalsListData',
            loading: loading || 'goalsListLoad',
            message: error.message || 'Failed to fetch goals'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// GET FILTER OPTIONS
// ============================================================================
export const getFilterOptions = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const employeeId = req.query.id;
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'FilterOptionsData',
                loading: loading || 'filterOptionsLoad',
                message: 'Employee ID is required'
            });
        }

        const userRole = String(employeeId) === '12345' ? 'Super Admin' : 'Goal Owner';

        connection = await getConnection();
        const result = await ViewGoals.getFilterOptions(connection, userRole, employeeId);

        res.status(200).json({
            success: true,
            page: page || 'view_goals',
            component: component || 'FilterOptionsData',
            loading: loading || 'filterOptionsLoad',
            result: result.result
        });

    } catch (error) {
        console.error('❌ getFilterOptions error:', error);
        res.status(500).json({
            success: false,
            page: page || 'view_goals',
            component: component || 'FilterOptionsData',
            loading: loading || 'filterOptionsLoad',
            message: error.message || 'Failed to fetch filter options'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// GET GOAL BY ID
// ============================================================================
export const getGoalById = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const goalId = req.query.id;
        if (!goalId) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'GoalDetailsData',
                loading: loading || 'goalDetailsLoad',
                message: 'Goal ID is required'
            });
        }

        connection = await getConnection();
        const result = await ViewGoals.getGoalById(connection, goalId);

        res.status(200).json({
            success: true,
            page: page || 'view_goals',
            component: component || 'GoalDetailsData',
            loading: loading || 'goalDetailsLoad',
            result: result.result
        });

    } catch (error) {
        console.error('❌ getGoalById error:', error);
        res.status(500).json({
            success: false,
            page: page || 'view_goals',
            component: component || 'GoalDetailsData',
            loading: loading || 'goalDetailsLoad',
            message: error.message || 'Failed to fetch goal details'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// GET SUMMARY STATS
// ============================================================================
export const getSummaryStats = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const employeeId = req.query.id;
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'SummaryStatsData',
                loading: loading || 'summaryStatsLoad',
                message: 'Employee ID is required'
            });
        }

        const userRole = String(employeeId) === '12345' ? 'Super Admin' : 'Goal Owner';

        connection = await getConnection();
        const result = await ViewGoals.getSummaryStats(connection, userRole, employeeId);

        res.status(200).json({
            success: true,
            page: page || 'view_goals',
            component: component || 'SummaryStatsData',
            loading: loading || 'summaryStatsLoad',
            result: result.result
        });

    } catch (error) {
        console.error('❌ getSummaryStats error:', error);
        res.status(500).json({
            success: false,
            page: page || 'view_goals',
            component: component || 'SummaryStatsData',
            loading: loading || 'summaryStatsLoad',
            message: error.message || 'Failed to fetch summary stats'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// SAVE MONTHLY UPDATE
// ============================================================================
export const saveMonthlyUpdateFromViewGoals = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const updateData = req.body;

        if (!updateData.mu_goal_id) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'muSaveLoad',
                message: 'Goal ID is required'
            });
        }

        if (!updateData.mu_month || !updateData.mu_year) {
            return res.status(400).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'muSaveLoad',
                message: 'Month and year are required'
            });
        }

        connection = await getConnection();

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const result = await MonthlyUpdates.saveUpdate(connection, updateData);

        if (result && result.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            res.status(200).json({
                success: true,
                page: page || 'view_goals',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'muSaveLoad',
                message: 'Monthly update saved successfully',
                data: result
            });
        } else {
            await new Promise(resolve => connection.rollback(() => resolve()));
            res.status(500).json({
                success: false,
                page: page || 'view_goals',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'muSaveLoad',
                message: 'Error saving monthly update'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ saveMonthlyUpdateFromViewGoals error:', error);
        res.status(400).json({
            success: false,
            page: page || 'view_goals',
            component: component || 'SaveMonthlyUpdate',
            loading: loading || 'muSaveLoad',
            message: error.message || 'Failed to save monthly update'
        });
    } finally {
        if (connection) connection.release();
    }
};