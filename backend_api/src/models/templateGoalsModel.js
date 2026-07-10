// src/models/templateGoalsModel.js
// Updated for assignment-based structure with FIXED responsible members and goal data handling

class TemplateGoals {

    // Get assignment details with template and categories AND DYNAMIC COLUMNS
    static getAssignmentWithCategories = (connection, assignmentId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    ta.ta_pid,
                    ta.ta_generated_id,
                    ta.ta_template_id,
                    ta.ta_assigned_to_user_id,
                    ta.ta_assigned_position,
                    ta.ta_assigned_by_user_id,
                    ta.ta_reviewer_eid,
                    ta.ta_due_date,
                    ta.ta_status,
                    ta.ta_email_sent,
                    ta.ta_assigned_date,
                    tm.template_pid,
                    tm.template_name,
                    tm.template_year,
                    tm.template_description,
                    tm.template_status,
                    owner.employee_id as goal_owner_employee_id,
                    owner.emp_name as goal_owner_name,
                    owner.emp_pos as goal_owner_position,
                    owner.emp_dept as goal_owner_dept,
                    reviewer.employee_id as reviewer_employee_id,
                    reviewer.emp_name as reviewer_name,
                    reviewer.emp_pos as reviewer_position,
                    assigned_by.employee_id as assigned_by_employee_id,
                    assigned_by.emp_name as assigned_by_name
                FROM template_assignments ta
                JOIN templates_master tm ON ta.ta_template_id = tm.template_pid
                JOIN employee_personal owner ON ta.ta_assigned_to_user_id = owner.employee_id
                LEFT JOIN employee_personal reviewer ON ta.ta_reviewer_eid = reviewer.employee_id
                LEFT JOIN employee_personal assigned_by ON ta.ta_assigned_by_user_id = assigned_by.employee_id
                WHERE ta.ta_pid = ?
            `;

            connection.query(query, [assignmentId], (error, assignmentResult) => {
                if (error) {
                    console.error('Error in getAssignmentWithCategories - assignment:', error);
                    return reject({ error, success: false });
                }

                if (assignmentResult.length === 0) {
                    return reject({ error: 'Assignment not found', success: false });
                }

                const assignment = assignmentResult[0];
                console.log('✅ Assignment loaded:', assignment.ta_pid, 'Task ID:', assignment.ta_template_id);

                // Get categories for this template with current weightage per assignment
                const categoriesQuery = `
                    SELECT 
                        tc.tc_pid,
                        tc.tc_category_id as category_pid,
                        cl.category_name,
                        tc.tc_max_weightage,
                        tc.tc_category_description,
                        tc.tc_kpi_metric,
                        tc.tc_target,
                        tc.tc_order,
                        COALESCE(
                            (SELECT SUM(tg.tg_goal_weightage) 
                             FROM template_goals tg 
                             WHERE tg.tg_assignment_id = ? 
                             AND tg.tg_category_id = tc.tc_category_id
                             AND tg.tg_is_delete = 'Active'), 0
                        ) as current_weightage
                    FROM template_categories tc
                    JOIN categories_list cl ON tc.tc_category_id = cl.category_pid
                    WHERE tc.tc_template_id = ?
                    AND tc.tc_is_delete = 'Active'
                    ORDER BY tc.tc_order
                `;

                connection.query(categoriesQuery, [assignmentId, assignment.ta_template_id], (catError, categories) => {
                    if (catError) {
                        console.error('Error in getAssignmentWithCategories - categories:', catError);
                        return reject({ error: catError, success: false });
                    }

                    console.log('✅ Categories loaded:', categories.length);

                    // ✅ CRITICAL: Get DYNAMIC COLUMNS from template_column_mapping
                    const columnsQuery = `
                        SELECT 
                            tcm.tcm_pid,
                            tcm.tcm_template_id,
                            tcm.tcm_column_id,
                            tcm.tcm_is_visible,
                            tcm.tcm_is_required,
                            tcm.tcm_order,
                            tc.column_pid,
                            tc.column_name,
                            tc.column_type,
                            tc.column_data_type,
                            tc.column_is_visible,
                            tc.column_is_required,
                            tc.column_order,
                            tc.column_options,
                            tc.column_validation_rules
                        FROM template_column_mapping tcm
                        JOIN template_columns tc ON tcm.tcm_column_id = tc.column_pid
                        WHERE tcm.tcm_template_id = ?
                        AND tc.column_is_delete = 'Active'
                        ORDER BY tcm.tcm_order
                    `;

                    connection.query(columnsQuery, [assignment.ta_template_id], (colError, columns) => {
                        if (colError) {
                            console.error('Error in getAssignmentWithCategories - columns:', colError);
                            return reject({ error: colError, success: false });
                        }

                        console.log('✅ Template columns loaded:', columns.length);
                        console.log('📋 Column details:', columns.map(c => `${c.column_name} (${c.column_data_type})`).join(', '));

                        assignment.categories = categories;
                        assignment.template_columns = columns; // ✅ THIS IS CRITICAL!

                        resolve({ result: assignment, success: true });
                    });
                });
            });
        });
    };

    // Get department employees for responsible members dropdown
    static getDepartmentEmployees = (connection, assignmentId) => {
        return new Promise((resolve, reject) => {

            const baseQuery = `
            SELECT 
                ep.employee_id,
                ep.emp_dept,
                ep.ReportingManager,
                CASE 
                    WHEN ep.ReportingManager = 1400 
                        THEN 'Senior Manager'
                    ELSE 'Assistant Manager'
                END AS role_type
            FROM template_assignments ta
            INNER JOIN employee_personal ep 
                ON ep.employee_id = ta.ta_assigned_to_user_id
            WHERE ta.ta_pid = ?
            AND ep.emp_resign = '12/31/2030'
            LIMIT 1;
        `;

            connection.query(baseQuery, [assignmentId], (error, baseResult) => {
                if (error) {
                    console.error('Error getting base data:', error);
                    return reject({ error, success: false });
                }

                if (!baseResult || baseResult.length === 0) {
                    return resolve({ result: [], success: true });
                }

                const employee = baseResult[0];
                const { role_type, employee_id, emp_dept, ReportingManager } = employee;

                let employeesQuery = '';
                let params = [];

                if (role_type === 'Senior Manager') {

                    employeesQuery = `
                    SELECT 
                        emp_id,
                        employee_id,
                        emp_name,
                        emp_pos,
                        emp_dept,
                        mail_id,
                        ReportingManager
                    FROM employee_personal
                    WHERE ReportingManager = ?
                    AND emp_resign = '12/31/2030'
                    ORDER BY emp_name ASC;
                `;

                    params = [employee_id];

                }

                else {

                    employeesQuery = `
                    SELECT 
                        emp_id,
                        employee_id,
                        emp_name,
                        emp_pos,
                        emp_dept,
                        mail_id,
                        ReportingManager
                    FROM employee_personal
                    WHERE emp_dept = ?
                    AND ReportingManager = ?
                    AND emp_resign = '12/31/2030'
                    ORDER BY emp_name ASC;
                `;

                    params = [emp_dept, ReportingManager];
                }

                connection.query(employeesQuery, params, (empError, employees) => {
                    if (empError) {
                        console.error('Error getting employees:', empError);
                        return reject({ error: empError, success: false });
                    }

                    resolve({ result: employees, success: true });
                });

            });
        });
    };

    // Get template columns for dynamic fields
    static getTemplateColumns = (connection, templateId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    column_pid,
                    column_name,
                    column_type,
                    column_order,
                    is_required
                FROM template_columns
                WHERE template_id = ?
                AND column_is_delete = 'Active'
                ORDER BY column_order ASC
            `;

            connection.query(query, [templateId], (error, columns) => {
                if (error) {
                    console.error('Error getting template columns:', error);
                    return reject({ error, success: false });
                }

                resolve({ result: columns, success: true });
            });
        });
    };

    // Get existing goals for an assignment WITH employee names and responsible members
    static getGoalsByAssignment = (connection, assignmentId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    tg.*,
                    cl.category_name,
                    owner.emp_name as goal_owner_name,
                    owner.employee_id as goal_owner_employee_id,
                    owner.emp_pos as goal_owner_position,
                    ta.ta_generated_id as assignment_generated_id
                FROM template_goals tg
                JOIN template_assignments ta ON tg.tg_assignment_id = ta.ta_pid
                LEFT JOIN categories_list cl ON tg.tg_category_id = cl.category_pid
                LEFT JOIN employee_personal owner ON owner.employee_id = tg.tg_goal_owner
                WHERE tg.tg_assignment_id = ?
                AND tg.tg_is_delete = 'Active'
                ORDER BY tg.tg_category_id, tg.tg_order
            `;

            connection.query(query, [assignmentId], (error, goals) => {
                if (error) {
                    console.error('Error in getGoalsByAssignment:', error);
                    return reject({ error, success: false });
                }

                // Get responsible members for each goal
                if (goals.length > 0) {
                    const goalIds = goals.map(g => g.tg_pid);
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

                    connection.query(membersQuery, [goalIds], (memError, members) => {
                        if (memError) {
                            console.error('Error getting responsible members:', memError);
                            return resolve({ result: goals, success: true });
                        }

                        // Group members by goal
                        const membersByGoal = members.reduce((acc, member) => {
                            if (!acc[member.grm_goal_id]) {
                                acc[member.grm_goal_id] = [];
                            }
                            acc[member.grm_goal_id].push(member);
                            return acc;
                        }, {});

                        // Add members to goals
                        goals.forEach(goal => {
                            goal.responsible_members = membersByGoal[goal.tg_pid] || [];
                            goal.responsible_members_names = goal.responsible_members
                                .map(m => `${m.emp_name} (${m.employee_id})`)
                                .join(', ');
                        });

                        // Get goal data for each goal
                        const goalDataQuery = `
                            SELECT 
                                tgd.*,
                                tc.column_name,
                                tc.column_type
                            FROM template_goal_data tgd
                            JOIN template_columns tc ON tgd.tgd_column_id = tc.column_pid
                            WHERE tgd.tgd_goal_id IN (?) and tc.column_is_delete = 'Active'
                            ORDER BY tc.column_order
                        `;

                        connection.query(goalDataQuery, [goalIds], (dataError, goalData) => {
                            if (dataError) {
                                console.error('Error getting goal data:', dataError);
                                return resolve({ result: goals, success: true });
                            }

                            // Group goal data by goal
                            const dataByGoal = goalData.reduce((acc, data) => {
                                if (!acc[data.tgd_goal_id]) {
                                    acc[data.tgd_goal_id] = [];
                                }
                                acc[data.tgd_goal_id].push(data);
                                return acc;
                            }, {});

                            // Add goal data to goals
                            goals.forEach(goal => {
                                goal.goal_data = dataByGoal[goal.tg_pid] || [];
                            });

                            resolve({ result: goals, success: true });
                        });
                    });
                } else {
                    resolve({ result: goals, success: true });
                }
            });
        });
    };

    // Add a new goal with goal data and responsible members
    static create = (connection, goalData) => {
        return new Promise((resolve, reject) => {
            console.log('Creating goal with data:', goalData);

            const query = `
                INSERT INTO template_goals (
                    tg_assignment_id,
                    tg_template_id,
                    tg_category_id,
                    sub_task_name,
                    tg_goal_owner,
                    tg_goal_weightage,
                    tg_timeline,
                    tg_priority,
                    tg_status,
                    tg_order,
                    tg_is_delete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Not Started', ?, 'Active')
            `;

            const values = [
                goalData.tg_assignment_id,
                goalData.tg_template_id,
                goalData.tg_category_id,
                goalData.sub_task_or_goal_name,
                goalData.tg_goal_owner,
                goalData.tg_goal_weightage,
                goalData.tg_timeline,
                goalData.tg_priority,
                goalData.tg_order || 1,
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in create goal:', error);
                    return reject({ error, success: false });
                }

                const goalId = result.insertId;
                console.log('Goal created with ID:', goalId);

                // Insert goal data (custom fields)
                const insertGoalData = () => {
                    if (goalData.goal_data && goalData.goal_data.length > 0) {
                        console.log('Inserting goal data:', goalData.goal_data);
                        const dataPromises = goalData.goal_data.map(data => {
                            return new Promise((res, rej) => {
                                const dataQuery = `
                                    INSERT INTO template_goal_data (tgd_goal_id, tgd_column_id, tgd_value)
                                    VALUES (?, ?, ?)
                                `;
                                connection.query(dataQuery, [goalId, data.column_id, data.value], (err, result) => {
                                    if (err) {
                                        console.error('Error inserting goal data:', err);
                                        return rej(err);
                                    }
                                    console.log('Goal data inserted:', result.insertId);
                                    res();
                                });
                            });
                        });
                        return Promise.all(dataPromises);
                    }
                    return Promise.resolve();
                };

                // Insert responsible members
                const insertResponsibleMembers = () => {
                    if (goalData.responsible_members && goalData.responsible_members.length > 0) {
                        console.log('Inserting responsible members:', goalData.responsible_members);
                        const memberPromises = goalData.responsible_members.map(empId => {
                            return new Promise((res, rej) => {
                                const memberQuery = `
                                    INSERT INTO goal_responsible_members 
                                    (grm_goal_id, grm_employee_id, grm_role, grm_is_active)
                                    VALUES (?, ?, 'Contributor', 1)
                                `;
                                connection.query(memberQuery, [goalId, empId], (err, result) => {
                                    if (err) {
                                        console.error('Error inserting responsible member:', err);
                                        return rej(err);
                                    }
                                    console.log('Responsible member inserted:', empId);
                                    res();
                                });
                            });
                        });
                        return Promise.all(memberPromises);
                    }
                    return Promise.resolve();
                };

                // Execute insertions and fetch new goal
                insertGoalData()
                    .then(() => {
                        console.log('Goal data inserted successfully');
                        return insertResponsibleMembers();
                    })
                    .then(() => {
                        console.log('Responsible members inserted successfully');
                        return fetchAndReturnNewGoal(connection, goalId, resolve, reject);
                    })
                    .catch(err => {
                        console.error('Error in create process:', err);
                        reject({ error: err, success: false });
                    });
            });
        });
    };

    // Update a goal - FIXED VERSION
    static update = (connection, goalId, goalUpdates) => {
        return new Promise((resolve, reject) => {
            console.log('Updating goal ID:', goalId);
            console.log('goalUpdatesgoalUpdatesgoalUpdatesgoalUpdatesgoalUpdates:', goalUpdates);

            const query = `
                UPDATE template_goals
                SET 
                    sub_task_name = ?,
                    tg_goal_weightage = ?,
                    tg_timeline = ?,
                    tg_priority = ?,
                    tg_status = ?
                WHERE tg_pid = ?
            `;

            const values = [
                goalUpdates.sub_task_or_goal_name,
                goalUpdates.tg_goal_weightage,
                goalUpdates.tg_timeline,
                goalUpdates.tg_priority,
                goalUpdates.tg_status || 'Not Started',
                goalId
            ];

        const checkQuery_subtask = `SELECT sub_task_name,tg_goal_weightage FROM template_goals WHERE tg_pid = ?`;

        connection.query( checkQuery_subtask, [goalId],(err, existing_subtask) => {
                if (err) {
                    console.error('Error checking goal data:', err);
                    return rej(err);
                }

                if (existing_subtask.length > 0) {
                    if(existing_subtask[0].sub_task_name != goalUpdates.sub_task_or_goal_name){
                        const insertQuery_subtask = `INSERT INTO template_goal_data_history (tgdh_goal_id, tgdh_column_id, tgdh_previous_value,tgdh_current_value,tgdh_created_by) VALUES (?, ?, ?, ?, ?)`;
                        connection.query(insertQuery_subtask, [goalId, 'Sub Task / Sub Goal', existing_subtask[0].sub_task_name,goalUpdates.sub_task_or_goal_name,goalUpdates.tg_goal_owner], (err2) => {
                            if (err2) {
                                console.error('Error inserting goal data:', err2);
                                return rej(err2);
                            }
                            console.log('Goal data inserted for column task:');
                        });
                    }
                    if(existing_subtask[0].tg_goal_weightage != goalUpdates.tg_goal_weightage){
                        const insertQuery_subtask = `INSERT INTO template_goal_data_history (tgdh_goal_id, tgdh_column_id, tgdh_previous_value,tgdh_current_value,tgdh_created_by) VALUES (?, ?, ?, ?, ?)`;
                        connection.query(insertQuery_subtask, [goalId, 'Task Weightage', existing_subtask[0].tg_goal_weightage,goalUpdates.tg_goal_weightage,goalUpdates.tg_goal_owner], (err2) => {
                            if (err2) {
                                console.error('Error inserting goal data:', err2);
                                return rej(err2);
                            }
                            console.log('Goal data inserted for column weightage:');
                        });
                        
                    }
                }
            }
        );

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in update goal:', error);
                    return reject({ error, success: false });
                }

                if (result.affectedRows === 0) {
                    return reject({ error: 'Goal not found', success: false });
                }

                console.log('Goal main fields updated successfully');

                // Update goal data if provided
                const updateGoalData = () => {
                    if (goalUpdates.goal_data && goalUpdates.goal_data.length > 0) {
                        console.log('Updating goal data:', goalUpdates.goal_data);
                        const dataPromises = goalUpdates.goal_data.map(data => {
                            return new Promise((res, rej) => {
                                const checkQuery = `SELECT tgd_pid,tgd_column_id,tgd_value FROM template_goal_data WHERE tgd_goal_id = ? AND tgd_column_id = ?`;
                                connection.query(checkQuery, [goalId, data.column_id], (err, existing) => {
                                    if (err) {
                                        console.error('Error checking goal data:', err);
                                        return rej(err);
                                    }

                                    if (existing.length > 0) {
                                        const updateQuery = `UPDATE template_goal_data SET tgd_value = ? WHERE tgd_goal_id = ? AND tgd_column_id = ?`;
                                        connection.query(updateQuery, [data.value, goalId, data.column_id], (err2) => {
                                            if (err2) {
                                                console.error('Error updating goal data:', err2);
                                                return rej(err2);
                                            }
                                            console.log('Goal data updated for column:', data.column_id);
                                            res();
                                        });

                                        if(existing[0].tgd_value != data.value && existing[0].tgd_column_id == data.column_id){

                                             const insertQuery_subtask = `INSERT INTO template_goal_data_history (tgdh_goal_id, tgdh_column_id, tgdh_previous_value,tgdh_current_value,tgdh_created_by) VALUES (?, ?, ?, ?, ?)`;
                                            connection.query(insertQuery_subtask, [goalId, data.column_id, existing[0].tgd_value,data.value,goalUpdates.tg_goal_owner], (err2) => {
                                                if (err2) {
                                                    console.error('Error inserting goal data:', err2);
                                                    return rej(err2);
                                                }
                                                console.log('Goal data inserted for column weightage:');
                                            });

                                        }

                                    } else {
                                        const insertQuery = `INSERT INTO template_goal_data (tgd_goal_id, tgd_column_id, tgd_value) VALUES (?, ?, ?)`;
                                        connection.query(insertQuery, [goalId, data.column_id, data.value], (err2) => {
                                            if (err2) {
                                                console.error('Error inserting goal data:', err2);
                                                return rej(err2);
                                            }
                                            console.log('Goal data inserted for column:', data.column_id);
                                            res();
                                        });
                                    }
                                });
                            });
                        });
                        return Promise.all(dataPromises);
                    }
                    return Promise.resolve();
                };

                // Update responsible members - FIXED VERSION
                const updateResponsibleMembers = () => {
                    return new Promise((res, rej) => {
                        console.log('Updating responsible members for goal:', goalId);
                        console.log('New member list:', goalUpdates.responsible_members);

                        // First, deactivate ALL existing members
                        const deactivateQuery = `
                            UPDATE goal_responsible_members 
                            SET grm_is_active = 0 
                            WHERE grm_goal_id = ?
                        `;

                        connection.query(deactivateQuery, [goalId], (err, deactivateResult) => {
                            if (err) {
                                console.error('Error deactivating members:', err);
                                return rej(err);
                            }
                            console.log('Deactivated members count:', deactivateResult.affectedRows);

                           

                            // If no new members, we're done
                            if (!goalUpdates.responsible_members || goalUpdates.responsible_members.length === 0) {
                                console.log('No new members to add - all members deactivated');
                                return res();
                            }

                            const unselect_memberPromises = goalUpdates.unselect_responsible_members.map(empId => {
                                const insertQuery_subtask = `INSERT INTO template_goal_data_history (tgdh_goal_id, tgdh_emp_id, tgdh_created_by) VALUES (?, ?, ?)`;
                                connection.query(insertQuery_subtask, [goalId, empId,goalUpdates.tg_goal_owner], (err2) => {
                                    if (err2) {
                                        console.error('Error inserting goal data:', err2);
                                        return rej(err2);
                                    }
                                    console.log('Goal data inserted for column weightage:');
                                });
                            });
                             Promise.all(unselect_memberPromises)
                                .then(() => {
                                    console.log('All members updated successfully');
                                    res();
                                })
                                .catch(err => {
                                    console.error('Error in member promises:', err);
                                    rej(err);
                                });
                            // Now insert or reactivate members
                            const memberPromises = goalUpdates.responsible_members.map(empId => {
                                return new Promise((memberRes, memberRej) => {
                                    console.log('Processing member:', empId);

                                    // Check if this member already exists (even if inactive)
                                    const checkQuery = `
                                        SELECT grm_pid 
                                        FROM goal_responsible_members 
                                        WHERE grm_goal_id = ? AND grm_employee_id = ?
                                    `;

                                    connection.query(checkQuery, [goalId, empId], (checkErr, existing) => {
                                        if (checkErr) {
                                            console.error('Error checking member:', checkErr);
                                            return memberRej(checkErr);
                                        }

                                        if (existing.length > 0) {
                                            // Member exists, reactivate it
                                            console.log('Reactivating existing member:', empId, 'with grm_pid:', existing[0].grm_pid);
                                            const reactivateQuery = `
                                                UPDATE goal_responsible_members 
                                                SET grm_is_active = 1 
                                                WHERE grm_pid = ?
                                            `;
                                            connection.query(reactivateQuery, [existing[0].grm_pid], (upErr, upResult) => {
                                                if (upErr) {
                                                    console.error('Error reactivating member:', upErr);
                                                    return memberRej(upErr);
                                                }
                                                console.log('Member reactivated successfully:', empId, 'Affected rows:', upResult.affectedRows);
                                                memberRes();
                                            });
                                        } else {
                                            // New member, insert it
                                            console.log('Inserting new member:', empId);
                                            const insertQuery = `
                                                INSERT INTO goal_responsible_members 
                                                (grm_goal_id, grm_employee_id, grm_role, grm_is_active)
                                                VALUES (?, ?, 'Contributor', 1)
                                            `;
                                            connection.query(insertQuery, [goalId, empId], (insErr, insResult) => {
                                                if (insErr) {
                                                    console.error('Error inserting member:', insErr);
                                                    return memberRej(insErr);
                                                }
                                                console.log('Member inserted successfully:', empId, 'Insert ID:', insResult.insertId);
                                                memberRes();
                                            });
                                        }
                                    });
                                });
                            });

                            Promise.all(memberPromises)
                                .then(() => {
                                    console.log('All members updated successfully');
                                    res();
                                })
                                .catch(err => {
                                    console.error('Error in member promises:', err);
                                    rej(err);
                                });
                        });
                    });
                };

                // Execute updates sequentially
                updateGoalData()
                    .then(() => {
                        console.log('Goal data updated');
                        // Only update members if the field is provided
                        if (goalUpdates.responsible_members !== undefined) {
                            return updateResponsibleMembers();
                        }
                        return Promise.resolve();
                    })
                    .then(() => {
                        console.log('Goal updated successfully - all operations complete');
                        resolve({ message: 'Goal updated successfully', success: true });
                    })
                    .catch(err => {
                        console.error('Error in update process:', err);
                        reject({ error: err, success: false });
                    });
            });
        });
    };

    // Soft delete a goal
    static softDelete = (connection, goalId) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE template_goals
                SET tg_is_delete = 'In Active'
                WHERE tg_pid = ?
            `;

            connection.query(query, [goalId], (error, result) => {
                if (error) {
                    console.error('Error in softDelete goal:', error);
                    return reject({ error, success: false });
                }

                if (result.affectedRows === 0) {
                    return reject({ error: 'Goal not found', success: false });
                }

                resolve({
                    removedGoal: {
                        tg_pid: goalId,
                        tg_is_delete: 'In Active'
                    },
                    success: true
                });
            });
        });
    };

    // Validate category weightage for an assignment
    static validateCategoryWeightage = (connection, assignmentId, categoryId, newWeightage, excludeGoalId = null) => {
        return new Promise((resolve, reject) => {
            let query = `
            SELECT 
                tc.tc_max_weightage,
                COALESCE(SUM(tg.tg_goal_weightage), 0) as current_total
            FROM template_categories tc
            JOIN template_assignments ta ON tc.tc_template_id = ta.ta_template_id
            LEFT JOIN template_goals tg ON tc.tc_category_id = tg.tg_category_id 
                AND tg.tg_assignment_id = ta.ta_pid
                AND tg.tg_is_delete = 'Active'
        `;

            const params = [assignmentId, categoryId];

            if (excludeGoalId) {
                query += ' AND tg.tg_pid != ?';
                params.push(excludeGoalId);
            }

            query += ` WHERE ta.ta_pid = ? AND tc.tc_category_id = ?
                   GROUP BY tc.tc_category_id, tc.tc_max_weightage`;

            // ✅ FIX: Add BOTH parameters in correct order
            params.push(assignmentId);  // For: ta.ta_pid = ?
            params.push(categoryId);     // For: tc.tc_category_id = ?

            // ✅ ADD CONSOLE LOG TO DEBUG
            console.log('🔍 validateCategoryWeightage params:', {
                assignmentId,
                categoryId,
                newWeightage,
                excludeGoalId,
                paramsArray: params
            });

            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error('❌ Query error in validateCategoryWeightage:', error);
                    return reject({ error, success: false });
                }

                console.log('📊 Query result:', result);

                if (result.length === 0) {
                    console.error('❌ No results found - Category not found in template');
                    console.error('   Assignment ID:', assignmentId);
                    console.error('   Category ID:', categoryId);
                    return reject({ error: 'Category not found in template', success: false });
                }

                const { tc_max_weightage, current_total } = result[0];
                const totalAfterAdd = parseFloat(current_total) + parseFloat(newWeightage);

                if (totalAfterAdd > tc_max_weightage) {
                    return reject({
                        error: `Total weightage (${totalAfterAdd}%) exceeds maximum (${tc_max_weightage}%). Current: ${current_total}%, Adding: ${newWeightage}%`,
                        success: false,
                        validation: false
                    });
                }

                resolve({
                    valid: true,
                    max_weightage: tc_max_weightage,
                    current_total: current_total,
                    remaining: tc_max_weightage - totalAfterAdd,
                    success: true
                });
            });
        });
    };

    // Submit assignment for review
    static submitForReview = (connection, assignmentId) => {
        return new Promise((resolve, reject) => {
            // Get assignment and template details
            const getAssignmentQuery = `
                SELECT ta.ta_template_id, ta.ta_status, ta.ta_assigned_to_user_id,ta_reviewer_eid
                FROM template_assignments ta 
                WHERE ta.ta_pid = ?
            `;

            connection.query(getAssignmentQuery, [assignmentId], (err, assignmentData) => {
                if (err || assignmentData.length === 0) {
                    return reject({ error: 'Assignment not found', success: false });
                }

                const templateId = assignmentData[0].ta_template_id;
                const currentStatus = assignmentData[0].ta_status;

                // Check if assignment can be submitted
                const validStatuses = ['Assigned', 'Viewed', 'In_Progress', 'Submitted', 'Need_More_Information_Reviewer'];
                if (!validStatuses.includes(currentStatus)) {
                    return reject({
                        error: `Cannot submit assignment in status: ${currentStatus}`,
                        success: false
                    });
                }

                // Check if all categories have at least one goal and correct weightage
                const checkQuery = `
                    SELECT 
                        tc.tc_category_id,
                        cl.category_name,
                        tc.tc_max_weightage,
                        COUNT(tg.tg_pid) as goal_count,
                        COALESCE(SUM(tg.tg_goal_weightage), 0) as total_weightage
                    FROM template_categories tc
                    LEFT JOIN categories_list cl ON tc.tc_category_id = cl.category_pid
                    LEFT JOIN template_goals tg ON tc.tc_category_id = tg.tg_category_id 
                        AND tg.tg_assignment_id = ?
                        AND tg.tg_is_delete = 'Active'
                    WHERE tc.tc_template_id = ?
                    AND tc.tc_is_delete = 'Active'
                    GROUP BY tc.tc_category_id, cl.category_name, tc.tc_max_weightage
                `;

                connection.query(checkQuery, [assignmentId, templateId], (error, categories) => {
                    if (error) {
                        console.error('Error in submitForReview check:', error);
                        return reject({ error, success: false });
                    }

                    // Validation
                    const errors = [];
                    categories.forEach(cat => {
                        if (cat.goal_count === 0) {
                            errors.push(`Category "${cat.category_name}" must have at least one goal`);
                        }
                        const totalWeight = parseFloat(cat.total_weightage);
                        const maxWeight = parseFloat(cat.tc_max_weightage);
                        if (Math.abs(totalWeight - maxWeight) > 0.01) {
                            errors.push(`Category "${cat.category_name}" weightage (${totalWeight}%) must equal max weightage (${maxWeight}%)`);
                        }
                    });

                    if (errors.length > 0) {
                        return reject({
                            error: errors.join('; '),
                            success: false,
                            validation: false
                        });
                    }

                    // Update assignment status to Submitted
                    const updateQuery = `
                        UPDATE template_assignments
                        SET ta_status = 'Under_Review'
                        WHERE ta_pid = ?
                    `;

                    connection.query(updateQuery, [assignmentId], (updateError, result) => {
                        if (updateError) {
                            console.error('Error in submitForReview update:', updateError);
                            return reject({ error: updateError, success: false });
                        }

                        const insertReviewsQuery = `
                            INSERT INTO template_reviews 
                            (tr_assignment_id, tr_template_id, tr_reviewer_id, tr_review_status, tr_review_date, tr_comments, tr_modified_at, tr_created_at
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        const params = [
                            assignmentId, // assignmentId
                            templateId, // templateId
                            assignmentData[0].ta_assigned_to_user_id, // user id
                            'Under_Review', // reviewStatus
                            new Date(), // reviewDate
                            'Submitted for review', // comments
                            new Date(), // modifiedAt
                            new Date() // createdAt
                        ];


                        connection.query(insertReviewsQuery, params, (reviewError) => {
                            if (reviewError) {
                                console.error('Error in submitForReview reviews:', reviewError);
                                return reject({ error: reviewError, success: false });
                            }
                        });


                        // Insert audit log
                        const auditQuery = `
                            INSERT INTO audit_log 
                            (audit_table, audit_record_id, audit_action, audit_user_id, audit_old_value, audit_new_value)
                            VALUES ('template_assignments', ?, 'Under_Review', ?, ?, ?)
                        `;

                        connection.query(auditQuery, [
                            assignmentId,
                            assignmentData[0].ta_assigned_to_user_id,
                            currentStatus,
                            'Under_Review'
                        ], (auditError) => {
                            if (auditError) {
                                console.error('Error creating audit log:', auditError);
                            }

                            resolve({
                                message: 'Goals submitted for review successfully',
                                success: true
                            });
                        });
                    });
                });
            });
        });
    };

    // Save as draft (update status to In_Progress)
    static saveAsDraft = (connection, assignmentId) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE template_assignments
                SET ta_status = 'In_Progress'
                WHERE ta_pid = ?
            `;

            connection.query(query, [assignmentId], (error, result) => {
                if (error) {
                    console.error('Error in saveAsDraft:', error);
                    return reject({ error, success: false });
                }

                resolve({
                    message: 'Goals saved as draft successfully',
                    success: true
                });
            });
        });
    };

    static updateAssignmentStatus = (connection, assignmentStatusData) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE template_assignments
                SET ta_status = ?
                WHERE ta_pid = ?
            `;
            const values = [assignmentStatusData.ta_status, assignmentStatusData.ta_pid];
            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in updateAssignmentStatus:', error);
                    return reject({ error, success: false });
                }
                resolve({
                    result: result,
                    success: true
                });
            });
        });
    };

    static createTemplateReviewsHistory = (connection, templateReviewsHistoryData) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO template_reviews 
                (tr_assignment_id,tr_template_id, tr_reviewer_id, tr_review_status, tr_review_date, tr_comments
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [
                templateReviewsHistoryData?.tr_assignment_id,
                templateReviewsHistoryData?.tr_template_id,
                templateReviewsHistoryData?.tr_reviewer_id,
                templateReviewsHistoryData?.tr_review_status,
                templateReviewsHistoryData?.tr_review_date,
                templateReviewsHistoryData?.tr_comments
            ];
            connection.query(query, params, (error, result) => {
                if (error) {
                    console.error('Error in createTemplateReviewsHistory:', error);
                    return reject({ error, success: false });
                }
                resolve({
                    result: result,
                    success: true
                });
            });
        });
    };

    static updateBulkGoalReviewerStatus = (connection, reviewerId, tgPidList, reviewStatus, isSuperAdmin = false) => {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(tgPidList) || tgPidList.length === 0) {
                return reject({ error: new Error('No tg_pid values provided'), success: false });
            }

            const updateField = isSuperAdmin ? 'tg_super_admin_status' : 'tg_reviewer_status';
            const query = `
                UPDATE template_goals
                SET ${updateField} = ?,
                    tg_sub_goal_status = ?
                WHERE tg_pid IN (?)
            `;

            connection.query(query, [reviewerId, reviewStatus, tgPidList], (error, result) => {
                if (error) {
                    console.error('Error in updateBulkGoalReviewerStatus:', error);
                    return reject({ error, success: false });
                }
                const updatedResult = {
                    tg_pid: tgPidList,
                    reviewerId: reviewerId,
                    reviewStatus: reviewStatus,
                    updateField: updateField
                }

                resolve({ result: updatedResult, success: true, affectedRows: result.affectedRows });
            });
        });
    };


}

// Helper function to fetch newly created goal with all details
function fetchAndReturnNewGoal(connection, goalId, resolve, reject) {
    const getNewGoalQuery = `
        SELECT 
            tg.*,
            cl.category_name,
            owner.emp_name as goal_owner_name,
            owner.employee_id as goal_owner_employee_id,
            owner.emp_pos as goal_owner_position,
            ta.ta_generated_id as assignment_generated_id
        FROM template_goals tg
        JOIN template_assignments ta ON tg.tg_assignment_id = ta.ta_pid
        LEFT JOIN categories_list cl ON tg.tg_category_id = cl.category_pid
        LEFT JOIN employee_personal owner ON owner.employee_id = tg.tg_goal_owner
        WHERE tg.tg_pid = ?
    `;

    connection.query(getNewGoalQuery, [goalId], (err, newGoal) => {
        if (err) {
            console.error('Error fetching new goal:', err);
            return reject({ error: err, success: false });
        }

        if (newGoal.length === 0) {
            return reject({ error: 'Goal created but not found', success: false });
        }

        // Get responsible members
        const membersQuery = `
            SELECT 
                grm.grm_employee_id,
                grm.grm_role,
                ep.emp_name,
                ep.employee_id,
                ep.emp_pos
            FROM goal_responsible_members grm
            JOIN employee_personal ep ON grm.grm_employee_id = ep.employee_id
            WHERE grm.grm_goal_id = ?
            AND grm.grm_is_active = 1
        `;

        connection.query(membersQuery, [goalId], (memErr, members) => {
            if (memErr) {
                console.error('Error fetching members:', memErr);
            }

            newGoal[0].responsible_members = members || [];
            newGoal[0].responsible_members_names = members
                ? members.map(m => `${m.emp_name} (${m.employee_id})`).join(', ')
                : '';

            // Get goal data
            const dataQuery = `
                SELECT 
                    tgd.*,
                    tc.column_name,
                    tc.column_type
                FROM template_goal_data tgd
                JOIN template_columns tc ON tgd.tgd_column_id = tc.column_pid
                WHERE tgd.tgd_goal_id = ? and tc.column_is_delete = 'Active'
                
            `;

            connection.query(dataQuery, [goalId], (dataErr, goalData) => {
                if (dataErr) {
                    console.error('Error fetching goal data:', dataErr);
                }

                newGoal[0].goal_data = goalData || [];

                resolve({
                    newGoal: newGoal[0],
                    success: true
                });
            });
        });
    });
}

export { TemplateGoals };