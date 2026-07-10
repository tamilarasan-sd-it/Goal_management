import connectionPool from "../database/dbConfig.js";
import SubGoalReviewModel from "../models/subGoalReviewModel.js";



const getSubGoalHistoryViewPageController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    const subGoalAssignmentId = id;
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

        const getSubGoalHistoryViewPageResult = await SubGoalReviewModel.findAllSubGoalsBySubGoalId(connection, subGoalAssignmentId);

        if (getSubGoalHistoryViewPageResult && getSubGoalHistoryViewPageResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            res.status(200).json({ 
                success: true, 
                page, 
                component, 
                loading, 
                result: getSubGoalHistoryViewPageResult?.result ?? [] // ✅ never undefined
            });
        } else {
            // ✅ Handle when success is false — was missing before!
            res.status(200).json({ 
                success: false, 
                page, 
                component, 
                loading, 
                result: [] 
            });
        }
    } catch (error) {
        console.error('Error in getSubGoalHistoryViewPageController:', error);
        res.status(500).json({ 
            success: false, 
            page, 
            component, 
            loading, 
            message: 'Internal Server Error',
            result: [] // ✅ always send result key
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export { getSubGoalHistoryViewPageController };