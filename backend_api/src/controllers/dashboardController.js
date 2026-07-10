import connectionPool from "../database/dbConfig.js";
import { DashboardModel } from "../models/dashboardModel.js";

const getDashboardController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    // console.log(id,"dfxgchjkl;")
    let connection;
    try {
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

        let dashboardResult;

        // 🔥 ADMIN USER
        if (id == 12345) {
            dashboardResult = await DashboardModel.findAll(connection);
        }
        // 🔥 REVIEWER USER
        else {
            dashboardResult = await DashboardModel.getAssignedOwnerDashboard(
                connection,
                id
            );
        }


        if (dashboardResult && dashboardResult?.success) {

            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            res.status(200).json({
                success: true,
                page: page,
                component: component,
                loading: loading,
                message: 'Retrieved Dashboard Data successfully',
                result: dashboardResult?.result
            });

        } else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }

            res.status(500).json({
                success: false,
                page: page,
                component: component,
                loading: loading,
                message: 'Error On Dashboard Data Retrieve'
            });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => {
                connection.rollback(() => {
                    console.log('Transaction rolled back due to error');
                    resolve();
                });
            });
        }

        console.error('Error in getDashboardController:', error);

        res.status(500).json({
            success: false,
            page: page,
            component: component,
            loading: loading,
            message: 'Internal Server Error'
        });

    } finally {
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};



const getReviewerDashboardCountController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    let connection;

    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject(err);
                resolve(conn);
            });
        });

        console.log("Reviewer ID:", id);

        const response = await DashboardModel.getReviewerDashboard(
            connection,
            id
        );

        res.status(200).json({
            success: true,
            page,
            component,
            loading,
            message: "Reviewer assignments retrieved successfully",
            result: response.result
        });

    } catch (error) {
        console.error("Error in getReviewerAssignmentsController:", error);

        res.status(500).json({
            success: false,
            page,
            component,
            loading,
            message: "Internal Server Error"
        });

    } finally {
        if (connection) {
            connection.release();
            console.log("Connection released back to pool");
        }
    }
};

const getCategoryCountController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;

    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject(err);
                resolve(conn);
            });
        });

        const response = await DashboardModel.getCategoryCounts(connection);

        res.status(200).json({
            success: true,
            page,
            component,
            loading,
            message: "Category counts retrieved successfully",
            result: response.result
        });

    } catch (error) {
        console.error("Error in getCategoryCountController:", error);

        res.status(500).json({
            success: false,
            page,
            component,
            loading,
            message: "Internal Server Error"
        });

    } finally {
        if (connection) {
            connection.release();
            console.log("Connection released back to pool");
        }
    }
};




export { 
    getDashboardController, 
    getReviewerDashboardCountController,
    getCategoryCountController
};
