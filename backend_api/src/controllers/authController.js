import { generateToken } from "../authUtils/authUtils.js";
import connectionPool from "../database/dbConfig.js";
import { EmployeePersonalModel } from "../models/employeePersonalModel.js";

const loginController = async (req, res) => {
    let connection;


    try {
        const { emp_id, emp_pass } = req.body;

        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        // Fetch user details by emp_id
        const employee_list = await EmployeePersonalModel.getUserByEmpId(connection, emp_id);


        const employee = employee_list?.result?.[0];

        const userPassword = emp_pass;

        if (!employee) {
            return res.status(401).json({ success: false, message: 'employee not found' });
        }

        // Compare passwords
        const isMatch = userPassword == employee.emp_pass ? true : false;
        if (!isMatch) {
            return res.status(200).json({ success: false, message: 'Incorrect password.' });
        }

        let userRoleName = '';
        // Find the user's role
        switch (employee.level) {
            case 1:
                userRoleName = 'user'
                break;
            case 2:
                userRoleName = 'HR executive'
                break;
            case 3:
                userRoleName = 'PC'
                break;
            case 4:
                userRoleName = 'Assistant Manager'
                break;
            case 5:
                userRoleName = 'Senior Manager'
                break;
            case 6:
                userRoleName = 'HR Portal'
                break;
            case 7:
                userRoleName = 'Director'
                break;
            case 8:
                userRoleName = 'Software admin'
                break;
            default:
                userRoleName = 'DefaultEmployee'
                break;
        }

        const userRolePermissions = {
            'Senior Manager': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'Assistant Manager': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'HR Portal': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'Director': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'user': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'DefaultEmployee': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'HR executive': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "create-assignment", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'PC': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings","/goal-settings-list/:id", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '\ goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/schedule-calls','/sub-goal-history/:id','/template-list','/goallist-views/:id']
        };

        const permissions = userRolePermissions[userRoleName] || [];

        // Generate token with user details and permissions
        const token = generateToken({
            id: employee.emp_id,
            emp_id: employee.employee_id,
            emp_name: employee.emp_name,
            department: employee.department,
            level: employee.level,
            ReportingManager: employee.ReportingManager,
            userRoleName: userRoleName,
            userRolePermissions: permissions

        });

        // Commit the transaction
        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        res.status(200).json({ success: true, message: 'Login successful', result: token });
    } catch (error) {
        console.error('Error in loginController:', error);

        // Rollback the transaction in case of an error
        if (connection) {
            await new Promise(resolve => {
                connection.rollback(() => {
                    console.log('Transaction rolled back due to error');
                    resolve();
                });
            });
        }

        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};


const loginByExternalApplicationUser = async (req, res) => {
    let connection;
    try {
        const { emp_id } = req.query;

        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        // Fetch user details by emp_id
        const employee_list = await EmployeePersonalModel.getUserByEmpId(connection, emp_id);


        const employee = employee_list?.result?.[0];

        if (!employee) {
            return res.status(401).json({ success: false, message: 'employee not found' });
        }

        let userRoleName = '';
        // Find the user's role
        switch (employee.level) {
            case 1:
                userRoleName = 'user'
                break;
            case 2:
                userRoleName = 'HR executive'
                break;
            case 3:
                userRoleName = 'PC'
                break;
            case 4:
                userRoleName = 'Assistant Manager'
                break;
            case 5:
                userRoleName = 'Senior Manager'
                break;
            case 6:
                userRoleName = 'HR Portal'
                break;
            case 7:
                userRoleName = 'Director'
                break;
            case 8:
                userRoleName = 'Software admin'
                break;
            default:
                userRoleName = 'DefaultEmployee'
                break;
        }

        const userRolePermissions = {
            'Senior Manager': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'Assistant Manager': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'HR Portal': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'Director': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'user': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'DefaultEmployee': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'HR executive': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "create-assignment", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id'],
            'PC': ['/', '/add-category', '/add-template', '/add-fields', '/add-goals/:id', '/goal-reviews', '/goal-reviews-by-id/:id', '/goal-views', '/goal-views/:id', "/create-goal-settings", "/goal-settings", "/monthly-updates", "/monthly-updates/report", "/monthly-update-details/:employeeId/:month/:year", "/view-goals", '/goal-history/:id', '/template-details', '/monthly-scheduler', '/monthly-scheduler-analytics/:id','/sub-goal-history/:id','/template-list','/goallist-views/:id']
        };

        const permissions = userRolePermissions[userRoleName] || [];

        // Generate token with user details and permissions
        const token = generateToken({
            id: employee.emp_id,
            emp_id: employee.employee_id,
            emp_name: employee.emp_name,
            department: employee.department,
            level: employee.level,
            ReportingManager: employee.ReportingManager,
            userRoleName: userRoleName,
            userRolePermissions: permissions

        });

        // Commit the transaction
        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        res.status(200).json({ success: true, message: 'Login successful', result: token });
    } catch (error) {
        console.error('Error in loginByExternalApplicationUser:', error);

        // Rollback the transaction in case of an error
        if (connection) {
            await new Promise(resolve => {
                connection.rollback(() => {
                    console.log('Transaction rolled back due to error');
                    resolve();
                });
            });
        }

        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

export {
    loginController,
    loginByExternalApplicationUser
};