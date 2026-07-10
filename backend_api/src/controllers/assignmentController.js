import connectionPool from "../database/dbConfig.js";
import { AsssignedGoalSendMail } from "../emailUtils/emailTrigger.js";
import { io } from "../index.js";

// Refactored to fetch employee details before creating assignments
const createAssignmentController = async (req, res) => {
    const { page, component, loading } = req.query;
    const assignmentData = req.body;
    console.log(assignmentData, "assignmentData");
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

        const insertPromises = assignmentData.assignments.map(async (assignment) => {
            // Fetch employee details first
            const employeeDetails = await new Promise((resolve, reject) => {
                const getEmployeeQuery = 'SELECT ReportingManager, emp_pos FROM employee_personal WHERE employee_id = ?';
                connection.query(getEmployeeQuery, [assignment.assigned_employee_id], (error, results) => {
                    if (error) return reject(error);
                    if (results.length === 0) return reject(new Error(`Employee not found: ${assignment.assigned_employee_id}`));
                    resolve(results[0]);
                });
            });

            const { ReportingManager, emp_pos } = employeeDetails;



            // Now, insert into template_assignments
            const insertQuery = `INSERT INTO template_assignments
                                (ta_template_id, ta_assigned_to_user_id, ta_assigned_by_user_id, ta_status, ta_reviewer_eid, ta_assigned_position)
                                VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [
                assignmentData.template_pid,
                assignment.assigned_employee_id,
                assignmentData.assigned_by_user_id,
                assignmentData.assignment_status,
                String(ReportingManager),
                emp_pos
            ];


            console.log(values, "values");

            return new Promise((resolve, reject) => {
                connection.query(insertQuery, values, (error, results) => {
                    if (error) {
                        return reject(error);
                    }
                    const insertedId = results.insertId;
                    const insertedTemplateReviewsHistory = {
                        tr_assignment_id: insertedId,
                        tr_template_id: assignmentData.template_pid,
                        tr_reviewer_id: '12345',
                        tr_review_status: assignmentData.assignment_status,
                        tr_review_date: new Date(),
                        tr_comments: null,
                        tr_created_at: new Date(),
                        tr_modified_at: new Date()
                    };
                    const insertHistoryQuery = `
                    INSERT INTO template_reviews 
                    (tr_assignment_id, tr_template_id, tr_reviewer_id, tr_review_status, tr_review_date, tr_comments, tr_modified_at, tr_created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?,?)
                    `;
                    const historyValues = Object.values(insertedTemplateReviewsHistory);

                    connection.query(insertHistoryQuery, historyValues, (historyError, historyResults) => {
                        if (historyError) return reject(historyError);
                        resolve(results);
                    });
                });
            });
        });

        await Promise.all(insertPromises);

        const EmailDetailsForSending = {
            template_pid: assignmentData.template_pid,
            template_name: assignmentData.template_name,
            template_year: assignmentData.template_year,
            assignments: assignmentData.assignments
        }

        const EmailSendingToRespectiveMemebers =  AsssignedGoalSendMail(EmailDetailsForSending);

        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        io.emit('addSocket', { page: page, component: component, loading: loading, success: true, message: 'Assignment created successfully' });
        res.status(201).json({ success: true, message: 'Assignment created successfully' });

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(resolve));
        }
        console.error('Error in createAssignmentController:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateAssignmentController = async (req, res) => {
    const { page, component, loading } = req.query;
    const { assignment_id, assigned_employee_id, assigned_reviewer_id, assigned_employee_name, assigned_reviewer_name } = req.body;
    let data = {
        ta_assigned_to_user_id: assigned_employee_id,
        ta_reviewer_eid: assigned_reviewer_id,
        assigned_employee_name: assigned_employee_name,
        assigned_reviewer_name: assigned_reviewer_name
    }
    console.log(data, "data");
    let connection;

    if (!assignment_id) {
        return res.status(400).json({ success: false, message: 'Assignment ID is required.' });
    }

    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        const updateQuery = `
            UPDATE template_assignments
            SET ta_assigned_to_user_id = ?, ta_reviewer_eid = ?
            WHERE ta_pid = ?;
        `;

        await new Promise((resolve, reject) => {
            connection.query(updateQuery, [assigned_employee_id, assigned_reviewer_id, assignment_id], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        io.emit('updateSocket', { page: page, component: component, loading: loading, idName: 'assignment_id', id: assignment_id, updatedData: data, success: true, message: 'Assignment updated successfully' });
        res.status(200).json({ success: true, message: 'Assignment updated successfully' });

    } catch (error) {
        console.error('Error in updateAssignmentController:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteAssignmentController = async (req, res) => {
    const { page, component, loading } = req.query;
    const { assignment_id } = req.body;
    console.log(assignment_id, req.query, "assignment_id", req.body);
    let connection;

    if (!assignment_id) {
        return res.status(400).json({ success: false, message: 'Assignment ID is required.' });
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

        const deleteQuery = "UPDATE template_assignments SET is_delete = 'In Active' WHERE ta_pid = ?";

        await new Promise((resolve, reject) => {
            connection.query(deleteQuery, [assignment_id], (error, results) => {
                if (error) return reject(error);
                if (results.affectedRows === 0) return reject(new Error('Assignment not found or already deleted.'));
                const deleteTemplateReviewsQuery = "UPDATE template_reviews SET tr_is_active = 'Inactive' WHERE tr_assignment_id = ?";
                connection.query(deleteTemplateReviewsQuery, [assignment_id], (reviewError, reviewResults) => {
                    if (reviewError) return reject(reviewError);
                    resolve();
                });
                resolve(results);
            });
        });

        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        io.emit('deleteSocket', { page: page, component: component, loading: loading, idName: 'assignment_id', id: assignment_id, success: true, message: 'Assignment deleted successfully' });
        res.status(200).json({ success: true, message: 'Assignment deleted successfully' });

    } catch (error) {
        if (connection) await new Promise(resolve => connection.rollback(resolve));
        console.error('Error in deleteAssignmentController:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

const getAssignmentsListController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;

    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        const query = `
           SELECT
                tm.template_pid,
                tm.template_name,
                ta.ta_assigned_date,
                GROUP_CONCAT(DISTINCT emp1.emp_name ORDER BY emp1.emp_name) AS employee_list,
                COUNT(ta.ta_pid) AS total_assignments
            FROM templates_master tm
            LEFT JOIN template_assignments ta
                ON tm.template_pid = ta.ta_template_id
                AND ta.is_delete = 'Active'
            LEFT JOIN employee_personal emp1
                ON ta.ta_assigned_to_user_id = emp1.employee_id
            GROUP BY
                tm.template_pid,
                tm.template_name
            ORDER BY total_assignments DESC;
        `;

        const results = await new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        res.status(200).json({
            success: true,
            page: page,
            component: component,
            loading: loading,
            message: 'Retrieved assignments data successfully',
            result: results
        });

    } catch (error) {
        console.error('Error in getAssignmentsDataController:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getAssignmentsController = async (req, res) => {
    const { page, component, loading, id } = req.query;
    const goalTemplateId = id;
    
    let connection;

    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        const query = `
            SELECT
            ta.ta_pid AS assignment_id,
                ta.ta_assigned_to_user_id,
                ta.ta_template_id,
                tm.template_name,
                ta.ta_assigned_to_user_id,
                emp1.emp_name AS assigned_employee_name,
                ta.ta_reviewer_eid,
                emp2.emp_name AS assigned_reviewer_name,
                ta.ta_assigned_date AS assignment_date,
                ta.ta_status AS assignment_status
            FROM
                template_assignments ta
            LEFT JOIN
                templates_master tm ON ta.ta_template_id = tm.template_pid
            LEFT JOIN
                employee_personal emp1 ON ta.ta_assigned_to_user_id = emp1.employee_id
            LEFT JOIN
                employee_personal emp2 ON ta.ta_reviewer_eid = emp2.employee_id
            WHERE
                ta.is_delete = 'Active'
            AND ta.ta_template_id = ?    
            ORDER BY
                ta.ta_pid DESC;
        `;

        const results = await new Promise((resolve, reject) => {
            connection.query(query, [goalTemplateId], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        res.status(200).json({
            success: true,
            page: page,
            component: component,
            loading: loading,
            message: 'Retrieved assignments successfully',
            result: results
        });

    } catch (error) {
        console.error('Error in getAssignmentsController:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


export { createAssignmentController, getAssignmentsController, updateAssignmentController, deleteAssignmentController, getAssignmentsListController };