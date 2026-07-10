// src/models/monthlyUpdatesModel.js
// ✅ UPDATED: Fetches goal_responsible_members (grm_employee_id, grm_role, grm_is_active)
// Complete model for monthly updates functionality

export class MonthlyUpdates {

    // ========================================================================
    // GET EMPLOYEE GOALS WITH MONTHLY UPDATE STATUS
    // ✅ UPDATED: Now includes responsible_members from goal_responsible_members
    // ========================================================================
    static async getEmployeeGoalsWithUpdates(connection, employeeId, month, year) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    tg.tg_pid,
                    tg.tg_assignment_id,
                    tg.tg_category_id,
                    tg.tg_goal_weightage,
                    tg.tg_timeline,
                    tg.tg_priority,
                    tg.tg_status,
                    tg.tg_goal_owner,
                    tg.tg_goal_generated_id,
                    tg.sub_task_name,
                    cl.category_name,
                    tg.tg_template_id,
                    tm.template_name,
                    tm.template_year,

                    -- Monthly update if exists
                    mu.mu_pid,
                    mu.mu_status AS update_status,
                    mu.mu_completed_weightage,
                    mu.mu_monthly_notes,
                    mu.mu_updated_at,
                    mu.mu_is_locked
                FROM template_goals tg
                JOIN categories_list cl ON tg.tg_category_id = cl.category_pid
                JOIN templates_master tm ON tg.tg_template_id = tm.template_pid
                LEFT JOIN monthly_updates mu ON tg.tg_pid = mu.mu_goal_id
                    AND mu.mu_month = ?
                    AND mu.mu_year = ?
                JOIN template_assignments ta ON tg.tg_assignment_id = ta.ta_pid

                WHERE tg.tg_goal_owner = ?
                  AND tg.tg_is_delete = 'Active'
                   AND ta.ta_status IN ('In_Progress')
                ORDER BY 
                CASE mu.mu_status
                    WHEN 'Completed' THEN 1
                    WHEN 'In Progress' THEN 2
                    WHEN 'Blocked' THEN 3
                    WHEN 'Not Started' THEN 4
                    ELSE 5
                END,
                mu.mu_updated_at DESC
                
