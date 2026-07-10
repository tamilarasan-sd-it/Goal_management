// src/controllers/monthlyUpdatesController.js
// ✅ UPDATED: Handles query string filters from id parameter (same as ViewGoals)
// GET /api/v1/monthly-updates/MonthlyReportData/fetch?id=month/year/department

import connectionPool from "../database/dbConfig.js";
import { io } from "../index.js";
import { MonthlyUpdates } from "../models/monthlyUpdatesModel.js";

// ============================================================================
// HELPER — get a pooled connection (promisified)
// ============================================================================
const getConnection = () =>
    new Promise((resolve, reject) => {
        connectionPool.getConnection((err, conn) => {
            if (err) return reject({ error: err, success: false });
            resolve(conn);
        });
    });

// ============================================================================
// GET EMPLOYEE GOALS WITH MONTHLY UPDATES
// GET /api/v1/monthly-updates/MonthlyGoalsData/fetch?id=employeeId/month/year
// ============================================================================
export const getEmployeeGoalsController = async (req, res) => {
    const { page, component, loading, id } = req.query;

    let connection;
    try {
        const [employeeId, month, year] = (id || '').split('/');

        console.log('🔍 Request params:', { id, employeeId, month, year });

        if (!employeeId || !month || !year) {
            console.error('❌ Missing parameters:', { employeeId, month, year, id });
            return res.status(400).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'MonthlyGoalsData',
                loading: loading || 'monthlyGoalsLoad',
                message: 'Employee ID, month, and year are required'
            });
        }

        connection = await getConnection();

        console.log(`🔍 Fetching monthly goals for employee ${employeeId}, ${month}/${year}`);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const goalsData = await MonthlyUpdates.getEmployeeGoalsWithUpdates(
            connection,
            employeeId,
            parseInt(month),
            parseInt(year)
        );

        if (goalsData && goalsData.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            res.status(200).json({
                success: true,
                page: page || 'monthly_updates',
                component: component || 'MonthlyGoalsData',
                loading: loading || 'monthlyGoalsLoad',
                message: 'Goals retrieved successfully',
                result: goalsData.result
            });
        } else {
            await new Promise(resolve => connection.rollback(() => resolve()));

            res.status(500).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'MonthlyGoalsData',
                loading: loading || 'monthlyGoalsLoad',
                message: 'Error retrieving goals'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Error in getEmployeeGoalsController:', error);
        res.status(500).json({
            success: false,
            page: page || 'monthly_updates',
            component: component || 'MonthlyGoalsData',
            loading: loading || 'monthlyGoalsLoad',
            message: error.error || error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// SAVE MONTHLY UPDATE
// POST /api/v1/monthly-updates/SaveMonthlyUpdate/create
// ============================================================================
export const saveMonthlyUpdateController = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const updateData = req.body;

        if (!updateData.mu_goal_id) {
            return res.status(400).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'saveUpdateLoad',
                message: 'Goal ID is required'
            });
        }

        if (!updateData.mu_month || !updateData.mu_year) {
            return res.status(400).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'saveUpdateLoad',
                message: 'Month and year are required'
            });
        }

        connection = await getConnection();

        console.log(`💾 Saving update for goal ${updateData.mu_goal_id}`);

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

            if (io) {
                io.emit('addSocket', {
                    page: page || 'monthly_updates',
                    component: component || 'SaveMonthlyUpdate',
                    loading: loading || 'saveUpdateLoad',
                    success: true,
                    message: 'Update saved successfully',
                    goalId: updateData.mu_goal_id
                });
            }

            res.status(200).json({
                success: true,
                page: page || 'monthly_updates',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'saveUpdateLoad',
                message: 'Update saved successfully',
                data: result
            });
        } else {
            await new Promise(resolve => connection.rollback(() => resolve()));

            res.status(500).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'SaveMonthlyUpdate',
                loading: loading || 'saveUpdateLoad',
                message: 'Error saving update'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Error in saveMonthlyUpdateController:', error);
        res.status(400).json({
            success: false,
            page: page || 'monthly_updates',
            component: component || 'SaveMonthlyUpdate',
            loading: loading || 'saveUpdateLoad',
            message: error.error || error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// SUBMIT ALL UPDATES (LOCK THEM)
// POST /api/v1/monthly-updates/SubmitMonthlyUpdates/create
// ============================================================================
export const submitUpdatesController = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        const { employeeId, month, year } = req.body;

        if (!employeeId || !month || !year) {
            return res.status(400).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'SubmitMonthlyUpdates',
                loading: loading || 'submitUpdatesLoad',
                message: 'Employee ID, month, and year are required'
            });
        }

        connection = await getConnection();

        console.log(`🔒 Submitting updates for employee ${employeeId}, ${month}/${year}`);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const result = await MonthlyUpdates.submitUpdates(
            connection,
            employeeId,
            parseInt(month),
            parseInt(year)
        );

        if (result && result.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            if (io) {
                io.emit('addSocket', {
                    page: page || 'monthly_updates',
                    component: component || 'SubmitMonthlyUpdates',
                    loading: loading || 'submitUpdatesLoad',
                    success: true,
                    message: result.message,
                    employeeId,
                    month,
                    year
                });
            }

            res.status(200).json({
                success: true,
                page: page || 'monthly_updates',
                component: component || 'SubmitMonthlyUpdates',
                loading: loading || 'submitUpdatesLoad',
                message: result.message,
                data: result
            });
        } else {
            await new Promise(resolve => connection.rollback(() => resolve()));

            res.status(500).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'SubmitMonthlyUpdates',
                loading: loading || 'submitUpdatesLoad',
                message: 'Error submitting updates'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Error in submitUpdatesController:', error);
        res.status(400).json({
            success: false,
            page: page || 'monthly_updates',
            component: component || 'SubmitMonthlyUpdates',
            loading: loading || 'submitUpdatesLoad',
            message: error.error || error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ============================================================================
// GET ADMIN REPORT
// GET /api/v1/monthly-updates/MonthlyReportData/fetch?id=month/year/department
// ✅ UPDATED: Always uses simple path format (no query string parsing needed)
// ============================================================================
export const getAdminReportController = async (req, res) => {
    const { page, component, loading, id } = req.query;

    let connection;
    try {
        // ✅ Parse month/year/department from ID (simple path format)
        const parts = (id || '').split('/');
        const month = parts[0];
        const year = parts[1];
        const department = parts[2] || 'all';

        console.log('📊 Admin Report Request:', { 
            id, 
            month, 
            year, 
            department 
        });

        if (!month || !year) {
            console.error('❌ Missing month/year:', { month, year, id });
            return res.status(400).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'MonthlyReportData',
                loading: loading || 'monthlyReportLoad',
                message: 'Month and year are required'
            });
        }

        connection = await getConnection();

        console.log(`📊 Fetching admin report for ${month}/${year}, department: ${department}`);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) {
                    console.error('❌ Transaction start failed:', err);
                    return reject({ error: err, success: false });
                }
                resolve();
            });
        });

        const reportData = await MonthlyUpdates.getAdminReport(
            connection,
            parseInt(month),
            parseInt(year),
            department
        );

        console.log('✅ Report data result:', { 
            success: reportData.success, 
            rowCount: reportData.result?.length 
        });

        if (reportData && reportData.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) {
                        console.error('❌ Commit failed:', err);
                        return reject({ error: err, success: false });
                    }
                    resolve();
                });
            });

            res.status(200).json({
                success: true,
                page: page || 'monthly_updates',
                component: component || 'MonthlyReportData',
                loading: loading || 'monthlyReportLoad',
                message: 'Report retrieved successfully',
                result: reportData.result
            });
        } else {
            await new Promise(resolve => connection.rollback(() => resolve()));

            res.status(500).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'MonthlyReportData',
                loading: loading || 'monthlyReportLoad',
                message: 'Error retrieving report'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Critical Error in getAdminReportController:', {
            message: error.message,
            stack: error.stack,
            error: error.error
        });
        
        res.status(500).json({
            success: false,
            page: page || 'monthly_updates',
            component: component || 'MonthlyReportData',
            loading: loading || 'monthlyReportLoad',
            message: error.error || error.message || 'Internal Server Error',
            debugInfo: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (connection) {
            connection.release();
            console.log('✅ Connection released');
        }
    }
};

