import connectionPool from "../database/dbConfig.js";
import { io } from "../index.js";
import { TemplateModel } from "../models/templateModel.js";
import { TemplateColumnsModel } from "../models/templateColumnsModel.js";


const getTemplateColumnsController = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const templateColumnListResult = await TemplateColumnsModel.findAll(connection);
        if (templateColumnListResult && templateColumnListResult?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });


            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Template Columns successfully', result: templateColumnListResult?.result });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Columns  Retrieve' });
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
        console.error('Error in getTemplateColumnsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
}

const addTemplateColumnsController = async (req, res) => {
    const { page, component, loading } = req.query;
    const columnData = req.body;
    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const addColumnResult = await TemplateColumnsModel.create(connection, columnData);
        if (addColumnResult && addColumnResult?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            io.emit('addSocket', { page: page, component: component, loading: loading, success: true, message: 'Template Column added successfully', data: addColumnResult?.newColumn });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Template Column added successfully', result: addColumnResult?.result });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Column Add' });
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
        console.error('Error in addTemplateColumnsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const updateTemplateStatusController = async (req, res) => {
    const { page, component, loading } = req.query;
    const { template_pid, template_status, template_modified_at } = req.body;
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

        if (!template_pid || !template_status || !template_modified_at) {
            await new Promise(resolve => connection.rollback(resolve));
            return res.status(400).json({ success: false, message: 'Task ID, status, and modified date are required.' });
        }
        console.log(template_pid, template_status, template_modified_at, "updateTemplateStatusController")
        const updateResult = await TemplateModel.updateStatus(connection, template_pid, template_status, template_modified_at);

        if (updateResult && updateResult.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            io.emit('updateSocket', { page: page, component: component, loading: loading, success: true, message: 'Template status updated successfully', id: template_pid, idName: 'template_pid', updatedData: { template_pid, template_status, template_modified_at } });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Template status updated successfully', result: { template_pid, template_status, template_modified_at } });
        } else {
            await new Promise(resolve => connection.rollback(resolve));
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Status Update' });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(resolve));
        }
        console.error('Error in updateTemplateStatusController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


const updateTemplateColumnsController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const columnUpdates = req.body;
        const result = await TemplateColumnsModel.update(connection, columnUpdates?.column_pid, columnUpdates);
        if (result && result?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            io.emit('updateSocket', { page: page, component: component, loading: loading, success: true, id: columnUpdates?.column_pid, idName: 'column_pid', updatedData: columnUpdates });

            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Template Column updated successfully', result: result?.message });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Column Update' });
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
        console.error('Error in updateTemplateColumnsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const deleteTemplateColumnsController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        const columnId = req.body.column_pid;
        const result = await TemplateColumnsModel.softDelete(connection, columnId);
        if (result && result?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            io.emit('deleteSocket', { page: page, component: component, loading: loading, success: true, message: "Successfully Template Column Deleted", id: result?.removedColumn?.column_pid, idName: 'column_pid' });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Template Column deleted successfully', result: result?.removedColumn });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Column Delete' });
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
        console.error('Error in deleteTemplateColumnsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const getTemplatesController = async (req, res) => {
    const { page, component, loading } = req.query;

    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired for templates:', connection.threadId);

        const query = `
          SELECT
*
FROM templates_master 
ORDER BY template_pid DESC
        `;

        const results = await new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        console.log(results)

        res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Templates successfully', result: results });
    } catch (error) {
        console.error('Error in getTemplatesController:', error);
        res.status(500).json({
            success: false,
            page: page,
            component: component,
            loading: loading,
            message: 'Internal Server Error'
        });
    } finally {
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
}

const getTemplateDetailsController = async (req, res) => {
    const { page, component, loading, id } = req.query; // Keep for consistency with other controllers
    const template_pid = id;


    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired for getTemplateDetailsController:', connection.threadId);

        // Fetch main template details
        const templateQuery = `
            SELECT 
                *
            FROM templates_master
            WHERE template_pid = ?;
        `;
        const templateResult = await new Promise((resolve, reject) => {
            connection.query(templateQuery, [template_pid], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        // Fetch main template details
        const CategoriesQuery = `
           SELECT tc.*, cl.*
            FROM template_categories tc
            LEFT JOIN categories_list cl ON tc.tc_category_id = cl.category_pid
            WHERE tc.tc_template_id = ?;
            ;
        `;
        const CategoriesQueryResults = await new Promise((resolve, reject) => {
            connection.query(CategoriesQuery, [template_pid], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });


        // Fetch main template details
        const column_mapping_query = `
          SELECT tcm.*, tc.*
            FROM template_column_mapping tcm
            LEFT JOIN template_columns tc ON tcm.tcm_column_id = tc.column_pid
            WHERE tcm.tcm_template_id = ? and
            tc.column_is_delete = 'Active'
        `;
        const column_mapping_queryResults = await new Promise((resolve, reject) => {
            connection.query(column_mapping_query, [template_pid], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });


        // Fetch main template details
        const template_assignments_query = `
           SELECT * FROM template_assignments WHERE ta_template_id = ?;
        `;
        const template_assignmentsResults = await new Promise((resolve, reject) => {
            connection.query(template_assignments_query, [template_pid], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });




        // Combine all data
        const fullTemplateData = {
            ...templateResult[0],
            categories: CategoriesQueryResults,
            columns: column_mapping_queryResults,
            template_assignmentsResults: template_assignmentsResults

        };

        res.status(200).json({
            success: true,
            page: page,
            component: component,
            loading: loading,
            message: 'Retrieved Template details successfully',
            result: fullTemplateData
        });

    } catch (error) {
        console.error('Error in getTemplateDetailsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const fetchPositionsController = async (req, res) => {
    console.log('fetchPositionsController called');
    const { page, component, loading } = req.query;
    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        const query = "SELECT DISTINCT emp_pos FROM `employee_personal` WHERE emp_pos IS NOT NULL AND emp_pos != '' ORDER BY emp_pos ASC;";

        const results = await new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });

        // The database returns an array of objects, e.g., [{emp_pos: 'Manager'}, {emp_pos: 'Developer'}]
        // We will transform it into a simple array of strings: ['Manager', 'Developer']
        const positions = results.map(item => item.emp_pos);

        res.status(200).json({
            success: true,
            page: page,
            component: component,
            loading: loading,
            message: 'Retrieved Employee Positions successfully',
            result: positions
        });

    } catch (error) {
        console.error('Error in fetchPositionsController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};





const fetchEmployeesByPositionController = async (req, res) => {
    const { page, component, loading } = req.query; // Keep for consistency with other controllers


    let connection;
    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        const query = `
         SELECT *
            FROM (
                SELECT
                    ep.emp_id,
                    ep.employee_id,
                    ep.emp_name,
                    CASE
                        WHEN ep.level IN (4,5,6) AND ep.ReportingManager = 1400
                            THEN 'Senior Manager'
                        WHEN ep.emp_pos LIKE '%Assistant Manager%' AND ep.ReportingManager <> 1400
                            THEN 'Assistant Manager'
                    END AS role_type,
                    ep.emp_dept,
                    ep.department,
                    ep.emp_pos,
                    ep.ReportingManager,
                    ep.level,
                    rpm.emp_name AS reporting_manager_name,
                    rpm.employee_id AS reporting_manager_id
                
               
                FROM employee_personal ep
                LEFT JOIN employee_personal rpm ON
                rpm.employee_id = ep.ReportingManager
                WHERE ep.emp_resign = '12/31/2030'
            ) t
            WHERE t.role_type IS NOT NULL
            ORDER BY t.role_type DESC
            `;

        const results = await new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });

        res.status(200).json({
            success: true,
            page: page,
            component: component,
            loading: loading,
            message: 'Retrieved Employees by position successfully',
            result: results
        });

    } catch (error) {
        console.error('Error in fetchEmployeesByPositionController:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};


const getTemplatesListController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;

   
    let userId;
    try {
        const rawId = req.query.id;
        if (typeof rawId === 'string' && rawId.startsWith('{')) {
            const parsed = JSON.parse(rawId);
            userId = parsed.user_id;
        } else if (typeof rawId === 'object' && rawId !== null) {
            userId = rawId.user_id;
        } else {
            userId = rawId;
        }
    } catch (parseErr) {
        console.error('Failed to parse id param:', parseErr);
        return res.status(400).json({ success: false, message: 'Invalid id parameter' });
    }
    

    try {
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        let whereClause = "tm.template_is_delete = 'Active'";
        let params = [];

        if (userId !== '12345' && userId !== '1400') {
            whereClause += " AND ta.is_delete = 'Active' AND ta.ta_assigned_to_user_id = ?";
            params.push(userId);
        }
        

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
            WHERE ${whereClause}    
            GROUP BY
                tm.template_pid,
                tm.template_name
            ORDER BY total_assignments DESC;
        `;

        const results = await new Promise((resolve, reject) => {
            connection.query(query, params, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
        

        res.status(200).json({
            success: true,
            page: page,
            component: component,
            loading: loading,
            message: 'Template List data successfully',
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


export {
    getTemplateColumnsController,
    addTemplateColumnsController,
    updateTemplateColumnsController,
    deleteTemplateColumnsController,
    getTemplateDetailsController, // Export the new controller
    fetchPositionsController,
    getTemplatesController,
    fetchEmployeesByPositionController,
    updateTemplateStatusController,
    getTemplatesListController
}