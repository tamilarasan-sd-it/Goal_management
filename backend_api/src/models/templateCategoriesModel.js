class TemplateCategoriesModel {
    static create(connection, categoryData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO template_categories (
                    tc_template_id,
                    tc_category_id,
                    tc_max_weightage,
                    tc_kpi_metric,
                    tc_target,
                    tc_category_description,
                    tc_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                categoryData.tc_template_id,
                categoryData.tc_category_id,
                categoryData.tc_max_weightage,
                categoryData.tc_kpi_metric,
                categoryData.tc_target,
                categoryData.tc_category_description,
                categoryData.tc_order,
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in TemplateCategoriesModel.create:', error);
                    return reject({ error, success: false });
                }
                resolve({ success: true, insertId: result.insertId });
            });
        });
    }

    static deleteByTemplateId(connection, templateId) {
        return new Promise((resolve, reject) => {
            const query = `
                DELETE FROM template_categories
                WHERE tc_template_id = ?
            `;

            connection.query(query, [templateId], (error, result) => {
                if (error) {
                    console.error('Error in TemplateCategoriesModel.deleteByTemplateId:', error);
                    return reject({ error, success: false });
                }
                resolve({ success: true, affectedRows: result.affectedRows });
            });
        });
    }
}

export {
    TemplateCategoriesModel
};