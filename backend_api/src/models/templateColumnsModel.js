
class TemplateColumnsModel {

    static findAll(connection){
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    column_pid,
                    column_name,
                    column_type,
                    column_data_type,
                    column_is_visible,
                    column_order,
                    column_created_at,
                    column_options,
                    column_is_delete
                FROM template_columns
                WHERE column_is_delete = 'Active'
                ORDER BY column_pid DESC
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in get template columns modal:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    };

    static create = (connection, columnData) => {
        return new Promise((resolve, reject) => {

            const query = `
                INSERT INTO template_columns (
                    column_name,
                    column_type,
                    column_data_type,
                    column_is_visible,
                    column_order,
                    column_options,
                    column_is_delete
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                columnData.column_name,
                columnData.column_type,
                columnData.column_data_type,
                columnData.column_is_visible,
                columnData.column_order,
                columnData.column_options,
                columnData.column_is_delete
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in addCategory:', error);
                    return reject({ error, success: false });
                }

                resolve({
                    newColumn: {
                        column_pid: result.insertId,
                        column_name: columnData.column_name,
                        column_type: columnData.column_type,
                        column_data_type: columnData.column_data_type,
                        column_is_visible: columnData.column_is_visible,
                        column_order: columnData.column_order,
                        column_options: columnData.column_options,
                        column_created_at: new Date(),
                        column_is_delete: columnData.column_is_delete
                    },
                    success: true
                });
            });
        });
    };

    static update = (connection, columnId, columnUpdates) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE template_columns
                SET 
                    column_name = ?,
                    column_type = ?,
                    column_data_type = ?,
                    column_is_visible = ?,
                    column_order = ?,
                    column_options =?
                WHERE column_pid = ?
            `;
            connection.query(
                query,
                [
                    columnUpdates.column_name,
                    columnUpdates.column_type,
                    columnUpdates.column_data_type,
                    columnUpdates.column_is_visible,
                    columnUpdates.column_order,
                    columnUpdates.column_options,
                    columnId
                ],
                (error, result) => {
                    if (error) {
                        console.error('Error in updateCategory:', error);
                        return reject({ error, success: false });
                    }
                    if (result.affectedRows === 0) {
                        return reject({ error: 'Category not found', success: false });
                    }
                    resolve({ message: 'Category updated successfully', success: true });
                }
            );
        });
    };

    static softDelete = (connection, columnId) => {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE template_columns
                SET column_is_delete = 'In Active'
                WHERE column_pid = ?
            `;
            connection.query(query, [columnId], (error, result) => {
                if (error) {
                    console.error('Error in softDelete:', error);
                    return reject({ error, success: false });
                }
                if (result.affectedRows === 0) {
                    return reject({ error: 'Category not found', success: false });
                }
                resolve({
                    removedColumn: {
                        column_pid: columnId,
                        column_is_delete: 'In Active',
                    },
                    success: true
                });
            });
        });
    };
}

export {
    TemplateColumnsModel
}