// ============================================================================
// GET EMPLOYEE DETAIL FOR ADMIN
// GET /api/v1/monthly-updates/EmployeeDetailsData/fetch?id=employeeId/month/year
// ============================================================================
export const getEmployeeDetailController = async (req, res) => {
    const { page, component, loading, id } = req.query;

    let connection;
    try {
        const [employeeId, month, year] = (id || '').split('/');

        console.log('🔍 Employee Detail Request:', { employeeId, month, year, id });

        if (!employeeId || !month || !year) {
            console.error('❌ Missing parameters:', { employeeId, month, year, id });
            return res.status(400).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'EmployeeDetailsData',
                loading: loading || 'employeeDetailsLoad',
                message: 'Employee ID, month, and year are required'
            });
        }

        connection = await getConnection();

        console.log(`🔍 Fetching employee detail for ${employeeId}, ${month}/${year}`);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) {
                    console.error('❌ Transaction start failed:', err);
                    return reject({ error: err, success: false });
                }
                resolve();
            });
        });

        const detailData = await MonthlyUpdates.getEmployeeDetail(
            connection,
            employeeId,
            parseInt(month),
            parseInt(year)
        );

        if (detailData && detailData.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) {
                        console.error('❌ Commit failed:', err);
                        return reject({ error: err, success: false });
                    }
                    resolve();
                });
            });

            res.status(200).json({
                success: true,
                page: page || 'monthly_updates',
                component: component || 'EmployeeDetailsData',
                loading: loading || 'employeeDetailsLoad',
                message: 'Employee details retrieved successfully',
                result: detailData.result
            });
        } else {
            await new Promise(resolve => connection.rollback(() => resolve()));

            res.status(500).json({
                success: false,
                page: page || 'monthly_updates',
                component: component || 'EmployeeDetailsData',
                loading: loading || 'employeeDetailsLoad',
                message: 'Error retrieving employee details'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Error in getEmployeeDetailController:', {
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            page: page || 'monthly_updates',
            component: component || 'EmployeeDetailsData',
            loading: loading || 'employeeDetailsLoad',
            message: error.error || error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) {
            connection.release();
            console.log('✅ Connection released');
        }
    }
};