            `;
            // /monthly-updates

            connection.query(query, [month, year, employeeId], (err, goals) => {
                if (err) {
                    console.error('❌ Error fetching goals:', err);
                    return reject({ error: 'Database error', success: false });
                }

                if (goals.length === 0) {
                    return resolve({ success: true, result: [] });
                }

                const goalIds = goals.map(g => g.tg_pid);

                // ✅ Step 1: Get goal data
                const goalDataQuery = `
                    SELECT
                        tgd.*,
                        tc.column_name,
                        tc.column_type,
                        tc.column_data_type
                    FROM template_goal_data tgd
                    JOIN template_columns tc ON tgd.tgd_column_id = tc.column_pid
                    WHERE tgd.tgd_goal_id IN (?) AND tc.column_is_delete = 'Active'
                    ORDER BY tc.column_order
                `;

                connection.query(goalDataQuery, [goalIds], (dataErr, goalData) => {
                    if (dataErr) {
                        console.error('❌ Error fetching goal data:', dataErr);
                        return reject({ error: 'Database error', success: false });
                    }

                    // ✅ Step 2: Get responsible members from goal_responsible_members
                    const responsibleMembersQuery = `
                        SELECT
                            grm.grm_goal_id,
                            grm.grm_employee_id,
                            grm.grm_role,
                            grm.grm_is_active,
                            ep.emp_name,
                            ep.emp_pos,
                            ep.emp_dept
                        FROM goal_responsible_members grm
                        LEFT JOIN employee_personal ep ON grm.grm_employee_id = ep.employee_id
                        WHERE grm.grm_goal_id IN (?)
                          AND grm.grm_is_active = 1
                        ORDER BY grm.grm_role, ep.emp_name
                    `;

                    connection.query(responsibleMembersQuery, [goalIds], (memberErr, responsibleMembers) => {
                        if (memberErr) {
                            console.error('❌ Error fetching responsible members:', memberErr);
                            // Don't fail the entire request if members aren't found
                        }

                        // ✅ Step 3: Get update data
                        const updateIds = goals.filter(g => g.mu_pid).map(g => g.mu_pid);

                        if (updateIds.length === 0) {
                            // No updates yet - just organize goal data and members
                            const dataByGoal = {};
                            const membersByGoal = {};

                            (goalData || []).forEach(d => {
                                (dataByGoal[d.tgd_goal_id] = dataByGoal[d.tgd_goal_id] || []).push(d);
                            });

                            (responsibleMembers || []).forEach(m => {
                                (membersByGoal[m.grm_goal_id] = membersByGoal[m.grm_goal_id] || []).push(m);
                            });

                            goals.forEach(goal => {
                                goal.goal_data = dataByGoal[goal.tg_pid] || [];
                                goal.update_data = [];
                                goal.responsible_members = membersByGoal[goal.tg_pid] || [];
                            });

                            console.log(`✅ Found ${goals.length} goals for employee ${employeeId} (no updates yet)`);
                            return resolve({ success: true, result: goals });
                        }

                        const updateDataQuery = `
                            SELECT
                                mud.*,
                                tc.column_name,
                                tc.column_type,
                                tc.column_data_type
                            FROM monthly_update_data mud
                            JOIN template_columns tc ON mud.mud_column_id = tc.column_pid
                            WHERE mud.mud_update_id IN (?) and tc.column_is_delete = 'Active'
                            ORDER BY tc.column_order
                        `;

                        connection.query(updateDataQuery, [updateIds], (upErr, updateData) => {
                            if (upErr) {
                                console.error('❌ Error fetching update data:', upErr);
                                return reject({ error: 'Database error', success: false });
                            }

                            // ✅ Organize all data by goal
                            const dataByGoal = {};
                            const updateByUpdate = {};
                            const membersByGoal = {};

                            (goalData || []).forEach(d => {
                                (dataByGoal[d.tgd_goal_id] = dataByGoal[d.tgd_goal_id] || []).push(d);
                            });

                            (updateData || []).forEach(u => {
                                (updateByUpdate[u.mud_update_id] = updateByUpdate[u.mud_update_id] || []).push(u);
                            });

                            (responsibleMembers || []).forEach(m => {
                                (membersByGoal[m.grm_goal_id] = membersByGoal[m.grm_goal_id] || []).push(m);
                            });

                            goals.forEach(goal => {
                                goal.goal_data = dataByGoal[goal.tg_pid] || [];
                                goal.update_data = goal.mu_pid ? (updateByUpdate[goal.mu_pid] || []) : [];
                                goal.responsible_members = membersByGoal[goal.tg_pid] || [];
                            });

                            console.log(`✅ Found ${goals.length} goals for employee ${employeeId} with updates and members`);
                            resolve({ success: true, result: goals });
                        });
                    });
                });
            });
        });
    }

    // ========================================================================
    // SAVE OR UPDATE MONTHLY UPDATE  (entry point)
    // ========================================================================
    static async saveUpdate(connection, updateData) {
        console.log(updateData, "updateData")
        return new Promise((resolve, reject) => {

            const checkQuery = `
            SELECT mu_pid, mu_is_locked
            FROM monthly_updates
            WHERE mu_goal_id = ?
              AND mu_month = ?
              AND mu_year = ?
        `;

            connection.query(
                checkQuery,
                [updateData.mu_goal_id, updateData.mu_month, updateData.mu_year],
                (err, existing) => {
                    if (err) {
                        console.error('❌ Error checking existing update:', err);
                        return reject({ error: 'Database error', success: false });
                    }

                    if (existing.length > 0 && existing[0].mu_is_locked === 1) {
                        return reject({
                            error: 'This month has been submitted and locked.',
                            success: false
                        });
                    }

                    // 🔁 KEEP YOUR EXISTING FLOW
                    const actionPromise = existing.length > 0
                        ? MonthlyUpdates.updateExistingUpdate(
                            connection,
                            existing[0].mu_pid,
                            updateData
                        )
                        : MonthlyUpdates.createNewUpdate(
                            connection,
                            updateData
                        );

                    actionPromise
                        .then(() => {

                            /* ================================
                               1️⃣ Update template_goals.tg_status
                            ================================= */
                            const goalStatusQuery = `
                            UPDATE template_goals
                            SET tg_status = ?
                            WHERE tg_pid = ?
                        `;

                            connection.query(
                                goalStatusQuery,
                                [updateData.mu_status, updateData.mu_goal_id],
                                (goalErr) => {
                                    if (goalErr) {
                                        return reject({ success: false, error: goalErr });
                                    }

                                    /* ================================
                                       2️⃣ Update template_goal_data
                                    ================================= */
                                    const updates = updateData.update_data || [];
                                    if (!updates.length) {
                                        return resolve({ success: true });
                                    }

                                    let completed = 0;

                                    updates.forEach(item => {
                                        const tgdQuery = `
                                        UPDATE template_goal_data
                                        SET tgd_value = ?
                                        WHERE tgd_goal_id = ?
                                          AND tgd_column_id = ?
                                    `;

                                        connection.query(
                                            tgdQuery,
                                            [item.value, updateData.mu_goal_id, item.column_id],
                                            (tgdErr) => {
                                                if (tgdErr) {
                                                    return reject({ success: false, error: tgdErr });
                                                }

                                                completed++;
                                                if (completed === updates.length) {
                                                    resolve({ success: true });
                                                }
                                            }
                                        );
                                    });
                                }
                            );
                        })
                        .catch(reject);
                }
            );
        });
    }




    // ========================================================================
    // CREATE NEW MONTHLY UPDATE
    // ========================================================================
    static async createNewUpdate(connection, updateData) {

        console.log(updateData, "updateDataupdateDataupdateDataupdateDataupdateDataupdateData")
        return new Promise((resolve, reject) => {
            const insertQuery = `
                INSERT INTO monthly_updates (
                    mu_goal_id,
                    mu_month,
                    mu_year,
                    mu_status,
                    mu_monthly_notes,
                    mu_completed_weightage,
                    mu_updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                updateData.mu_goal_id,
                updateData.mu_month,
                updateData.mu_year,
                updateData.mu_status || 'Not Started',
                updateData.mu_monthly_notes,
                updateData.mu_completed_weightage || 0,
                updateData.mu_updated_by,
            ];

