
class GoalHistoryModel {

    static findGoalHistoryViewPage(connection, goalViewId) {
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
            ta.ta_assigned_date,

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
            tg.sub_task_name,
            

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

        LEFT JOIN employee_personal as rl ON rl.employee_id = ta.ta_reviewer_eid

        LEFT JOIN employee_personal as al ON al.employee_id = ta.ta_assigned_by_user_id

        LEFT JOIN employee_personal as ol ON ol.employee_id = ta.ta_assigned_to_user_id

        WHERE ta.ta_pid = ?

        GROUP BY
            tm.template_pid,
            ta.ta_pid,
            tc.tc_pid,
            tg.tg_pid;
            `;
            connection.query(query, [goalViewId], (error, result) => {
                if (error) {
                    console.error('Error in findGoalHistoryViewPage:', error);
                    return reject({ error, success: false });
                }

                resolve({ result, success: true });
            });
        });
    }
    static findGoalReviewsTemplateAssignments(connection, assignementId) {
        return new Promise((resolve, reject) => {
            const query = `
            SELECT
            trw.tr_pid,
            trw.tr_assignment_id,
            trw.tr_template_id,
            trw.tr_reviewer_id,
            trw.tr_review_status,
            trw.tr_review_date,
            trw.tr_comments,
            trw.tr_created_at,
            trw.tr_modified_at,
            tm.template_pid,
            tm.template_name,
            emp.emp_name,
            emp.employee_id

            FROM template_reviews trw
            LEFT JOIN employee_personal emp
            ON emp.employee_id = trw.tr_reviewer_id

            LEFT JOIN  template_assignments ta
            ON ta.ta_pid = trw.tr_assignment_id

            LEFT JOIN templates_master tm
            ON tm.template_pid = ta.ta_template_id

            WHERE trw.tr_assignment_id = ? and trw.tr_is_active = 'Active'
            ORDER BY trw.tr_pid DESC
            `;
            connection.query(query, [assignementId], (error, result) => {
                if (error) {
                    console.error('Error in findGoalReviewsTemplateAssignments:', error);
                    return reject({ error, success: false });
                }

                resolve({ result, success: true });
            });
        });

    }

}

export default GoalHistoryModel;
