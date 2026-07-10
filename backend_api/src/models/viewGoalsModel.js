// src/models/viewGoalsModel.js
// View Goals Model - Employee ID based authentication
// Super Admin (employee_id = '12345'): sees ALL goals
// Goal Owner (any other ID): sees only tg_goal_owner = their emp_id

class ViewGoals {

    // ========================================================================
    // GET GOALS — role-based + filters
    // ========================================================================
    static getGoalsByRole = (connection, userRole, userId, filters = {}) => {
        return new Promise((resolve, reject) => {

            let query = `
        SELECT
            tg.tg_pid,
            tg.tg_assignment_id,
            tg.tg_template_id,
            tg.tg_category_id,
            tg.tg_goal_owner,
            tg.tg_goal_generated_id,
            tg.tg_goal_weightage,
            tg.tg_timeline,
            tg.tg_priority,
            tg.tg_status,
            tg.tg_order,
            tg.tg_created_at,
            tg.sub_task_name,

            -- Category
            cl.category_name,

            -- Template
            tm.template_pid,
            tm.template_name,
            tm.template_year,

            -- Assignment
            ta.ta_pid,
            ta.ta_generated_id,
            ta.ta_status AS assignment_status,
            ta.ta_due_date,

            -- Goal Owner
            owner.employee_id AS goal_owner_employee_id,
            owner.emp_name AS goal_owner_name,
            owner.emp_pos AS goal_owner_position,
            owner.emp_dept AS goal_owner_department,
            owner.mail_id AS goal_owner_email,

            -- Reviewer
            reviewer.emp_name AS reviewer_name,

            -- Current month's update
            mu.mu_pid AS current_mu_pid,
            mu.mu_status AS current_mu_status,
            mu.mu_completed_weightage AS progress_percentage,
            mu.mu_updated_at AS current_mu_updated_at,
            mu.mu_is_locked AS current_mu_locked,

            -- Update count
            COALESCE(
                (SELECT COUNT(*)
                 FROM monthly_updates mu2
                 WHERE mu2.mu_goal_id = tg.tg_pid
                ), 0
            ) AS update_count

        FROM template_goals tg

        JOIN template_assignments ta ON tg.tg_assignment_id = ta.ta_pid
        JOIN templates_master tm ON tg.tg_template_id = tm.template_pid
        LEFT JOIN categories_list cl ON tg.tg_category_id = cl.category_pid
        LEFT JOIN employee_personal owner ON tg.tg_goal_owner = owner.employee_id
        LEFT JOIN employee_personal reviewer ON ta.ta_reviewer_eid = reviewer.employee_id
        LEFT JOIN monthly_updates mu ON mu.mu_goal_id = tg.tg_pid
            AND mu.mu_month = MONTH(CURDATE())
            AND mu.mu_year = YEAR(CURDATE())

        WHERE tg.tg_is_delete = 'Active'
        AND ta.is_delete = 'Active'
        `;

            const params = [];

            // ============================================================
            // ROLE-BASED BASE FILTER
            // ============================================================
            if (userRole === 'Super Admin') {
                console.log('🔓 Super Admin: viewing all goals');
            } else {
                query += ` AND tg.tg_goal_owner = ?`;
                params.push(userId);
                console.log('👤 Goal Owner: viewing own goals');
            }

            // ============================================================
            // FILTERS (Super Admin only for goalOwner/department)
            // ============================================================
            if (userRole === 'Super Admin') {
                if (filters.goalOwner) {
                    query += ` AND tg.tg_goal_owner = ?`;
                    params.push(filters.goalOwner);
                }
                if (filters.department) {
                    query += ` AND owner.emp_dept = ?`;
                    params.push(filters.department);
                }
            }

            // Common filters
            const filterYear = filters.year || new Date().getFullYear();
            query += ` AND tm.template_year = ?`;
            params.push(filterYear);

            if (filters.templateId) {
                query += ` AND tg.tg_template_id = ?`;
                params.push(filters.templateId);
            }
            if (filters.categoryId) {
                query += ` AND tg.tg_category_id = ?`;
                params.push(filters.categoryId);
            }
            if (filters.status) {
                query += ` AND tg.tg_status = ?`;
                params.push(filters.status);
            }
            if (filters.priority) {
                query += ` AND tg.tg_priority = ?`;
                params.push(filters.priority);
            }
            if (filters.timeline) {
                query += ` AND tg.tg_timeline = ?`;
                params.push(filters.timeline);
            }
            if (filters.assignmentStatus) {
                query += ` AND ta.ta_status = ?`;
                params.push(filters.assignmentStatus);
            }

            // Search
            if (filters.searchKeyword) {
                query += `
                AND (
                    EXISTS (
                        SELECT 1 FROM template_goal_data tgd
                        WHERE tgd.tgd_goal_id = tg.tg_pid
                          AND tgd.tgd_value LIKE ?
                    )
                    OR owner.emp_name LIKE ?
                    OR tm.template_name LIKE ?
                )
            `;
                const kw = `%${filters.searchKeyword}%`;
                params.push(kw, kw, kw);
            }

            // ORDER BY with proper NULL handling
            query += `
            ORDER BY 
                CASE COALESCE(mu.mu_status, 'not started')
                    WHEN 'completed' THEN 1
                    WHEN 'in progress' THEN 2
                    WHEN 'blocked' THEN 3
                    WHEN 'not started' THEN 4
                    ELSE 5
                END,
                
                mu.mu_updated_at DESC
        `;

            connection.query(query, params, (error, goals) => {
                if (error) {
                    console.error('❌ getGoalsByRole error:', error);
                    return reject({ error, success: false });
                }

                console.log(`✅ Retrieved ${goals.length} goals`);

                if (goals.length === 0) {
                    return resolve({ result: [], success: true });
                }

                const goalIds = goals.map(g => g.tg_pid);

                const goalDataQuery = `
                SELECT
                    tgd.tgd_pid,
                    tgd.tgd_goal_id,
                    tgd.tgd_column_id,
                    tgd.tgd_value,
                    tc.column_pid,
                    tc.column_name,
                    tc.column_type,
                    tc.column_data_type,
                    tc.column_order
                FROM template_goal_data tgd
                JOIN template_columns tc ON tgd.tgd_column_id = tc.column_pid
                WHERE tgd.tgd_goal_id IN (?) 
                  AND tc.column_is_delete = 'Active'
                ORDER BY tc.column_order
            `;

                connection.query(goalDataQuery, [goalIds], (dataErr, goalData) => {
                    if (dataErr) {
                        console.error('⚠️ goal_data fetch failed:', dataErr);
                    }

                    const membersQuery = `
                    SELECT
                        grm.grm_goal_id,
                        grm.grm_employee_id,
                        grm.grm_role,
                        ep.emp_name,
                        ep.employee_id,
                        ep.emp_pos
                    FROM goal_responsible_members grm
                    JOIN employee_personal ep ON grm.grm_employee_id = ep.employee_id
                    WHERE grm.grm_goal_id IN (?)
                      AND grm.grm_is_active = 1
                    ORDER BY ep.emp_name
                `;

                    connection.query(membersQuery, [goalIds], (memErr, members) => {
                        if (memErr) {
                            console.error('⚠️ members fetch failed:', memErr);
                        }

                        const dataByGoal = {};
                        const memberByGoal = {};

                        (goalData || []).forEach(d => {
                            (dataByGoal[d.tgd_goal_id] = dataByGoal[d.tgd_goal_id] || []).push(d);
                        });

                        (members || []).forEach(m => {
                            (memberByGoal[m.grm_goal_id] = memberByGoal[m.grm_goal_id] || []).push(m);
                        });

                        goals.forEach(goal => {
                            goal.goal_data = dataByGoal[goal.tg_pid] || [];
                            goal.responsible_members = memberByGoal[goal.tg_pid] || [];
                            goal.responsible_members_names =
                                goal.responsible_members.map(m => m.emp_name).join(', ');
                        });

                        resolve({ result: goals, success: true });
                    });
                });
            });
        });
    };