            connection.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('❌ Error creating monthly update:', err);
                    return reject({ error: 'Failed to create update', success: false });
                }

                const updateId = result.insertId;
                console.log(`✅ Created monthly update ID: ${updateId}`);

                if (updateData.update_data && updateData.update_data.length > 0) {
                    MonthlyUpdates.saveUpdateData(connection, updateId, updateData.update_data)
                        .then(() => resolve({ success: true, updateId }))
                        .catch(reject);
                } else {
                    resolve({ success: true, updateId });
                }
            });
        });
    }

    // ========================================================================
    // UPDATE EXISTING MONTHLY UPDATE
    // ========================================================================
    static async updateExistingUpdate(connection, updateId, updateData) {
        return new Promise((resolve, reject) => {
            const monthlyNotes = updateData.mu_monthly_notes || '';
            const updateQuery = `
                UPDATE monthly_updates
                SET mu_status = ?,
                    mu_completed_weightage = ?,
                    mu_updated_by = ?,
                    mu_monthly_notes = ?,

                    mu_updated_at = CURRENT_TIMESTAMP
                WHERE mu_pid = ?
            `;

            const values = [
                updateData.mu_status || 'Not Started',
                updateData.mu_completed_weightage || 0,
                updateData.mu_updated_by,
                monthlyNotes,
                updateId
            ];

            connection.query(updateQuery, values, (err) => {
                if (err) {
                    console.error('❌ Error updating monthly update:', err);
                    return reject({ error: 'Failed to update', success: false });
                }

                const deleteQuery = 'DELETE FROM monthly_update_data WHERE mud_update_id = ?';
                connection.query(deleteQuery, [updateId], (err2) => {
                    if (err2) {
                        console.error('❌ Error deleting old data:', err2);
                        return reject({ error: 'Failed to update data', success: false });
                    }

                    if (updateData.update_data && updateData.update_data.length > 0) {
                        MonthlyUpdates.saveUpdateData(connection, updateId, updateData.update_data)
                            .then(() => resolve({ success: true, updateId }))
                            .catch(reject);
                    } else {
                        resolve({ success: true, updateId });
                    }
                });
            });
        });
    }

    // ========================================================================
    // SAVE UPDATE DATA (monthly_update_data rows)
    // ========================================================================
    static async saveUpdateData(connection, updateId, updateDataArray) {
        return new Promise((resolve, reject) => {
            if (!updateDataArray || updateDataArray.length === 0) {
                return resolve({ success: true });
            }

            const insertQuery = `
                INSERT INTO monthly_update_data (
                    mud_update_id,
                    mud_column_id,
                    mud_value
                ) VALUES ?
            `;

            const values = updateDataArray.map(data => [
                updateId,
                data.column_id,
                data.value || ''
            ]);

            connection.query(insertQuery, [values], (err) => {
                if (err) {
                    console.error('❌ Error saving update data:', err);
                    return reject({ error: 'Failed to save data', success: false });
                }

                console.log(`✅ Saved ${values.length} update data entries`);
                resolve({ success: true });
            });
        });
    }

    // ========================================================================
    // SUBMIT AND LOCK ALL UPDATES for an employee + month + year
    // ========================================================================
    static async submitUpdates(connection, employeeId, month, year) {
        return new Promise((resolve, reject) => {
            const lockQuery = `
                UPDATE monthly_updates mu
                JOIN template_goals tg ON mu.mu_goal_id = tg.tg_pid
                SET mu.mu_is_locked = 1
                WHERE tg.tg_goal_owner = ?
                  AND mu.mu_month = ?
                  AND mu.mu_year = ?
            `;

            connection.query(lockQuery, [employeeId, month, year], (err, result) => {
                if (err) {
                    console.error('❌ Error submitting updates:', err);
                    return reject({ error: 'Failed to submit updates', success: false });
                }

                console.log(`✅ Locked ${result.affectedRows} updates`);
                resolve({
                    success: true,
                    message: `Successfully submitted ${result.affectedRows} updates`,
                    lockedCount: result.affectedRows
                });
            });
        });
    }

    // ========================================================================
    // GET ADMIN REPORT
    // ========================================================================
    static async getAdminReport(connection, month, year, department = 'all') {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT
                    ep.employee_id,
                    ep.emp_name,
                    ep.emp_pos,
                    ep.emp_dept AS dept_name,
                    mu.mu_monthly_notes,
                    COUNT(DISTINCT tg.tg_pid) AS total_goals,
                    COUNT(DISTINCT mu.mu_pid) AS updated_goals,
                    SUM(CASE WHEN mu.mu_is_locked = 1 THEN 1 ELSE 0 END) AS submitted_count,
                    MAX(mu.mu_updated_at) AS last_updated,
                    ROUND(
                        COALESCE(
                            AVG(CASE WHEN mu.mu_pid IS NOT NULL THEN mu.mu_completed_weightage ELSE NULL END),
                            0
                        ), 2
                    ) AS avg_completion,
                    CASE
                        WHEN COUNT(DISTINCT tg.tg_pid) > 0
                             AND COUNT(DISTINCT CASE WHEN mu.mu_is_locked = 1 THEN tg.tg_pid END)
                        THEN 'Submitted'
                        WHEN COUNT(DISTINCT mu.mu_pid) > 0
                        THEN 'In Progress'
                        ELSE 'Not Started'
                    END AS status
                FROM employee_personal ep
               JOIN template_goals tg ON ep.employee_id = tg.tg_goal_owner
               JOIN template_assignments ta ON tg.tg_template_id = ta.ta_template_id 
                AND ta.ta_assigned_to_user_id = ep.employee_id
                AND ta.ta_status = 'In_Progress'
                LEFT JOIN monthly_updates mu ON tg.tg_pid = mu.mu_goal_id
                    AND mu.mu_month = ?
                    AND mu.mu_year = ?
                WHERE tg.tg_is_delete = 'Active'
            `;

            const params = [month, year];

            if (department !== 'all') {
                query += ` AND ep.emp_dept = ?`;
                params.push(department);
            }

            query += `
                GROUP BY ep.employee_id, ep.emp_name, ep.emp_pos, ep.emp_dept
                ORDER BY 
                CASE
                    WHEN COUNT(DISTINCT tg.tg_pid) > 0
                         AND COUNT(DISTINCT CASE WHEN mu.mu_is_locked = 1 THEN tg.tg_pid END) = COUNT(DISTINCT tg.tg_pid)
                    THEN 1
                    WHEN COUNT(DISTINCT mu.mu_pid) > 0
                    THEN 2
                    ELSE 3
                END,
                last_updated DESC
            `;

            connection.query(query, params, (err, results) => {
                if (err) {
                    console.error('❌ Error fetching report:', err);
                    return reject({ error: 'Database error', success: false });
                }

                console.log(`✅ Generated report for ${results.length} employees`);
                resolve({ success: true, result: results });
            });
        });
    }

    // ========================================================================
    // GET EMPLOYEE DETAIL (for admin report drill-down)
    // ========================================================================
    static async getEmployeeDetail(connection, employeeId, month, year) {
        return new Promise((resolve, reject) => {
            const goalsQuery = `
                SELECT
                    tg.tg_pid,
                    tg.tg_goal_generated_id,
                    tg.tg_goal_weightage,
                    cl.category_name AS tc_category_name,
                    mu.mu_pid,
                    mu.mu_status,
                    mu.mu_completed_weightage,
                    mu.mu_monthly_notes,
                    mu.mu_updated_at,
                    mu.mu_is_locked
                FROM template_goals tg
                JOIN categories_list cl ON tg.tg_category_id = cl.category_pid
                LEFT JOIN monthly_updates mu ON tg.tg_pid = mu.mu_goal_id
                    AND mu.mu_month = ?
                    AND mu.mu_year = ?
                WHERE tg.tg_goal_owner = ?
                AND tg.tg_is_delete = 'Active'
                ORDER BY 
                    CASE mu.mu_status
                        WHEN 'completed' THEN 1
                        WHEN 'in progress' THEN 2
                        WHEN 'blocked' THEN 3
                        WHEN 'not started' THEN 4
                        ELSE 5
                    END,
                    mu.mu_updated_at DESC,
                    cl.category_name,
                    tg.tg_order
                `;

            connection.query(goalsQuery, [month, year, employeeId], (err, goals) => {
                if (err) {
                    console.error('❌ Error fetching employee goals:', err);
                    return reject({ error: 'Database error', success: false });
                }

                if (goals.length === 0) {
                    return resolve({ success: true, result: [] });
                }

                const goalIds = goals.map(g => g.tg_pid);
                const muIds = goals.filter(g => g.mu_pid).map(g => g.mu_pid);

                const goalDataQ = `
                    SELECT tgd.tgd_goal_id, tc.column_name, tgd.tgd_value AS value
                    FROM template_goal_data tgd
                    JOIN template_columns tc ON tgd.tgd_column_id = tc.column_pid
                    WHERE tgd.tgd_goal_id IN (?) and tc.column_is_delete = 'Active'
                    ORDER BY tc.column_order
                `;

                connection.query(goalDataQ, [goalIds], (dErr, goalDataRows) => {
                    const fetchUpdateData = (cb) => {
                        if (muIds.length === 0) return cb(null, []);
                        const updateDataQ = `
                            SELECT mud.mud_update_id, tc.column_name, mud.mud_value AS value
                            FROM monthly_update_data mud
                            JOIN template_columns tc ON mud.mud_column_id = tc.column_pid
                            WHERE mud.mud_update_id IN (?) and tc.column_is_delete = 'Active'
                            ORDER BY tc.column_order
                        `;
                        connection.query(updateDataQ, [muIds], cb);
                    };

                    fetchUpdateData((uErr, updateDataRows) => {
                        const goalDetailsMap = {};
                        const updateDetailsMap = {};

                        (goalDataRows || []).forEach(row => {
                            (goalDetailsMap[row.tgd_goal_id] = goalDetailsMap[row.tgd_goal_id] || []).push({
                                column_name: row.column_name,
                                value: row.value
                            });
                        });

                        (updateDataRows || []).forEach(row => {
                            (updateDetailsMap[row.mud_update_id] = updateDetailsMap[row.mud_update_id] || []).push({
                                column_name: row.column_name,
                                value: row.value
                            });
                        });

                        goals.forEach(goal => {
                            goal.goal_details = goalDetailsMap[goal.tg_pid] || [];
                            goal.update_details = goal.mu_pid ? (updateDetailsMap[goal.mu_pid] || []) : [];
                        });

                        console.log(`✅ Fetched details for employee ${employeeId}`);
                        resolve({ success: true, result: goals });
                    });
                });
            });
        });
    }
}

export default MonthlyUpdates;