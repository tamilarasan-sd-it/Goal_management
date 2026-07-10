import connectionPool from "../database/dbConfig.js";
import { io } from "../index.js";
import { Category} from "../models/categoryModel.js";

const getCategoryController = async (req, res) => {
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

        const Category_list = await Category.findAll(connection);
        if (Category_list && Category_list?.success) {
            // Commit the transaction
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            
            
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'Retrieved Category successfully', result: Category_list?.result });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On Category  Retrieve' });
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
        console.error('Error in getCategoryController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
}

const addCategoryController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    try {
        const categoryData = req.body;
        // get connection from connection pool
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);
        // transaction start here
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });

        // Prevent duplicate active category names (case-insensitive) without DB schema changes
        const normalizedName = (categoryData?.category_name || '').trim().toLowerCase();
        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                page: page,
                component: component,
                loading: loading,
                message: 'Category name is required'
            });
        }

        const duplicateCheckQuery = `
            SELECT category_pid
            FROM categories_list
            WHERE category_is_delete = 'Active'
              AND LOWER(TRIM(category_name)) = ?
            LIMIT 1
        `;

        const duplicate = await new Promise((resolve, reject) => {
            connection.query(duplicateCheckQuery, [normalizedName], (err, rows) => {
                if (err) return reject({ error: err, success: false });
                resolve(rows);
            });
        });

        if (duplicate && duplicate.length > 0) {
            // rollback transaction then return conflict
            await new Promise((resolve) => {
                connection.rollback(() => resolve());
            });

            return res.status(409).json({
                success: false,
                page: page,
                component: component,
                loading: loading,
                message: 'Category name already exists'
            });
        }

        const result = await Category.create(connection, categoryData);

        if (result && result?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });

            io.emit('addSocket', { page: page, component: component, loading: loading, success: true, message: 'category added successfully', data: result?.newCategory });
            res.status(201).json({ success: true, page: page, component: component, loading: loading, message: 'category added successfully', result: result?.newCategory });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On category add' });
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
        console.error('Error in addCategoryController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const updateCategoryController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    try {
        
        const categoryId = req.body.category_pid;
        const categoryUpdates = req.body;
        // get connection from connection pool
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);
        // transaction start here
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });
        const result = await Category.update(connection, categoryId, categoryUpdates);
        if (result && result?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            
            io.emit('updateSocket', { page: page, component: component, loading: loading, success: true, id: categoryUpdates?.category_pid, idName: 'category_pid', updatedData: categoryUpdates });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'category updated successfully' });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On category update' });
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
        console.error('Error in updateCategoryController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

const deleteCategoryController = async (req, res) => {
    const { page, component, loading } = req.query;
    let connection;
    try {
        
        const categoryId = req.body.category_pid;
        // get connection from connection pool
        connection = await new Promise((resolve, reject) => {
            connectionPool.getConnection((err, conn) => {
                if (err) return reject({ error: err, success: false });
                resolve(conn);
            });
        });

        console.log('Connection acquired:', connection.threadId);
        // transaction start here
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject({ error: err, success: false });
                resolve();
            });
        });
        const result = await Category.softDelete(connection, categoryId);
        if (result && result?.success) {
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) return reject({ error: err, success: false });
                    resolve();
                });
            });
            io.emit('deleteSocket', { page: page, component: component, loading: loading, success: true, message: "Successfully category Deleted", id: result?.removedCategory?.category_pid, idName: 'category_pid' });
            res.status(200).json({ success: true, page: page, component: component, loading: loading, message: 'category deleted successfully' });
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
            res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Error On category delete' });
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
        console.error('Error in deleteCategoryController:', error);
        res.status(500).json({ success: false, page: page, component: component, loading: loading, message: 'Internal Server Error' });
    } finally {
        // Always release the connection back to the pool
        if (connection) {
            connection.release();
            console.log('Connection released back to pool');
        }
    }
};

export {
    getCategoryController,
    addCategoryController,
    updateCategoryController,
    deleteCategoryController
}