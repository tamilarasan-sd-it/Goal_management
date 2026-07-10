class Category {

    static findAll = (connection) => {
        return new Promise((resolve, reject) => {

            const query = `
                SELECT 
                    category_pid,
                    category_name,
                    category_created_at,
                    category_modified_at,
                    category_is_delete
                FROM categories_list
                WHERE category_is_delete = 'Active'
                ORDER BY category_pid DESC
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in getCategories:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    };

    static create = (connection, categoryData) => {
        return new Promise((resolve, reject) => {

            const query = `
                INSERT INTO categories_list (
                    category_name,
                    category_is_delete
                ) VALUES (?, ?)
            `;

            const values = [
                categoryData.category_name,
                categoryData.category_is_delete
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in addCategory:', error);
                    return reject({ error, success: false });
                }

                resolve({
                    newCategory: {
                        category_pid: result.insertId,
                        category_name: categoryData.category_name,
                        category_is_delete: categoryData.category_is_delete,
                        category_created_at: new Date(),
                        category_modified_at: new Date()
                    },
                    success: true
                });
            });
        });
    };

    static update = (connection, categoryId, categoryUpdates) => {
        return new Promise((resolve, reject) => {

            const query = `
                UPDATE categories_list
                SET category_name = ?
                WHERE category_pid = ?
            `;

            connection.query(
                query,
                [categoryUpdates.category_name, categoryId],
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

    static softDelete = (connection, categoryId) => {
        return new Promise((resolve, reject) => {

            const query = `
                UPDATE categories_list
                SET category_is_delete = 'In Active'
                WHERE category_pid = ?
            `;

            connection.query(query, [categoryId], (error, result) => {
                if (error) {
                    console.error('Error in softDelete:', error);
                    return reject({ error, success: false });
                }

                if (result.affectedRows === 0) {
                    return reject({ error: 'Category not found', success: false });
                }

                resolve({
                    removedCategory: {
                        category_pid: categoryId,
                        category_is_delete: 'In Active',
                    },
                    success: true
                });
            });
        });
    };
}

export { Category };
