import connectionPool from "../database/dbConfig.js";

import GoalHistoryModel from "../models/goalHistoryModel.js";

const getGoalHistoryViewPageController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    const goalViewId = id;
    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const getGoalHistoryViewPageResult = await GoalHistoryModel.findGoalHistoryViewPage(connection, goalViewId);


        if (getGoalHistoryViewPageResult && getGoalHistoryViewPageResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal History View successfully', result: getGoalHistoryViewPageResult?.result });
        }


    } catch (error) {
        console.error('Error in getGoalHistoryViewPageController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
        return;
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const getGoalReviewsTemplateAssignmentsController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    const goalViewAssignId = id;
    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const getGoalReviewsTemplateAssignmentsResult = await GoalHistoryModel.findGoalReviewsTemplateAssignments(connection, goalViewAssignId);


        if (getGoalReviewsTemplateAssignmentsResult && getGoalReviewsTemplateAssignmentsResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal History View template assignments successfully', result: getGoalReviewsTemplateAssignmentsResult?.result });
        }


    } catch (error) {
        console.error('Error in getGoalReviewsTemplateAssignmentsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
        return;
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

export {
    getGoalHistoryViewPageController,
    getGoalReviewsTemplateAssignmentsController
};