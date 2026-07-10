class TemplateModel {

    static findAll(connection) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    *
                FROM templates_master
                WHERE template_is_delete = 'Active'
                ORDER BY template_pid DESC
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in TemplateModel.findAll:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    };

    static create = (connection, templateData) => {

        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO templates_master (
                    template_name, 
                    template_year, 
                    template_created_by,
                    template_status
                ) VALUES (?, ?, ?, ?)
            `;

            const values = [
                templateData.template_name,
                templateData.year, // Corresponds to formData.year
                Number(templateData.template_created_by),
                templateData.template_status || 'Draft' // Default to 'Draft' if not provided
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in TemplateModel.create:', error);
                    return reject({ error, success: false });
                }

                resolve({
                    newTemplate: {
                        template_pid: result.insertId,
                        template_year: templateData.year,
                        template_name: templateData.template_name,
                        template_assigned_position: templateData.assigned_position,
                        template_assigned_to_user_id: templateData.assigned_employee,
                        template_created_date: templateData.template_created_date,

                        ...templateData
                    },
                    success: true
                });
            });
        });
    };

    static findByName = (connection, templateName, excludeTemplateId = null) => {
        return new Promise((resolve, reject) => {
            let query = "SELECT * FROM templates_master WHERE template_name = ? AND template_is_delete = 'Active'";
            const params = [templateName];

            if (excludeTemplateId) {
                query += " AND template_pid != ?";
                params.push(excludeTemplateId);
            }

            connection.query(query, params, (error, results) => {
                if (error) {
                    console.error('Error in TemplateModel.findByName:', error);
                    return reject(error);
                }
                resolve(results[0]);
            });
        });
    };

    static findByNameandYear = (connection, templateName, year, excludeTemplateId = null) => {
        return new Promise((resolve, reject) => {
            let query = "SELECT * FROM templates_master WHERE template_name = ? AND template_year = ? AND template_is_delete = 'Active'";
            const params = [templateName, year];
    
            if (excludeTemplateId) {
                query += " AND template_pid != ?";
                params.push(excludeTemplateId);
            }
    
            connection.query(query, params, (error, results) => {
                if (error) {
                    console.error('Error in TemplateModel.findByNameandYear:', error);
                    return reject(error);
                }
                resolve(results[0]);
            });
        });
    };



    static update = (connection, templateId, templateData) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE templates_master
                SET
                    template_name = ?,
                    template_year = ?,
                    template_modified_at = ?,
                    template_created_by = ?,
                    template_status = ?
                WHERE template_pid = ?
            `;
            const values = [
                templateData.template_name,
                templateData.year,
                templateData.template_modified_at,
                templateData.template_created_by,
                templateData.template_status,
                templateId,
            ];
            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in TemplateModel.update:', error);
                    return reject({ error, success: false });
                }
                if (result.affectedRows > 0) {
                    resolve({ success: true, affectedRows: result.affectedRows });
                }
                reject({ error: 'Template not found or not updated', success: false });
            });
        });
    };

    static updateStatus = (connection, templateId, newStatus, modifiedAt) => {
        console.log('templateId:', templateId);
        console.log('newStatus:', newStatus);
        console.log('modifiedAt:', modifiedAt);
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE templates_master
                SET
                    template_status = ?,
                    template_modified_at = ?
                WHERE template_pid = ?
            `;
            const values = [
                newStatus,
                modifiedAt,
                templateId
            ];
            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in TemplateModel.updateStatus:', error);
                    return reject({ error, success: false });
                }
                if (result.affectedRows > 0) {
                    resolve({ success: true, affectedRows: result.affectedRows });
                }
                reject({ error: 'Template not found or status not updated', success: false });
            });
        });
    };

    static softDelete = (connection, templateId) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE templates_master
                SET template_is_delete = 'In Active'
                WHERE template_pid = ?
            `;
            connection.query(query, [templateId], (error, result) => {
                if (error) {
                    console.error('Error in TemplateModel.softDelete:', error);
                    return reject({ error, success: false });
                }
                if (result.affectedRows === 0) {
                    return reject({ error: 'Template not found', success: false });
                }
                resolve({
                    removedTemplate: {
                        template_pid: templateId,
                        template_is_delete: 'In Active',
                    },
                    success: true
                });
            });
        });
    };

}

export {
    TemplateModel
}