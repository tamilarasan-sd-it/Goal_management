class DashboardModel {

    static findAll(connection) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    (
                       SELECT COUNT(*)
                        FROM templates_master
                        WHERE template_is_delete = 'Active' AND template_status = 'Finalized'
                    ) AS total_templates,

                    (
                       SELECT COUNT(*)
                        FROM template_assignments
                        WHERE is_delete = 'Active'
                    ) AS active_assignments,

                    (
                        SELECT COUNT(*)
                        FROM template_reviews
                        WHERE tr_review_status = 'Pending' and tr_is_active = 'Active'
                    ) AS pending_reviews,

                    (
                        SELECT COUNT(*)
                        FROM template_goals
                        WHERE tg_is_delete = 'Active'
                    ) AS total_goals,

                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_status = 'Assigned' AND is_delete = 'Active'
                    ) AS assigned_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Goals_Pending' AND is_delete = 'Active'
                    ) AS goals_pending_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_status = 'In_Progress' AND is_delete = 'Active'
                    ) AS in_progress_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Submitted' AND is_delete = 'Active'
                    ) AS submitted_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Under_Review' AND is_delete = 'Active'
                    ) AS under_review_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_status = 'Need_More_Information_Reviewer' AND is_delete = 'Active'
                    ) AS need_more_information_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Approved' AND is_delete = 'Active'
                    ) AS approved_assignments,
                    
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Rejected' AND is_delete = 'Active'
                    ) AS rejected_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_status = 'Approve_Reviewer' AND is_delete = 'Active'
                    ) AS approve_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Modify_Correction_Reviewer' AND is_delete = 'Active'
                    ) AS modify_correction_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE  ta_status = 'Need_More_Information_Super_Admin' AND is_delete = 'Active'
                    ) AS need_more_information_super_admin_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_status = 'Modify_Correction_Super_Admin' AND is_delete = 'Active'
                    ) AS modify_correction_super_admin_count,
                     (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_status = 'completed' AND is_delete = 'Active'
                    ) AS completed_count
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in get dashboard model:', error);
                    return reject({ error, success: false });
                }

                resolve({ result, success: true });
            });
        });
    }

    //  Assigned DASHBOARD
    static getAssignedOwnerDashboard(connection, AssignedOwnerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_assigned_to_user_id = ? AND is_delete = 'Active'
                    ) AS total_assignments,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE ta_reviewer_eid = ? AND is_delete = 'Active'
                    ) AS pending_reviews,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Assigned' AND is_delete = 'Active'
                    ) AS assigned_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Goals_Pending' AND is_delete = 'Active'
                    ) AS goals_pending_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'In_Progress' AND is_delete = 'Active'
                    ) AS in_progress_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Submitted' AND is_delete = 'Active'
                    ) AS submitted_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Under_Review' AND is_delete = 'Active'
                    ) AS under_review_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Need_More_Information_Reviewer' AND is_delete = 'Active'
                    ) AS need_more_information_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Approved' AND is_delete = 'Active'
                    ) AS approved_assignments,
                   
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Rejected' AND is_delete = 'Active'
                    ) AS rejected_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Approve_Reviewer' AND is_delete = 'Active'
                    ) AS approve_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Modify_Correction_Reviewer' AND is_delete = 'Active'
                    ) AS modify_correction_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Need_More_Information_Super_Admin' AND is_delete = 'Active'
                    ) AS need_more_information_super_admin_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'Modify_Correction_Super_Admin' AND is_delete = 'Active'
                    ) AS modify_correction_super_admin_count,
                      (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_assigned_to_user_id = ?) AND ta_status = 'completed' AND is_delete = 'Active'
                    ) AS completed_count,
                    (
                        SELECT COUNT(*)
                        FROM template_goals
                        WHERE tg_goal_owner = ?
                        AND tg_is_delete = 'Active'
                    ) AS total_goals
            `;

            const params = [
                AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId, AssignedOwnerId,
                AssignedOwnerId,
            ];

            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error("Error in get Assigned Owner Dashboard  model:", error);
                    return reject(error);
                }

                resolve({ success: true, result });
            });
        });
    }

    // REVIEWER DASHBOARD
    static getReviewerDashboard(connection, reviewerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_reviewer_eid = ?) AND ta_status = 'Under_Review' AND is_delete = 'Active'
                    ) AS under_review_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_reviewer_eid = ?) AND ta_status = 'Need_More_Information_Reviewer' AND is_delete = 'Active'
                    ) AS need_more_information_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_reviewer_eid = ?) AND ta_status = 'Approve_Reviewer' AND is_delete = 'Active'
                    ) AS approve_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_assignments
                        WHERE (ta_reviewer_eid = ?) AND ta_status = 'Modify_Correction_Reviewer' AND is_delete = 'Active'
                    ) AS modify_correction_reviewer_count,
                    (
                        SELECT COUNT(*)
                        FROM template_goals
                        WHERE tg_goal_owner = ?
                        AND tg_is_delete = 'Active'
                    ) AS total_goals
            `;
            const params = [
                reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId, reviewerId,
                reviewerId,
            ];

            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error("Error in reviewer dashboard model:", error);
                    return reject(error);
                }

                resolve({ success: true, result });
            });
        });
    }

    // CATEGORY COUNTS
static getCategoryCounts(connection) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM categories_list
                ) AS total_category_count,

                (
                    SELECT COUNT(*)
                    FROM categories_list
                    WHERE category_is_delete = 'Active'
                ) AS active_category_count,

                (
                    SELECT COUNT(*)
                    FROM template_columns
                ) AS total_columns_count,

                (
                    SELECT COUNT(*)
                    FROM template_columns
                    WHERE column_is_delete = 'Active'
                ) AS active_columns_count,

                 (
                    SELECT COUNT(*)
                    FROM templates_master
                ) AS total_templates_count,

                (
                    SELECT COUNT(*)
                    FROM templates_master
                    WHERE template_is_delete = 'Active'
                ) AS active_templates_count
        `;

        connection.query(query, (error, result) => {
            if (error) {
                console.error("Error in getCategoryCounts model:", error);
                return reject(error);
            }

            resolve({ success: true, result });
        });
    });
}




}

export { DashboardModel };
