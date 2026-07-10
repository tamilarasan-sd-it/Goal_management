import connectionPool from "../database/dbConfig.js";
import { MonthlyScheduler } from "../models/monthlySchedulerModel.js";
import { ScheduleCallMail } from "../emailUtils/emailTrigger.js";
import { io } from "../index.js";
import { createCronForScheduledCall, 
    updateCronForScheduledCall, 
    refreshAllCrons,
    getActiveCronJobs } from "../services/meetingCronService.js";
// import { 
//     createCronForScheduledCall, 
//     updateCronForScheduledCall, 
//     refreshAllCrons,
//     getActiveCronJobs
// } from "../services/meetingCronService.js";

const getConnection = () =>
    new Promise((resolve, reject) => {
        connectionPool.getConnection((err, conn) => {
            if (err) return reject({ error: err, success: false });
            resolve(conn);
        });
    });

export const fetchScheduleCallController = async (req, res) => {

    const { page, component, loading } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const scheduleResults = await MonthlyScheduler.fetchAllSchedules(connection);

        if (scheduleResults && scheduleResults.success) {
            res.status(200).json({
                success: true,
                page: page,
                component: component,
                loading: loading,
                message: 'Retrieved Scheduled Calls successfully',
                result: scheduleResults.result
            });
        } else {
            res.status(500).json({
                success: false,
                page: page,
                component: component,
                loading: loading,
                message: 'Error retrieving scheduled calls'
            });
        }
    } catch (error) {
        console.error('❌ Error in fetchScheduleCallController:', error);
        res.status(500).json({
            success: false,
            page: page || 'schedule_calls',
            component: component || 'ScheduleCallData',
            loading: loading || 'scheduleCallLoad',
            message: error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) connection.release();
    }
};

export const createScheduleCallController = async (req, res) => {

    const { page, component, loading } = req.query;
    const scheduleData = req.body;
    let connection;
    try {
        if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
            return res.status(400).json({
                success: false,
                page: page || 'schedule_calls',
                component: component || 'ScheduleCallData',
                loading: loading || 'scheduleCallLoad',
                message: 'Schedule data is required and must be an array.'
            });
        }

        connection = await getConnection();

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const insertPromises = scheduleData.map(call => {
            const { type, date } = call;
            if (!type || !date) {
                throw new Error('Each schedule item must have a type and a date.');
            }
            return MonthlyScheduler.createSchedule(connection, {
                type,
                date,
            });
        });

        const results = await Promise.all(insertPromises);
        const EmpPostionData =  await MonthlyScheduler.fetchEmployeeData(connection);
        console.log(results);

        // Check if all inserts were successful
        if (results.every(r => r.success)) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            const scheduleResults = await MonthlyScheduler.fetchAllSchedules(connection);

            if (scheduleResults && scheduleResults.success) {
                // ✅ Create cron jobs for newly created schedules
                for (const result of results) {
                    if (result.insertId) {
                        const newCall = scheduleResults.result.find(s => s.id === result.insertId);
                        if (newCall) {
                            createCronForScheduledCall({
                                id: newCall.id,
                                date: newCall.mail_date,
                                type: newCall.mail_type,
                                is_active: 1
                            });
                        }
                    }
                }

                io.emit('addSocket', { 
                    page: page, 
                    component: component, 
                    loading: loading, 
                    success: true, 
                    message: 'Call Scheduled successfully and cron jobs created', 
                    data: scheduleResults?.result 
                });
                
                res.status(200).json({ 
                    success: true, 
                    page: page, 
                    component: component, 
                    loading: loading, 
                    message: 'Call Scheduled successfully and cron jobs created', 
                    result: scheduleResults?.result 
                });
            }

        } else {
            throw new Error('One or more schedule inserts failed.');
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Error in createScheduleCallController:', error);
        res.status(500).json({
            success: false,
            page: page || 'schedule_calls',
            component: component || 'ScheduleCallData',
            loading: loading || 'scheduleCallLoad',
            message: error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) connection.release();
    }
};

export const updateScheduleCallController = async (req, res) => {
    const { page, component, loading } = req.query;
    const scheduleData = req.body;
    const types = [...new Set(scheduleData.map(item => item.type))];
    const count = scheduleData.length;

    let connection;
    try {
        if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
            return res.status(400).json({
                success: false,
                page: page || 'schedule_calls',
                component: component || 'ScheduleCallData',
                loading: loading || 'scheduleCallLoad',
                message: 'Schedule data is required and must be an array.'
            });
        }
        connection = await getConnection();

        let EmpPostionData;
        if (types.length === 1 && types[0] === 'Functional Head') {
            EmpPostionData = await MonthlyScheduler.fetchSeniorManagers(connection);
        } else if (types.length === 1 && types[0] === 'Assistant Manager') {
            EmpPostionData = await MonthlyScheduler.fetchAssistantManagers(connection);
        } else if (types.length === 2) {
            EmpPostionData = await MonthlyScheduler.fetchEmployeeData(connection);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid or unsupported schedule type combination.'
            });
        }
        
        
        const ScheduleDate    =  await MonthlyScheduler.fetchScheduleData(connection);
        
        await new Promise((resolve, reject) => connection.beginTransaction(err => err ? reject(err) : resolve()));

        const updatePromises = scheduleData.map(call => {
            const { id, date } = call;
            if (!id || !date) {
                throw new Error('Each schedule item must have an id and a date.');
            }
            return MonthlyScheduler.updateSchedule(connection, id, date);
        });

        const emailSendToSchedule = ScheduleCallMail(EmpPostionData,ScheduleDate);
        
      

        await Promise.all(updatePromises);

        await new Promise((resolve, reject) => connection.commit(err => err ? reject(err) : resolve()));

        const scheduleResults = await MonthlyScheduler.fetchAllSchedules(connection);

        // ✅ Update cron jobs for all updated schedules
        for (const call of scheduleData) {
            await updateCronForScheduledCall(call.id);
        }

        io.emit('updateSocket', { 
            page, 
            component, 
            loading, 
            success: true, 
            message: 'Call Scheduled updated successfully and cron jobs refreshed', 
            data: scheduleResults.result 
        });
        
        res.status(200).json({ 
            success: true, 
            page, 
            component, 
            loading, 
            message: 'Call Scheduled updated successfully and cron jobs refreshed', 
            result: scheduleResults.result 
        });

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(() => resolve()));
        }
        console.error('❌ Error in updateScheduleCallController:', error);
        res.status(500).json({
            success: false,
            page: page || 'schedule_calls',
            component: component || 'ScheduleCallData',
            loading: loading || 'scheduleCallLoad',
            message: error.message || 'Internal Server Error'
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ New endpoint to get cron job status
export const getCronStatusController = async (req, res) => {
    try {
        const activeCrons = getActiveCronJobs();
        res.status(200).json({
            success: true,
            message: 'Active cron jobs retrieved',
            active_crons: activeCrons,
            total: activeCrons.length
        });
    } catch (error) {
        console.error('❌ Error in getCronStatusController:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

// ✅ New endpoint to manually refresh all crons
export const refreshCronsController = async (req, res) => {
    try {
        await refreshAllCrons();
        res.status(200).json({
            success: true,
            message: 'All cron jobs refreshed successfully'
        });
    } catch (error) {
        console.error('❌ Error in refreshCronsController:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};