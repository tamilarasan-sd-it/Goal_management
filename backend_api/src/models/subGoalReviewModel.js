class SubGoalReviewModel {

    static findAllBysubGoal(connection) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    sbr.sbr_pid,
                    sbr.sbr_subgoal_id,
                    sbr.sbr_assignment_id,
                    sbr.sbr_template_id,
                    sbr.sbr_reviewer_id,
                    sbr.sbr_review_status,
                    sbr.sbr_comments,
                    sbr.sbr_created_at,
                    sbr.sbr_modified_at,
                    sbr.sbr_is_active
                FROM sub_goal_reviews sbr
                WHERE sbr.sbr_is_active = 'Active'
                ORDER BY sbr.sbr_pid DESC
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in findAllBysubGoal:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static findAllSubGoalsBySubGoalId(connection, subGoalAssignmentId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                sbr.sbr_pid,
                sbr.sbr_subgoal_id,
                sbr.sbr_assignment_id,
                sbr.sbr_template_id,
                sbr.sbr_reviewer_id,
                sbr.sbr_review_status,
                sbr.sbr_comments,
                sbr.sbr_created_at,
                sbr.sbr_modified_at,
                sbr.sbr_is_active,
                tg.tg_pid,
                tg.tg_assignment_id,
                tg.sub_task_name,
                tg.tg_is_delete,
                emp.employee_id,
                emp.emp_name,
                NULL AS tgdh_column_id,
                NULL AS tgdh_previous_value,
                NULL AS tgdh_current_value,
                NULL AS tgdh_emp_id,
                NULL AS tgdh_emp_name,
                NULL AS column_name,
                NULL AS tgdh_created_at,
                NULL AS tgdh_goal_id,
                NULL AS tgdh_emp_name_by
            FROM sub_goal_reviews sbr
            LEFT JOIN template_goals tg
                ON tg.tg_pid = sbr.sbr_subgoal_id
            LEFT JOIN employee_personal emp
                ON emp.employee_id = sbr.sbr_reviewer_id
            WHERE tg.tg_is_delete = 'Active'
            AND sbr.sbr_subgoal_id = ?
            AND sbr.sbr_is_active = 'Active'

            UNION ALL

            SELECT
                NULL AS sbr_pid,
                tgdh.tgdh_goal_id AS sbr_subgoal_id,
                NULL AS sbr_assignment_id,
                NULL AS sbr_template_id,
                NULL AS sbr_reviewer_id,
                NULL AS sbr_review_status,
                NULL AS sbr_comments,
                tgdh.tgdh_created_at AS sbr_created_at,
                NULL AS sbr_modified_at,
                NULL AS sbr_is_active,
                NULL AS tg_pid,
                NULL AS tg_assignment_id,
                NULL AS sub_task_name,
                NULL AS tg_is_delete,
                NULL AS employee_id,
                NULL AS emp_name,
                tgdh.tgdh_column_id,
                tgdh.tgdh_previous_value,
                tgdh.tgdh_current_value,    
                tgdh.tgdh_emp_id,
                tgdh_emp.emp_name as tgdh_emp_name,
                tgdh_col.column_name,
                tgdh.tgdh_created_at,
                tgdh.tgdh_goal_id,
                tgdh_emp_by.emp_name as tgdh_emp_name_by
            FROM template_goal_data_history tgdh
            LEFT JOIN employee_personal tgdh_emp
                ON tgdh_emp.employee_id = tgdh.tgdh_emp_id
            LEFT JOIN template_columns tgdh_col
                ON tgdh_col.column_pid = tgdh.tgdh_column_id
            LEFT JOIN employee_personal tgdh_emp_by
                ON tgdh_emp_by.employee_id = tgdh.tgdh_created_by    

            WHERE tgdh.tgdh_goal_id = ?

            ORDER BY sbr_created_at DESC;
            `;
            // console.log("Query:", query);
            // console.log("Parameters:", [subGoalAssignmentId]);
            connection.query(query, [subGoalAssignmentId,subGoalAssignmentId], (error, result) => {
                if (error) {
                    console.error('Error in findAllSubGoalsBySubGoalId:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static findAllByAssignmentId(connection, assignmentId) {
        return new Promise((resolve, reject) => {
            const query = `
                 SELECT
                ta.ta_pid,
                ta.ta_status,
                ta.ta_assigned_to_user_id,
                ta.ta_reviewer_eid,
                
                tg.tg_pid,
                tg.tg_status,
                
                sgr.sbr_pid,
                sgr.sbr_subgoal_id,
                sgr.sbr_assignment_id,
                sgr.sbr_template_id,
                sgr.sbr_reviewer_id,
                sgr.sbr_review_status,
                sgr.sbr_is_active

            FROM template_assignments ta

            LEFT JOIN template_goals tg
                ON tg.tg_assignment_id = ta.ta_pid
                AND tg.tg_is_delete = 'Active'

            LEFT JOIN sub_goal_reviews AS sgr
                ON sgr.sbr_pid = (
                    SELECT MAX(s2.sbr_pid)
                    FROM sub_goal_reviews s2
                    WHERE s2.sbr_subgoal_id = tg.tg_pid
                    AND s2.sbr_is_active = 'Active'
                )

            WHERE ta.is_delete = 'Active'
        AND sgr.sbr_assignment_id = ?
            GROUP BY
                ta.ta_pid,
                tg.tg_pid
            `;
            connection.query(query, [assignmentId], (error, result) => {
                if (error) {
                    console.error('Error in findAllByAssignmentId:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static findAllSubGoalsByReviewerId(connection) {
        return new Promise((resolve, reject) => {
            const query = `
            SELECT
            ta.ta_pid,
            ta.ta_status,
            ta.ta_assigned_to_user_id,
            ta.ta_reviewer_eid,
            
            tg.tg_pid,
            tg.tg_status,
            
            sgr.sbr_pid,
            sgr.sbr_subgoal_id,
            sgr.sbr_assignment_id,
            sgr.sbr_template_id,
            sgr.sbr_reviewer_id,
            sgr.sbr_review_status,
            sgr.sbr_is_active

        FROM template_assignments ta

        LEFT JOIN template_goals tg
            ON tg.tg_assignment_id = ta.ta_pid
            AND tg.tg_is_delete = 'Active'

        LEFT JOIN sub_goal_reviews AS sgr
            ON sgr.sbr_pid = (
                SELECT MAX(s2.sbr_pid)
                FROM sub_goal_reviews s2
                WHERE s2.sbr_subgoal_id = tg.tg_pid
                AND s2.sbr_is_active = 'Active'
            )

        WHERE ta.is_delete = 'Active'

        GROUP BY
            ta.ta_pid,
            tg.tg_pid
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in findAllSubGoalsByReviewerId:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static addNewSubGoalReviews(connection, addNewSubGoalReviewsData) {
        return new Promise((resolve, reject) => {

            if (!Array.isArray(addNewSubGoalReviewsData) || addNewSubGoalReviewsData.length === 0) {
                return reject({ error: new Error('Invalid data array'), success: false });
            }

            const query = `
                INSERT INTO sub_goal_reviews
                (
                    sbr_subgoal_id,
                    sbr_assignment_id,
                    sbr_template_id,
                    sbr_reviewer_id,
                    sbr_review_status,
                    sbr_comments,
                    sbr_is_active
                )
                VALUES ?
            `;

            const values = addNewSubGoalReviewsData.map(item => [
                item.sbr_subgoal_id,
                item.sbr_assignment_id,
                item.sbr_template_id,
                item.sbr_reviewer_id,
                item.sbr_review_status,
                item.sbr_comments,
                item.sbr_is_active || 'Active'
            ]);

            connection.query(query, [values], (error, result) => {
                if (error) {
                    console.error('Error in addNewSubGoalReviews:', error);
                    return reject({ error, success: false });
                }

                if (result.affectedRows > 0) {
                    resolve({ result, success: true });
                } else {
                    reject({
                        error: new Error('No rows inserted'),
                        success: false
                    });
                }
            });
        });
    }

}

export default SubGoalReviewModel;