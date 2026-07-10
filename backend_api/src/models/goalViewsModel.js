
class GoalViewsModel {

    static findAllGoalViewsByUser(connection, filteredDetails) {
        const { userId, tempId, status } = filteredDetails;        
        
        return new Promise((resolve, reject) => {
            let whereClause = "tm.template_is_delete = 'Active' AND ta.is_delete = 'Active' AND ta.ta_template_id = ?";
            let params = [tempId];

            if (userId && userId !== '12345' && userId !== '1400') {
                whereClause += " AND ta.ta_assigned_to_user_id = ?";
                params.push(userId);
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

                    mu.mu_pid,
                    mu.mu_goal_id,
                    mu.mu_month,
                    mu.mu_year,
                    mu.mu_status,
                    mu.mu_completed_weightage,
                    mu.mu_monthly_notes,
                    

                    reviewer.employee_id AS reviewer_employee_id,
                    reviewer.emp_name AS reviewer_employee_name,

                    assignee.employee_id AS assign_employee_id,
                    assignee.emp_name AS assign_employee_name

                FROM template_assignments ta

                LEFT JOIN templates_master tm
                    ON tm.template_pid = ta.ta_template_id

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
                    
                LEFT JOIN employee_personal as reviewer 
                    ON reviewer.employee_id = ta.ta_reviewer_eid

                LEFT JOIN employee_personal as assignee 
                    ON assignee.employee_id = ta.ta_assigned_to_user_id

                WHERE ${whereClause}
                GROUP BY 
                    ta.ta_pid,
                    tm.template_pid,
                    tc.tc_pid,
                    tg.tg_pid

                ORDER BY 
                    CASE ta.ta_status
                    WHEN 'In_Progress' THEN 1
                    WHEN 'Approved' THEN 2
                    WHEN 'Modify_Correction_Super_Admin' THEN 3
                    WHEN 'Need_More_Information_Super_Admin' THEN 4
                    WHEN 'Approve_Reviewer' THEN 5
                    WHEN 'Modify_Correction_Reviewer' THEN 6
                    WHEN 'Need_More_Information_Reviewer' THEN 7
                    WHEN 'Under_Review' THEN 8
                    WHEN 'Submitted' THEN 9
                    WHEN 'Assigned' THEN 10
                    ELSE 11
                    END,
                    ta.ta_modified_at DESC
                `;
            connection.query(query, params.length ? params : undefined, (error, result) => {
                if (error) {
                    console.error('Error in findAllGoalViewsByUser:', error);
                    return reject({ error, success: false });
                }

                resolve({ result, success: true });
            });
        });
    }

    static findGoalViewById(connection, goalViewId) {
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
            tg.sub_task_name,
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
            
            sgr.sbr_pid,
            sgr.sbr_subgoal_id,
            sgr.sbr_assignment_id,
            sgr.sbr_template_id,
            sgr.sbr_reviewer_id,
            sgr.sbr_review_status,
            sgr.sbr_comments,
            sgr.sbr_is_active,
            

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

        LEFT JOIN sub_goal_reviews AS sgr
            ON sgr.sbr_pid = (
                SELECT MAX(s2.sbr_pid)
                FROM sub_goal_reviews s2
                WHERE s2.sbr_subgoal_id = tg.tg_pid
                AND s2.sbr_is_active = 'Active'
            )

        LEFT JOIN employee_personal as rl ON rl.employee_id = ta.ta_reviewer_eid

        LEFT JOIN employee_personal as al ON al.employee_id = ta.ta_assigned_by_user_id

        LEFT JOIN employee_personal as ol ON ol.employee_id = ta.ta_assigned_to_user_id

        WHERE ta.ta_pid = ? AND ta.is_delete = 'Active'

        GROUP BY
            tm.template_pid,
            ta.ta_pid,
            tc.tc_pid,
            tg.tg_pid
        ORDER BY tc.tc_order ASC, tg.tg_pid ASC
        `;
            connection.query(query, [goalViewId], (error, result) => {
                if (error) {
                    console.error('Error in findGoalViewById:', error);
                    return reject({ error, success: false });
                }

                resolve({ result, success: true });
            });
        });
    }

    static findGoalColumnsById(connection, goalViewAssignId) {
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
                    console.error('Error in findGoalColumnsById:', error);
                    return reject({ error, success: false });
                }

                resolve({ result, success: true });
            });
        });
    }
}

export default GoalViewsModel;