    // ========================================================================
    // FILTER OPTIONS
    // ========================================================================
    static getFilterOptions = (connection, userRole, userId) => {
        return new Promise((resolve, reject) => {

            const queries = {
                goalOwners: `
                    SELECT DISTINCT
                        ep.employee_id,
                        ep.emp_name,
                        ep.emp_pos,
                        ep.emp_dept
                    FROM employee_personal ep
                    INNER JOIN template_goals tg ON ep.employee_id = tg.tg_goal_owner
                    WHERE tg.tg_is_delete = 'Active'
                    ORDER BY ep.emp_name
                `,
                departments: `
                    SELECT DISTINCT ep.emp_dept
                    FROM employee_personal ep
                    INNER JOIN template_goals tg ON ep.employee_id = tg.tg_goal_owner
                    WHERE tg.tg_is_delete = 'Active'
                    ORDER BY ep.emp_dept
                `,
                templates: `
                    SELECT DISTINCT
                        tm.template_pid,
                        tm.template_name,
                        tm.template_year
                    FROM templates_master tm
                    INNER JOIN template_goals tg ON tm.template_pid = tg.tg_template_id
                    WHERE tg.tg_is_delete = 'Active'
                      AND tm.template_is_delete = 'Active'
                    ORDER BY tm.template_year DESC, tm.template_name
                `,
                categories: `
                    SELECT DISTINCT
                        cl.category_pid,
                        cl.category_name
                    FROM categories_list cl
                    INNER JOIN template_goals tg ON cl.category_pid = tg.tg_category_id
                    WHERE tg.tg_is_delete = 'Active'
                      AND cl.category_is_delete = 'Active'
                    ORDER BY cl.category_name
                `,
                years: `
                    SELECT DISTINCT tm.template_year
                    FROM templates_master tm
                    INNER JOIN template_goals tg ON tm.template_pid = tg.tg_template_id
                    WHERE tg.tg_is_delete = 'Active'
                    ORDER BY tm.template_year DESC
                `
            };

            const results = {};
            const run = Object.keys(queries).map(key =>
                new Promise(res => {
                    connection.query(queries[key], (err, data) => {
                        results[key] = err ? [] : data;
                        if (err) console.error(`⚠️ filter ${key}:`, err);
                        res();
                    });
                })
            );

            Promise.all(run).then(() => resolve({ result: results, success: true }));
        });
    };

