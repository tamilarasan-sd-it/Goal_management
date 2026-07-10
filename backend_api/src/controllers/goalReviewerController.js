import connectionPool from "../database/dbConfig.js";
import { SendForStatusBasedEmail } from "../emailUtils/emailTrigger.js";
import { io } from "../index.js";
import GoalReviewerModel from "../models/goalReviewerModel.js";
import SubGoalReviewModel from "../models/subGoalReviewModel.js";

const getGoalReviewersController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    const templateAssignId = id;

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


        const getGoalReviewersResult = await GoalReviewerModel.findAllByTemplateId(connection, templateAssignId);

        if (getGoalReviewersResult && getGoalReviewersResult?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });


            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal Reviewers Template successfully', result: getGoalReviewersResult?.result });
        }
        else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Reviewers Template  Retrieve' });
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
        console.error('Error in getGoalReviewersController:', error);

        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Reviewers Template  Retrieve' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const getGoalTemplateForReviewerController = async (req, res) => {
    const { page, component, loading, id } = req.query;

    let goalReviewerId, status;

    if (req.query.id?.startsWith('{')) {
        const parsed = JSON.parse(req.query.id);
        goalReviewerId = parsed.user_id;
        status = parsed.status;
    } else {
        goalReviewerId = req.query.id;
    }

    const filteredReviewerDetails = {
        goalReviewerId: goalReviewerId,
        status: status ? status : 'ALL'
    }


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
        const getGoalTemplateForReviewerResult = await GoalReviewerModel.findAllGoalTemplatesByReviewerId(connection, filteredReviewerDetails);
        
        if (getGoalTemplateForReviewerResult && getGoalTemplateForReviewerResult?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal Template for Reviewer successfully', result: getGoalTemplateForReviewerResult?.result });
        }
        else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Template for Reviewer Retrieve' });
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
        console.error('Error in getGoalTemplateForReviewerController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Template for Reviewer Retrieve' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const getSubGoalReviewerController = async (req, res) => {
    const { page, component, loading, id } = req.query;

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
        const getSubGoalReviewerResult = await SubGoalReviewModel.findAllSubGoalsByReviewerId(connection);

        if (getSubGoalReviewerResult && getSubGoalReviewerResult?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Sub Goal for Reviewer successfully', result: getSubGoalReviewerResult?.result });
        }
        else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Sub Goal for Reviewer Retrieve' });
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
        console.error('Error in getSubGoalReviewerController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Sub Goal for Reviewer Retrieve' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }

}

const getGoalColumnsByIDReviewerController = async (req, res) => {
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

        const getGoalColumnsByIdResult = await GoalReviewerModel.findGoalColumnsReviewerById(connection, goalViewAssignId);

        if (getGoalColumnsByIdResult && getGoalColumnsByIdResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal Columns successfully', result: getGoalColumnsByIdResult?.result });
        }
        else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Columns Retrieve' });
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
        console.error('Error in getGoalColumnsByIDReviewerController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Columns Retrieve' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};
// reviwer change status update controller  added here
const addGoalTemplateForReviewerController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    const statusChangeData = req.body;
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

        const updateStatusTemplateAssignData = {
            ta_pid: statusChangeData?.tr_assignment_id,
            ta_status: statusChangeData?.template_status,
            ta_modified_at: new Date(),
        };
        // console.log(updateStatusTemplateAssignData, "updateStatusTemplateAssignData");


        const addNewTemplateReviewsData = {
            tr_assignment_id: statusChangeData?.tr_assignment_id,
            tr_template_id: statusChangeData?.template_pid,
            tr_reviewer_id: statusChangeData?.tr_reviewer_id,
            tr_review_status: statusChangeData?.tr_review_status,
            tr_review_date: statusChangeData?.tr_review_date,
            tr_comments: statusChangeData?.tr_comments,
            tr_created_at: statusChangeData?.tr_created_at,
            tr_modified_at: statusChangeData?.tr_modified_at
        }


        const updateStatusTemplateAssignResult = await GoalReviewerModel.updateStatusTemplateAssign(connection, updateStatusTemplateAssignData);

        const addNewTemplateReviewsResult = await GoalReviewerModel.addNewTemplateReviews(connection, addNewTemplateReviewsData);

        const getAssignementIdBasedSubGoalReviewResult = await SubGoalReviewModel.findAllByAssignmentId(connection, statusChangeData?.tr_assignment_id);

        const goalEmailQueryResponse =
            await GoalReviewerModel.getGoalDetailsForEmailSend(
                connection,
                updateStatusTemplateAssignData?.ta_pid
            );

        const goalEmailRows = goalEmailQueryResponse?.result;

        if (!goalEmailRows || goalEmailRows.length === 0) {
            throw new Error("No goal data found for email");
        }

        const assignmentData = {
            template_name: goalEmailRows?.[0]?.template_name,
            template_year: goalEmailRows?.[0]?.template_year,
            goal_owner_name: goalEmailRows?.[0]?.ol_emp_name,
            reviewer_name: goalEmailRows?.[0]?.rl_emp_name,
            super_admin_name: goalEmailRows?.[0]?.al_emp_name,
        };

        const goalsData = goalEmailRows.map(row => ({
            category_name: row?.category_name,
            tg_timeline: row?.tg_timeline,
            tg_goal_weightage: row?.tg_goal_weightage,
            tg_status: row?.tg_status,
            goal_owner_name: row?.ol_emp_name,
        }));

        const goalDetails = {
            assignmentData,
            goalsData,
            currentStatus: statusChangeData?.template_status,
        };



        const emailSendToReviewer = SendForStatusBasedEmail(goalDetails);


        if (updateStatusTemplateAssignResult && updateStatusTemplateAssignResult?.success && addNewTemplateReviewsResult && addNewTemplateReviewsResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            io.emit('updateSocket', { page: page, component: component, loading: loading, success: true, id: updateStatusTemplateAssignData?.ta_pid, idName: 'ta_pid', updatedData: { ...updateStatusTemplateAssignData, "ta_pid": updateStatusTemplateAssignData?.ta_pid } });

            io.emit('updateSocket', { page: 'goal_view_page', component: 'GoalViewPageByIdData', loading: 'GoalViewPageByIdLoad', success: true, id: updateStatusTemplateAssignData?.ta_pid, idName: 'ta_pid', updatedData: { ...updateStatusTemplateAssignData, "ta_pid": updateStatusTemplateAssignData?.ta_pid } });

            io.emit('updateSocket', { page: 'goal_view_page', component: 'GoalViewPageData', loading: 'GoalViewPageLoad', success: true, id: updateStatusTemplateAssignData?.ta_pid, idName: 'ta_pid', updatedData: { ...updateStatusTemplateAssignData, "ta_pid": updateStatusTemplateAssignData?.ta_pid } });

            // "goalReviewer", "SubGoalReviewerData", "SubGoalReviewerLoad"
            // goal_view_page/SubGoalViewPageData



            io.emit('fetchSocket', {
                page: 'goalReviewer',
                component: 'SubGoalReviewerData',
                loading: 'SubGoalReviewerLoad',
                success: true,
                data: { result: getAssignementIdBasedSubGoalReviewResult?.result }
            });

            io.emit('fetchSocket', {
                page: 'goal_view_page',
                component: 'SubGoalViewPageData',
                loading: 'SubGoalViewPageLoad',
                success: true,
                data: { result: getAssignementIdBasedSubGoalReviewResult?.result }
            });

            return res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'update successfully ' });
        } else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }
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
        console.error('Error in addGoalTemplateForReviewerController:', error);

        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Template for Reviewer Create' });
    } finally {
        // Always release the connection back to the pool   
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

export {
    getGoalReviewersController,
    getGoalTemplateForReviewerController,
    addGoalTemplateForReviewerController,
    getGoalColumnsByIDReviewerController,
    getSubGoalReviewerController,

};