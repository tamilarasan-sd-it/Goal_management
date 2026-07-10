import connectionPool from "../database/dbConfig.js";
import { io } from "../index.js";
import { TemplateModel } from "../models/templateModel.js";
import { TemplateCategoriesModel } from "../models/templateCategoriesModel.js";
import { TemplateColumnMappingModel } from "../models/templateColumnMappingModel.js";
import { TemplateAssignmentsModel } from "../models/templateAssignmentsModel.js";
import { EmployeePersonalModel } from "../models/employeePersonalModel.js";

const addTemplateController = async (req, res) => {
    const { page, component, loading } = req.query;
    const templateData = req.body;
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

        // Check if template name already exists
        const existingTemplate = await TemplateModel.findByNameandYear(connection, templateData.template_name, templateData.year);
        
        if (existingTemplate) {
            await new Promise(resolve => connection.rollback(resolve));
            return res.status(409).json({ success: false, message: `A template with this name already exists for ${templateData.year}.` });
        }

        const addTemplateResult = await TemplateModel.create(connection, templateData);

        if (addTemplateResult && addTemplateResult.success) {
            const newTemplateId = addTemplateResult.newTemplate.template_pid;

            // Insert into template_categories
            if (templateData.categories && templateData.categories.length > 0) {
                for (const category of templateData.categories) {
                    const categoryLinkData = {
                        tc_template_id: newTemplateId,
                        tc_category_id: category.category_pid,
                        tc_max_weightage: category.weightage,
                        tc_kpi_metric: category.tc_kpi_metric,
                        tc_target: category.tc_target,
                        tc_category_description: category.tc_category_description,
                        tc_order: category.tc_order,
                    };
                    await TemplateCategoriesModel.create(connection, categoryLinkData);
                }
            }

            // Insert into template_column_mapping
            if (templateData.columns && templateData.columns.length > 0) {
                for (const column of templateData.columns) {
                    const columnMappingData = {
                        tcm_template_id: newTemplateId,
                        tcm_column_id: column.column_pid,
                        tcm_order: column.column_order,
                    };
                    await TemplateColumnMappingModel.create(connection, columnMappingData);
                }
            }



            // Insert into template_assignments
            // if (templateData.assigned_employee) {
            //     const assignmentData = {
            //         ta_template_id: newTemplateId,
            //         ta_assigned_to_user_id: templateData.assigned_employee,
            //         ta_assigned_by_user_id: templateData.ta_assigned_by_user_id,
            //         ta_status: 'Assigned'
            //     };
            //     await TemplateAssignmentsModel.create(connection, assignmentData);
            // }

        }

        if (addTemplateResult && addTemplateResult.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            // const assigned_employee_Details = await EmployeePersonalModel.getUserByEmpId(connection, templateData.assigned_employee);
            // console.log('assigned_employee_Details:', assigned_employee_Details.result[0]);

            const NewTemplateData = {
                ...addTemplateResult.newTemplate,
                template_status: 'Draft',
                // assigned_user_name: assigned_employee_Details.result[0].emp_name
            }

            io.emit('addSocket', { page: page, component: component, loading: loading, success: true, message: 'Template added successfully', data: NewTemplateData });
            res.status(201).json({ success: true, page: page, component: component, loading: loading, message: 'Template added successfully', result: NewTemplateData });
        } else {
            if (connection) {
                await new Promise(resolve => connection.rollback(resolve));
            }
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Add' });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(resolve));
        }
        console.error('Error in addTemplateController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

 const updateTemplateController = async (req, res) => {
    const { page, component, loading } = req.query;
    const templateData = req.body;
    console.log("Received templateData for update:", templateData);
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

        const templateId = templateData.template_pid;
        if (!templateId) {
            await new Promise(resolve => connection.rollback(resolve));
            return res.status(400).json({ success: false, message: 'Task ID is required for update.' });
        }

        // Check for duplicate template name, excluding the current template
        const existingTemplate = await TemplateModel.findByNameandYear(connection, templateData.template_name, templateData.year, templateId);
        if (existingTemplate) {
            await new Promise(resolve => connection.rollback(resolve));
            return res.status(409).json({ success: false, message: `A template with this name already exists for ${templateData.year}.` });
        }

        // 1. Update templates_master
        const updateTemplateResult = await TemplateModel.update(connection, templateId, templateData);

        if (updateTemplateResult && updateTemplateResult.success) {
            // 2. Delete existing categories and insert new ones
            await TemplateCategoriesModel.deleteByTemplateId(connection, templateId);
            if (templateData.categories && templateData.categories.length > 0) {
                for (const category of templateData.categories) {
                    const categoryLinkData = {
                        tc_template_id: templateId,
                        tc_category_id: category.category_pid,
                        tc_max_weightage: category.weightage,
                        tc_kpi_metric: category.tc_kpi_metric,
                        tc_target: category.tc_target,
                        tc_category_description: category.tc_category_description,
                        tc_order: category.tc_order,
                    };
                    await TemplateCategoriesModel.create(connection, categoryLinkData);
                }
            }

            // 3. Delete existing column mappings and insert new ones
            await TemplateColumnMappingModel.deleteByTemplateId(connection, templateId);
            if (templateData.columns && templateData.columns.length > 0) {
                for (const column of templateData.columns) {
                    const columnMappingData = {
                        tcm_template_id: templateId,
                        tcm_column_id: column.column_pid,
                        tcm_order: column.column_order,
                    };
                    await TemplateColumnMappingModel.create(connection, columnMappingData);
                }
            }

            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            io.emit('updateSocket', { page: page, component: component, loading: loading, success: true, message: 'Template updated successfully', id: templateId, idName: 'template_pid', updatedData: templateData });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Template updated successfully', result: templateData });
        } else {
            await new Promise(resolve => connection.rollback(resolve));
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Update' });
        }

    } catch (error) {
        if (connection) {
            await new Promise(resolve => connection.rollback(resolve));
        }
        console.error('Error in updateTemplateController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


const deleteTemplateController = async (req, res) => {
    const { page, component, loading } = req.query;
    console.log('deleteTemplateController called');
    let connection;
    try {
        const templateId = req.body.template_pid; // Assuming template_pid is sent in the body

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

        const result = await TemplateModel.softDelete(connection, templateId);

        if (result && result?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            io.emit('deleteSocket', { page: page, component: component, loading: loading, success: true, message: "Successfully Template Deleted", id: result?.removedTemplate?.template_pid, idName: 'template_pid' });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Template deleted successfully', result: result?.removedTemplate });
        } else {
            if (connection) {
                await new Promise(resolve => {
                    connection.rollback(() => {
                        console.log('Transaction rolled back due to error');
                        resolve();
                    });
                });
            }
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Template Delete' });
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
        console.error('Error in deleteTemplateController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};




export {
    addTemplateController,
    updateTemplateController,
    deleteTemplateController

};