    // ========================================================================
    // SINGLE GOAL DETAIL
    // ========================================================================
    static getGoalById = (connection, goalId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    tg.*,
                    cl.category_name,
                    tm.template_pid,
                    tm.template_name,
                    tm.template_year,
                    ta.ta_generated_id,
                    ta.ta_status AS assignment_status,
                    ta.ta_due_date,

                    owner.employee_id AS goal_owner_employee_id,
                    owner.emp_name AS goal_owner_name,
                    owner.emp_pos AS goal_owner_position,
                    owner.emp_dept AS goal_owner_department,
                    owner.mail_id AS goal_owner_email,

                    reviewer.emp_name AS reviewer_name,
                    reviewer.emp_pos AS reviewer_position
                FROM template_goals tg
                JOIN template_assignments ta ON tg.tg_assignment_id = ta.ta_pid
                JOIN templates_master tm ON tg.tg_template_id = tm.template_pid
                LEFT JOIN categories_list cl ON tg.tg_category_id = cl.category_pid
                LEFT JOIN employee_personal owner ON tg.tg_goal_owner = owner.employee_id
                LEFT JOIN employee_personal reviewer ON ta.ta_reviewer_eid = reviewer.employee_id
                WHERE tg.tg_pid = ?
                  AND tg.tg_is_delete = 'Active'
            `;

            connection.query(query, [goalId], (error, rows) => {
                if (error) return reject({ error, success: false });
                if (rows.length === 0) return reject({ error: 'Goal not found', success: false });

                const goal = rows[0];

                // goal_data
                const dataQ = `
                    SELECT tgd.*, tc.column_name, tc.column_type, tc.column_data_type, tc.column_order
                    FROM template_goal_data tgd
                    JOIN template_columns tc ON tgd.tgd_column_id = tc.column_pid
                    WHERE tgd.tgd_goal_id = ? and tc.column_is_delete = 'Active'
                    ORDER BY tc.column_order
                `;
                connection.query(dataQ, [goalId], (dErr, goalData) => {
                    // responsible members
                    const memQ = `
                        SELECT grm.*, ep.emp_name, ep.employee_id, ep.emp_pos
                        FROM goal_responsible_members grm
                        JOIN employee_personal ep ON grm.grm_employee_id = ep.employee_id
                        WHERE grm.grm_goal_id = ? AND grm.grm_is_active = 1
                    `;
                    connection.query(memQ, [goalId], (mErr, members) => {
                        // monthly updates
                        const muQ = `
                            SELECT
                                mu.*,
                                ep.emp_name AS updater_name
                            FROM monthly_updates mu
                            LEFT JOIN employee_personal ep ON mu.mu_updated_by = ep.employee_id
                            WHERE mu.mu_goal_id = ?
                            ORDER BY mu.mu_year DESC, mu.mu_month DESC
                        `;
                        connection.query(muQ, [goalId], (uErr, updates) => {
                            goal.goal_data = goalData || [];
                            goal.responsible_members = members || [];
                            goal.monthly_updates = updates || [];
                            resolve({ result: goal, success: true });
                        });
                    });
                });
            });
        });
    };

    // ========================================================================
    // SUMMARY STATS
    // ========================================================================
    static getSummaryStats = (connection, userRole, userId) => {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT
                    COUNT(DISTINCT tg.tg_pid) AS total_goals,
                    COUNT(DISTINCT CASE WHEN tg.tg_status = 'Completed' THEN tg.tg_pid END) AS completed_goals,
                    COUNT(DISTINCT CASE WHEN tg.tg_status = 'In Progress' THEN tg.tg_pid END) AS in_progress_goals,
                    COUNT(DISTINCT CASE WHEN tg.tg_status = 'Not Started' THEN tg.tg_pid END) AS not_started_goals,
                    COUNT(DISTINCT CASE WHEN tg.tg_status = 'Partially Completed' THEN tg.tg_pid END) AS Partially_Completed,
                    COUNT(DISTINCT CASE WHEN tg.tg_status = 'Blocked' THEN tg.tg_pid END) AS blocked_goals,
                    COUNT(DISTINCT tg.tg_goal_owner) AS total_employees
                FROM template_goals tg
                LEFT JOIN employee_personal owner ON tg.tg_goal_owner = owner.employee_id
                WHERE tg.tg_is_delete = 'Active'
                  AND tg.tg_template_id IN (
                        SELECT template_pid FROM templates_master
                        WHERE template_year = YEAR(CURDATE())
                          AND template_is_delete = 'Active'
                      )
            `;
            const params = [];

            if (userRole !== 'Super Admin') {
                query += ` AND tg.tg_goal_owner = ?`;
                params.push(userId);
            }

            connection.query(query, params, (error, results) => {
                if (error) return reject({ error, success: false });
                resolve({ result: results[0], success: true });
            });
        });
    };
}

export { ViewGoals };