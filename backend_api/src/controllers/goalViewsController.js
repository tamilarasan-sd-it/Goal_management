import connectionPool from "../database/dbConfig.js";
import { SendForStatusBasedEmail } from "../emailUtils/emailTrigger.js";
import { io } from "../index.js";
import GoalReviewerModel from "../models/goalReviewerModel.js";
import { TemplateGoals } from "../models/templateGoalsModel.js";
import GoalViewsModel from "../models/goalViewsModel.js";
import SubGoalReviewModel from "../models/subGoalReviewModel.js";

const getGoalViewsByUserController = async (req, res) => {
    const { page, component, loading } = req.query;
    let userId, status, tempId;

    if (req.query.id?.startsWith('{')) {
        const parsed = JSON.parse(req.query.id);
        userId = parsed.user_id;
        status = parsed.status;
        tempId = parsed.temp_id;
    } else {
        userId = req.query.id;
        tempId = req.query.temp_id;
    }

    const filteredDetails = {
        userId: userId,
        tempId,
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
        const getGoalViewsResult = await GoalViewsModel.findAllGoalViewsByUser(connection, filteredDetails);

        
        if (getGoalViewsResult && getGoalViewsResult?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal Views successfully', result: getGoalViewsResult?.result });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Views Retrieve' });
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
        console.error('Error in getGoalViewsByUserController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const getGoalViewsByIDController = async (req, res) => {
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
        const getGoalViewByIdResult = await GoalViewsModel.findGoalViewById(connection, goalViewId);

        if (getGoalViewByIdResult && getGoalViewByIdResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal View successfully', result: getGoalViewByIdResult?.result });
        }
    } catch (error) {
        console.error('Error in getGoalViewsByIDController:', error);
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

const getGoalColumnsByIDController = async (req, res) => {
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

        const getGoalColumnsByIdResult = await GoalViewsModel.findGoalColumnsById(connection, goalViewAssignId);

        if (getGoalColumnsByIdResult && getGoalColumnsByIdResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal Columns successfully', result: getGoalColumnsByIdResult?.result });
        }
    } catch (error) {
        console.error('Error in getGoalColumnsByIDController:', error);
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

// reviwer change status update controller  added here
const addGoalTemplateForviewController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    let committed = false;

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

        const getAssignementIdBasedSubGoalReviewResult = await SubGoalReviewModel.findAllByAssignmentId(connection, addNewTemplateReviewsData?.tr_assignment_id);

        // console.log(addNewTemplateReviewsResult, "addNewTemplateReviewsResult");
        // console.log(updateStatusTemplateAssignResult,"updateStatusTemplateAssignResultupdateStatusTemplateAssignResult")

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


        let finalStatus = statusChangeData?.template_status;
        if (statusChangeData?.template_status == 'Approved') {

            const autoStatusChangeData = {
                ta_status: 'In_Progress',
                ta_modified_at: new Date(),
                ta_pid: updateStatusTemplateAssignData.ta_pid,
            };

            const autoStatusChangeResult = await GoalReviewerModel.updateStatusTemplateAssign(connection, autoStatusChangeData);
            if (autoStatusChangeResult?.success) {
                finalStatus = 'In_Progress';
            }

            const addAutoTemplateReviewsData = {
                tr_assignment_id: statusChangeData?.tr_assignment_id,
                tr_template_id: statusChangeData?.template_pid,
                tr_reviewer_id: goalEmailRows?.[0]?.ol_emp_id,
                tr_review_status: 'In_Progress',
                tr_review_date: new Date(),
                tr_comments: 'In Progress',
                tr_created_at: new Date(),
                tr_modified_at: new Date()
            }
            // console.log(addAutoTemplateReviewsData, "addAutoTemplateReviewsData");

            const autoAddNewTemplateReviewsResult = await GoalReviewerModel.addNewTemplateReviews(connection, addAutoTemplateReviewsData);

        }

        if (updateStatusTemplateAssignResult && updateStatusTemplateAssignResult?.success && addNewTemplateReviewsResult && addNewTemplateReviewsResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    committed = true;

                    resolve();
                });
            });

            const updatedSocketData = {
                ...updateStatusTemplateAssignResult?.result,
                ta_pid: updateStatusTemplateAssignResult?.result?.ta_pid,
                ta_status: finalStatus
            };


            io.emit('updateSocket', { page: page, component: component, loading: loading, success: true, id: updatedSocketData?.ta_pid, idName: 'ta_pid', updatedData: { ...updatedSocketData, "ta_pid": updatedSocketData?.ta_pid } });

            io.emit('updateSocket', { page: 'goalReviewerByIdList', component: 'GoalReviewerByIdListData', loading: 'GoalReviewerByIdListLoad', success: true, id: updateStatusTemplateAssignResult?.result?.ta_pid, idName: 'ta_pid', updatedData: { ...updateStatusTemplateAssignResult?.result, "ta_pid": updateStatusTemplateAssignResult?.result?.ta_pid } });

            // io.emit('updateSocket', { page: 'goalReviewer', component: 'GoalTemplateDataForReviwerData', loading: 'GoalTemplateDataForReviwerLoad', success: true, id: updateStatusTemplateAssignResult?.result?.ta_pid, idName: 'ta_pid', updatedData: { ...updateStatusTemplateAssignResult?.result, "ta_pid": updateStatusTemplateAssignResult?.result?.ta_pid } });

            io.emit('updateSocket', { page: 'goalReviewer', component: 'GoalTemplateDataForReviwerData', loading: 'GoalTemplateDataForReviwerLoad', success: true, id: updatedSocketData?.ta_pid, idName: 'ta_pid', updatedData: { ...updatedSocketData, "ta_pid": updatedSocketData?.ta_pid } });

            // io.emit('updateSocket', { page: 'goal_view_page', component: 'GoalTemplateDataReviwerData', loading: 'GoalTemplateDataReviwerLoad', success: true, id: updatedSocketData?.ta_pid, idName: 'ta_pid', updatedData: { ...updatedSocketData, "ta_pid": updatedSocketData?.ta_pid } });

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

            return res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'update successfully' });
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
            if (!committed) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back');
                        resolve();
                    });
                });
            }
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const bulkGoaltemplateUpdateForviewController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    let committed = false;

    const statusChangeBulkData = req.body;
    const tgPidList = Array.isArray(statusChangeBulkData?.tg_pid)
        ? statusChangeBulkData.tg_pid
        : typeof statusChangeBulkData?.tg_pid === 'string'
            ? statusChangeBulkData.tg_pid.split(',').map(id => id.trim()).filter(Boolean)
            : [];

    if (tgPidList.length === 0) {
        return res.status(400).json({
            success: false,
            page,
            component,
            loading,
            message: 'No subgoal IDs provided for bulk update'
        });
    }

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

        const addNewSubGoalReviewsData = tgPidList.map((subgoalId) => ({
            sbr_subgoal_id: subgoalId,
            sbr_assignment_id: statusChangeBulkData?.tr_assignment_id,
            sbr_template_id: statusChangeBulkData?.template_pid,
            sbr_reviewer_id: statusChangeBulkData?.tr_reviewer_id,
            sbr_review_status: statusChangeBulkData?.tr_review_status,
            sbr_comments: statusChangeBulkData?.tr_comments,
            sbr_is_active: 'Active'
        }));

        const addNewSubGoalReviewsResult = await SubGoalReviewModel.addNewSubGoalReviews(connection, addNewSubGoalReviewsData);



        const updateBulkResult = await TemplateGoals.updateBulkGoalReviewerStatus(
            connection,
            statusChangeBulkData?.tr_reviewer_id,
            tgPidList,
            statusChangeBulkData?.tr_review_status,
            statusChangeBulkData?.tr_reviewer_id === '12345'
        );


        // success

        if (addNewSubGoalReviewsResult && addNewSubGoalReviewsResult?.success && updateBulkResult && updateBulkResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    committed = true;

                    resolve();
                });
            });

            // Emit socket updates for each updated goal
            const statusField = statusChangeBulkData?.tr_reviewer_id === '12345' ? 'tg_super_admin_status' : 'tg_reviewer_status';

            tgPidList.forEach(tgPid => {
                const updatedSocketData = {
                    tg_pid: tgPid,
                    [statusField]: statusChangeBulkData?.tr_reviewer_id,
                    sbr_review_status: statusChangeBulkData?.tr_review_status
                };

                io.emit('updateSocket', {
                    page: page,
                    component: component,
                    loading: loading,
                    success: true,
                    id: tgPid,
                    idName: 'tg_pid',
                    updatedData: { ...updatedSocketData, tg_pid: tgPid }
                });

            });

            return res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Bulk Update successfully' });

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
        console.error('Error in bulkGoaltemplateUpdateForviewController:', error);

        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Goal Template for Reviewer Create' });
    } finally {
        // Always release the connection back to the pool   
        if (connection) {
            if (!committed) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back');
                        resolve();
                    });
                });
            }
            connection.release();
            console.log('Connection released back to pool');
        }
    }

}

const getGoalTemplateByIDController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    const templateID = id;
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

        const getGoalTemplateByIdResult = await GoalReviewerModel.findAllGoalTemplatesById(connection, templateID);
        if (getGoalTemplateByIdResult && getGoalTemplateByIdResult?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Goal Columns successfully', result: getGoalTemplateByIdResult?.result });
        }
    } catch (error) {
        console.error('Error in getGoalTemplateByIDController:', error);
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
    getGoalViewsByUserController,
    getGoalViewsByIDController,
    addGoalTemplateForviewController,
    getGoalColumnsByIDController,
    bulkGoaltemplateUpdateForviewController,
    getGoalTemplateByIDController
}