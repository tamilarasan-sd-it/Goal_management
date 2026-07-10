
class GoalReviewerModel {

    static findAllByTemplateId(connection, templateAssignId) {
        return new Promise((resolve, reject) => {
            const query = `
               SELECT
                tm.template_pid,
                tm.template_name,
                tm.template_year,
                tm.template_description,
                tm.template_status,

                ta.ta_pid,
                ta.ta_generated_id,
                ta.ta_status,
                ta.ta_assigned_to_user_id,
                ta.ta_assigned_position,
                ta.ta_reviewer_eid,
                ta.ta_due_date,

                tc.tc_pid,
                tc.tc_category_id,
                cl.category_name,
                tc.tc_max_weightage,
                tc.tc_category_description,
                tc.tc_kpi_metric,
                tc.tc_target,
                tc.tc_order,

                tg.tg_pid,
                tg.tg_goal_generated_id,
                tg.tg_goal_weightage,
                tg.tg_timeline,
                tg.tg_priority,
                tg.tg_status,

                mu.mu_pid,
                mu.mu_goal_id,
                mu.mu_month,
                mu.mu_year,
                mu.mu_status,
                mu.mu_completed_weightage,
                mu.mu_monthly_notes,
                
                

                rl.emp_name as rl_emp_name,
                rl.employee_id as rl_emp_id,
                al.emp_name as al_emp_name,
                al.employee_id as al_emp_id,
                ol.emp_name as ol_emp_name,
                ol.employee_id as ol_emp_id

            FROM template_assignments ta

            JOIN templates_master tm
                ON tm.template_pid = ta.ta_template_id
                AND tm.template_is_delete = 'Active'

            LEFT JOIN template_categories tc
                ON tc.tc_template_id = tm.template_pid
                AND tc.tc_is_delete = 'Active'

            LEFT JOIN categories_list cl
                ON cl.category_pid = tc.tc_category_id
                AND cl.category_is_delete = 'Active'

            LEFT JOIN template_goals tg
                ON tg.tg_assignment_id = ta.ta_pid
                AND tg.tg_category_id = tc.tc_category_id
                AND tg.tg_is_delete = 'Active'
            
            LEFT JOIN monthly_updates mu ON mu.mu_goal_id = tg.tg_pid

            LEFT JOIN employee_personal as rl ON rl.employee_id = ta.ta_reviewer_eid

            LEFT JOIN employee_personal as al ON al.employee_id = ta.ta_assigned_by_user_id

            LEFT JOIN employee_personal as ol ON ol.employee_id = ta.ta_assigned_to_user_id

            WHERE ta.ta_pid = ? AND ta.is_delete = 'Active'

            GROUP BY
                tm.template_pid,
                ta.ta_pid,
                tc.tc_pid,
                tg.tg_pid
            ORDER BY ta.ta_pid DESC
            `;
            connection.query(query, [templateAssignId], (error, result) => {
                if (error) {
                    console.error('Error in getGoalReviewers:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    };

    static findAllGoalTemplatesByReviewerId(connection, goalReviewerDetails) {
        const { goalReviewerId, status } = goalReviewerDetails;
        console.log(goalReviewerId, "goalReviewerId");
        console.log(status, "status");

        return new Promise((resolve, reject) => {

            // let whereClause = "ta.ta_reviewer_eid = ? AND tm.template_is_delete = 'Active' AND ta.is_delete = 'Active'";
            let whereClause = `
                ta.ta_reviewer_eid = ?
                AND tm.template_is_delete = 'Active'
                AND ta.is_delete = 'Active'
                AND ta.ta_status IN ('Under_Review', 'Need_More_Information_Reviewer','Modify_Correction_Reviewer','Approve_Reviewer','Submitted','Assigned','In_Progress')
                `;

            let params = [];

            if (goalReviewerId && goalReviewerId != '') {
                params.push(goalReviewerId);
            }
            else {
                console.log('Reviewer Id is missing or empty')
            }
            if (status && status !== 'ALL') {
                whereClause += " AND ta.ta_status = ?";
                params.push(status);
            }


            const query = `
                SELECT 
                    tm.template_pid,
                    tm.template_name,
                    tm.template_year,
                    tm.template_created_date,
                    tm.template_status,
                    tm.template_created_by,
                    tm.template_modified_at,
                    tm.template_is_delete,
                    ta.ta_pid,
                    ta.ta_template_id,
                    ta.ta_assigned_to_user_id,
                    ta.ta_assigned_position,
                    ta.ta_assigned_by_user_id,
                    ta.ta_assigned_date,
                    ta.ta_due_date,
                    ta.ta_generated_id,
                    ta.ta_reviewer_eid,
                    ta.ta_email_sent,
                    ta.ta_email_sent_date,
                    ta.ta_status,
                    ta.ta_created_at,
                    ta.ta_modified_at,
                    reviewer.employee_id AS reviewer_employee_id,
                    reviewer.emp_name AS reviewer_employee_name,
                    assignee.employee_id AS assign_employee_id,
                    assignee.emp_name AS assign_employee_name
                    FROM template_assignments ta
                    LEFT JOIN templates_master tm ON tm.template_pid = ta.ta_template_id
                    LEFT JOIN employee_personal as reviewer ON reviewer.employee_id = ta.ta_reviewer_eid
                    LEFT JOIN employee_personal as assignee ON assignee.employee_id = ta.ta_assigned_to_user_id
                    WHERE ${whereClause}
                    GROUP BY ta.ta_pid, tm.template_pid
                    ORDER BY 
                        CASE ta.ta_status
                        WHEN 'Approve_Reviewer' THEN 1
                        WHEN 'Modify_Correction_Reviewer' THEN 2
                        WHEN 'Need_More_Information_Reviewer' THEN 3
                        WHEN 'Under_Review' THEN 4
                        WHEN 'Submitted' THEN 5
                        WHEN 'Assigned' THEN 6
                        ELSE 7
                        END,
                        ta.ta_modified_at DESC
                    `;

            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error('Error in findAllGoalTemplates:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static updateStatusTemplateAssign(connection, updateStatusTemplateAssignData) {
        return new Promise((resolve, reject) => {
            let query = ``;
            let params = [];

            if (updateStatusTemplateAssignData && updateStatusTemplateAssignData?.ta_status == 'Approved') {
                /*  Task ID GENERATION */

                let lastRunningNo = 0;
                let templateYear = null;
                let newGeneratedId = null;
                let assignedUserId = null;
                let assignedId = null;

                let currentAssignmentTemplateId = null;
                const selectCurrentAssignmentTemplateIdQuery = `
                    SELECT ta_template_id,ta_assigned_to_user_id,ta_pid
                    FROM template_assignments
                    WHERE ta_pid = ?
                `;
                connection.query(
                    selectCurrentAssignmentTemplateIdQuery,
                    [updateStatusTemplateAssignData.ta_pid],
                    (error, result) => {
                        if (error) return reject({ error, success: false });
                        if (!result.length)
                            return reject({ error: new Error('Task ID not found'), success: false });

                        currentAssignmentTemplateId = result[0].ta_template_id;
                        assignedUserId = result[0].ta_assigned_to_user_id;
                        assignedId     = result[0].ta_pid;
                    }
                );

                const selectLastRunningNoQuery = `
                SELECT 
                    tm.template_year,
                    COUNT(
                        CAST(SUBSTRING_INDEX(ta.ta_generated_id, '-', -1) AS UNSIGNED)
                    ) AS last_running_no
                FROM template_assignments ta
                LEFT JOIN templates_master tm 
                    ON tm.template_pid = ta.ta_template_id
                WHERE ta.is_delete = 'Active'
                AND tm.template_is_delete = 'Active'
                GROUP BY tm.template_year
            `;

                connection.query(
                    selectLastRunningNoQuery,
                    (error, lastRunningResult) => {

                        if (error) return reject({ error, success: false });
                        if (!lastRunningResult.length)
                            return reject({ error: new Error('Template year not found'), success: false });

                        lastRunningNo = lastRunningResult[0].last_running_no || 0;
                        templateYear = lastRunningResult[0].template_year;

                        newGeneratedId =
                            `TEMP-${templateYear}-${String(lastRunningNo + 1).padStart(3, '0')}`;

                        const updateTemplateQuery = `
                        UPDATE template_assignments
                        SET ta_status = ?,
                            ta_generated_id = ?,
                            ta_modified_at = ?
                        WHERE ta_pid = ?
                    `;

                        connection.query(
                            updateTemplateQuery,
                            [
                                updateStatusTemplateAssignData.ta_status,
                                newGeneratedId,
                                updateStatusTemplateAssignData.ta_modified_at,
                                updateStatusTemplateAssignData.ta_pid
                            ],
                            (err, result) => {

                                if (err) return reject({ error: err, success: false });
                                if (!result.affectedRows)
                                    return reject({ error: new Error('Update failed'), success: false });

                                const updatedResult = {
                                    ...updateStatusTemplateAssignData,
                                    ta_generated_id: newGeneratedId
                                };

                                /*  GOAL ID GENERATION */

                                const lastGoalRunningQuery = `
                                    SELECT 
                                        tg_goal_generated_id,
                                        CAST(SUBSTRING_INDEX(tg_goal_generated_id, '-', -1) AS UNSIGNED) AS last_running_no
                                    FROM template_goals
                                    WHERE tg_is_delete = 'Active'
                                    AND tg_goal_generated_id IS NOT NULL
                                    ORDER BY last_running_no DESC
                                    LIMIT 1
                                `;

                                connection.query(
                                    lastGoalRunningQuery,
                                    (err, lastGoalResult) => {

                                        if (err) return reject({ error: err, success: false });

                                        let lastGoalRunningNo =
                                            lastGoalResult[0]?.last_running_no || 0;

                                         const fetchGoalsQuery = `
                                           SELECT
                                            tg.tg_pid,
                                            tg.tg_category_id
                                        FROM template_goals AS tg
                                        INNER JOIN (
                                            SELECT tc_category_id, MIN(tc_pid) AS min_pid
                                            FROM template_categories
                                            WHERE tc_template_id = ?
                                            GROUP BY tc_category_id
                                        ) AS cat_order
                                            ON cat_order.tc_category_id = tg.tg_category_id
                                        WHERE tg.tg_assignment_id = ?
                                        AND tg.tg_goal_owner = ?
                                        ORDER BY
                                            cat_order.min_pid ASC,
                                            tg.tg_pid ASC
                                        `; 

                                        /* const fetchGoalsQuery = `SELECT tg.tg_pid, tg.tg_category_id
                                            FROM template_goals AS tg
                                            INNER JOIN template_categories AS tc
                                                ON tg.tg_tc_pid = tc.tc_pid   
                                            WHERE tg.tg_assignment_id = ?
                                            AND tg.tg_goal_owner = ?
                                            ORDER BY tc.tc_pid ASC `; */

                                        connection.query(
                                            fetchGoalsQuery,
                                            [currentAssignmentTemplateId,assignedId, assignedUserId],
                                            async (err, goals) => {

                                                if (err) return reject({ error: err, success: false });

                                                try {
                                                    for (let i = 0; i < goals.length; i++) {
                                                        const runningNo = lastGoalRunningNo + i + 1;

                                                        const goalGeneratedId =
                                                            `${newGeneratedId}-GOAL-${templateYear}-${String(runningNo).padStart(3, '0')}`;

                                                        await new Promise((res, rej) => {
                                                            connection.query(
                                                                `
                                                                UPDATE template_goals
                                                                SET tg_goal_generated_id = ?
                                                                WHERE tg_pid = ?
                                                                `,
                                                                [goalGeneratedId, goals[i].tg_pid],
                                                                err => err ? rej(err) : res()
                                                            );
                                                        });
                                                    }

                                                    resolve({ result: updatedResult, success: true });

                                                } catch (e) {
                                                    reject({ error: e, success: false });
                                                }
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            } else {

                query = `
                UPDATE template_assignments
                SET ta_status = ?,
                    ta_modified_at = ?
                WHERE ta_pid = ?
            `;

                params = [
                    updateStatusTemplateAssignData.ta_status,
                    updateStatusTemplateAssignData.ta_modified_at,
                    updateStatusTemplateAssignData.ta_pid
                ];

                connection.query(query, params, (error, result) => {
                    if (error) {
                        console.error('Error in updateStatusTemplateAssign:', error);
                        return reject({ error, success: false });
                    }

                    if (result.affectedRows > 0) {
                        resolve({ result: updateStatusTemplateAssignData, success: true });
                    } else {
                        reject({
                            error: new Error('updateStatusTemplateAssign could not be updated.'),
                            success: false
                        });
                    }
                });
            }
        });
    }

    static addNewTemplateReviews(connection, addNewTemplateReviewsData) {
        return new Promise((resolve, reject) => {
            // console.log(addNewTemplateReviewsData, "addNewTemplateReviewsData");
            const query = `
                INSERT INTO template_reviews 
                (tr_assignment_id,tr_template_id, tr_reviewer_id, tr_review_status, tr_review_date, tr_comments, tr_modified_at, tr_created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?,?)
            `;
            const params = [
                addNewTemplateReviewsData?.tr_assignment_id,
                addNewTemplateReviewsData?.tr_template_id,
                addNewTemplateReviewsData?.tr_reviewer_id,
                addNewTemplateReviewsData?.tr_review_status,
                addNewTemplateReviewsData?.tr_review_date,
                addNewTemplateReviewsData?.tr_comments,
                addNewTemplateReviewsData?.tr_created_at,
                addNewTemplateReviewsData?.tr_modified_at
            ];
            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error('Error in addNewTemplateReviews:', error);
                    return reject({ error, success: false });
                }
                if (result.affectedRows > 0) {
                    resolve({ result: result, success: true });
                }
                else {
                    reject({ error: new Error('addNewTemplateReviews could not be updated.'), success: false });
                }
            });
        });
    }

    static findGoalColumnsReviewerById(connection, goalViewAssignId) {
        return new Promise((resolve, reject) => {
            const query = `
               SELECT
                tg.tg_pid,
                tg.tg_assignment_id,
                tg.tg_template_id,
                tg.tg_category_id,
                tg.tg_goal_generated_id,
                tg.tg_goal_owner,
                tg.tg_goal_weightage,
                tg.tg_timeline,
                tg.tg_priority,
                tg.tg_status,
                tg.tg_order,
                tg.tg_created_at,
                tg.tg_modified_at,
                tg.tg_is_delete,
                
                tgd.tgd_pid,
                tgd.tgd_goal_id,
                tgd.tgd_column_id,
                tgd.tgd_value,
                
                tcl.column_pid,
                tcl.column_name,
                tcl.column_type


            FROM template_goals tg

            LEFT JOIN template_goal_data tgd
            ON tgd.tgd_goal_id = tg.tg_pid

            LEFT JOIN template_columns tcl
            ON tcl.column_pid = tgd.tgd_column_id

            WHERE tg.tg_assignment_id = ? AND tcl.column_is_delete = 'Active'
            `;
            connection.query(query, [goalViewAssignId], (error, result) => {
                if (error) {
                    console.error('Error in getGoalColumnsReviewerById:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static getGoalDetailsForEmailSend(connection, templateAssignId) {

        return new Promise((resolve, reject) => {
            const query = `
               SELECT
                tm.template_pid,
                tm.template_name,
                tm.template_year,
                tm.template_description,
                tm.template_status,

                ta.ta_pid,
                ta.ta_generated_id,
                ta.ta_status,
                ta.ta_assigned_to_user_id,
                ta.ta_assigned_position,
                ta.ta_reviewer_eid,
                ta.ta_due_date,

                tc.tc_pid,
                tc.tc_category_id,
                cl.category_name,
                tc.tc_max_weightage,
                tc.tc_category_description,
                tc.tc_kpi_metric,
                tc.tc_target,
                tc.tc_order,

                tg.tg_pid,
                tg.tg_goal_generated_id,
                tg.tg_goal_weightage,
                tg.tg_timeline,
                tg.tg_priority,
                tg.tg_status,

                rl.emp_name as rl_emp_name,
                rl.employee_id as rl_emp_id,
                rl.mail_id as rl_mail_id,
                al.emp_name as al_emp_name,
                al.employee_id as al_emp_id,
                al.mail_id as al_mail_id,
                ol.emp_name as ol_emp_name,
                ol.employee_id as ol_emp_id,
                ol.mail_id as ol_mail_id


            FROM template_assignments ta

            JOIN templates_master tm
                ON tm.template_pid = ta.ta_template_id
                AND tm.template_is_delete = 'Active'

            LEFT JOIN template_categories tc
                ON tc.tc_template_id = tm.template_pid
                AND tc.tc_is_delete = 'Active'

            LEFT JOIN categories_list cl
                ON cl.category_pid = tc.tc_category_id
                AND cl.category_is_delete = 'Active'

            LEFT JOIN template_goals tg
                ON tg.tg_assignment_id = ta.ta_pid
                AND tg.tg_category_id = tc.tc_category_id
                AND tg.tg_is_delete = 'Active'

            LEFT JOIN employee_personal as rl ON rl.employee_id = ta.ta_reviewer_eid

            LEFT JOIN employee_personal as al ON al.employee_id = ta.ta_assigned_by_user_id

            LEFT JOIN employee_personal as ol ON ol.employee_id = ta.ta_assigned_to_user_id

            WHERE ta.ta_pid = ? AND ta.is_delete = 'Active'

            GROUP BY
                tm.template_pid,
                ta.ta_pid,
                tc.tc_pid,
                tg.tg_pid
            ORDER BY ta.ta_pid DESC
            `;
            connection.query(query, [templateAssignId], (error, result) => {
                if (error) {
                    console.error('Error in getGoalDetailsForEmailSend:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static findAllGoalTemplatesById(connection, goalReviewerID) {
        const goalReviewerId = goalReviewerID;
        return new Promise((resolve, reject) => {
            let whereClause = '';
            // let whereClause = "ta.ta_reviewer_eid = ? AND tm.template_is_delete = 'Active' AND ta.is_delete = 'Active'";
            // if (goalReviewerId === '1400') {
            //     whereClause = `
            //         ta.ta_reviewer_eid = ?
            //         AND tm.template_is_delete = 'Active'
            //         AND ta.is_delete = 'Active'
            //         AND ta.ta_status IN ('Under_Review', 'Need_More_Information_Reviewer','Modify_Correction_Reviewer','Approve_Reviewer','Submitted','Assigned','In_Progress')
            //         `;
            // } else {
                whereClause = `
                    ta.ta_pid = ?
                    AND tm.template_is_delete = 'Active'
                    AND ta.is_delete = 'Active'
                    AND ta.ta_status IN ('Under_Review', 'Need_More_Information_Reviewer','Modify_Correction_Reviewer','Approve_Reviewer','Need_More_Information_Super_Admin','Modify_Correction_Super_Admin','Submitted','Assigned','In_Progress')
                    `;
            // }

            let params = [];

            if (goalReviewerId && goalReviewerId != '') {
                params.push(goalReviewerId);
            }
            else {
                console.log('Reviewer Id is missing or empty')
            }


            const query = `
                SELECT 
                    tm.template_pid,
                    tm.template_name,
                    tm.template_year,
                    tm.template_created_date,
                    tm.template_status,
                    tm.template_created_by,
                    tm.template_modified_at,
                    tm.template_is_delete,
                    ta.ta_pid,
                    ta.ta_template_id,
                    ta.ta_assigned_to_user_id,
                    ta.ta_assigned_position,
                    ta.ta_assigned_by_user_id,
                    ta.ta_assigned_date,
                    ta.ta_due_date,
                    ta.ta_generated_id,
                    ta.ta_reviewer_eid,
                    ta.ta_email_sent,
                    ta.ta_email_sent_date,
                    ta.ta_status,
                    ta.ta_created_at,
                    ta.ta_modified_at,
                    reviewer.employee_id AS reviewer_employee_id,
                    reviewer.emp_name AS reviewer_employee_name,
                    assignee.employee_id AS assign_employee_id,
                    assignee.emp_name AS assign_employee_name
                    FROM template_assignments ta
                    LEFT JOIN templates_master tm ON tm.template_pid = ta.ta_template_id
                    LEFT JOIN employee_personal as reviewer ON reviewer.employee_id = ta.ta_reviewer_eid
                    LEFT JOIN employee_personal as assignee ON assignee.employee_id = ta.ta_assigned_to_user_id
                    WHERE ${whereClause}
                    GROUP BY ta.ta_pid, tm.template_pid
                    ORDER BY 
                        CASE ta.ta_status
                        WHEN 'Approve_Reviewer' THEN 1
                        WHEN 'Modify_Correction_Reviewer' THEN 2
                        WHEN 'Need_More_Information_Reviewer' THEN 3
                        WHEN 'Under_Review' THEN 4
                        WHEN 'Submitted' THEN 5
                        WHEN 'Assigned' THEN 6
                        ELSE 7
                        END,
                        ta.ta_modified_at DESC
                    `;
            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error('Error in findAllGoalTemplatesById:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

}

export default GoalReviewerModel;