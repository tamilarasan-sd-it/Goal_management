class TemplateColumnMappingModel {
    static create(connection, mappingData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO template_column_mapping (
                    tcm_template_id,
                    tcm_column_id,
                    tcm_order
                ) VALUES (?, ?, ?)
            `;

            const values = [
                mappingData.tcm_template_id,
                mappingData.tcm_column_id,
                mappingData.tcm_order,
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in TemplateColumnMappingModel.create:', error);
                    return reject({ error, success: false });
                }
                resolve({ success: true, insertId: result.insertId });
            });
        });
    }

    static deleteByTemplateId(connection, templateId) {
        return new Promise((resolve, reject) => {
            const query = `
                DELETE FROM template_column_mapping
                WHERE tcm_template_id = ?
            `;

            connection.query(query, [templateId], (error, result) => {
                if (error) {
                    console.error('Error in TemplateColumnMappingModel.deleteByTemplateId:', error);
                    return reject({ error, success: false });
                }
                resolve({ success: true, affectedRows: result.affectedRows });
            });
        });
    }
}

export {
    TemplateColumnMappingModel
};