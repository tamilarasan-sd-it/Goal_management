export class MonthlyScheduler {
    static createSchedule(connection, scheduleDetails) {
        return new Promise((resolve, reject) => {
            const { type, date } = scheduleDetails;
            const query = `
                INSERT INTO scheduled_calls (
                    mail_type,
                    mail_date
                ) VALUES (?, ?)
            `;

            const values = [
                type,
                date,
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in MonthlyScheduler.createSchedule:', error);
                    return reject({ error, success: false });
                }
                resolve({ success: true, insertId: result.insertId });
            });
        });
    }

    static fetchAllSchedules(connection) {
        return new Promise((resolve, reject) => {
            const query = ' SELECT * FROM scheduled_calls WHERE `is_active` = 1 ORDER BY `id` DESC';

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in MonthlyScheduler.fetchAllSchedules:', error);
                    return reject({ error, success: false });
                }
                resolve({ result, success: true });
            });
        });
    }

    static updateSchedule(connection, id, date) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE scheduled_calls 
                SET mail_date = ?
                WHERE id = ?
            `;

            connection.query(query, [date, id], (error, result) => {
                if (error) {
                    console.error('Error in MonthlyScheduler.updateSchedule:', error);
                    return reject({ error, success: false });
                }
                if (result.affectedRows === 0) return reject({ error: new Error('Schedule not found'), success: false });
                resolve({ success: true });
            });
        });
    }
    static fetchEmployeeData(connection) {
        return new Promise((resolve, reject) => {

            if (!connection) {
                return reject(new Error('Database connection is undefined'));
            }

            const query = `
                SELECT *
                FROM (
                    SELECT
                        ep.emp_id,
                        ep.employee_id,
                        ep.emp_name,
                        CASE
                            WHEN ep.level IN (4,5,6)
                                AND ep.ReportingManager = 1400
                            THEN 'Senior Manager'
                            WHEN ep.emp_pos LIKE '%Assistant Manager%'
                                AND ep.ReportingManager <> 1400
                            THEN 'Assistant Manager'
                        END AS role_type,
                        ep.mail_id
                    FROM employee_personal ep
                    LEFT JOIN employee_personal rpm
                        ON rpm.employee_id = ep.ReportingManager
                    WHERE ep.emp_resign = '12/31/2030'
                ) t
                WHERE t.role_type IS NOT NULL
                ORDER BY t.role_type DESC
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    } 
    static fetchSeniorManagers(connection) {
        return new Promise((resolve, reject) => {

            if (!connection) {
                return reject(new Error('Database connection is undefined'));
            }

            const query = `
                SELECT emp_name,emp_id,employee_id,mail_id, 'Senior Manager' AS role_type
            FROM employee_personal
            WHERE emp_resign = '12/31/2030'
                AND level IN (4,5,6)
                AND ReportingManager = 1400
            ORDER BY emp_name
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    }

    static fetchAssistantManagers(connection) {
        return new Promise((resolve, reject) => {

            if (!connection) {
                return reject(new Error('Database connection is undefined'));
            }

            const query = `
                SELECT
                    ep.emp_id,
                    ep.employee_id,
                    ep.emp_name,
                    'Assistant Manager' AS role_type,
                    ep.mail_id
                FROM employee_personal ep
                LEFT JOIN employee_personal rpm
                    ON rpm.employee_id = ep.ReportingManager
                WHERE ep.emp_resign = '12/31/2030'
                    AND ep.emp_pos LIKE '%Assistant Manager%'
                    AND ep.ReportingManager <> 1400
                ORDER BY ep.emp_name
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    }
    static fetchScheduleData(connection) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    id,
                    mail_type,
                    mail_date,
                    is_active
                FROM scheduled_calls
                WHERE is_active = 1
                AND mail_type IN ('Functional Head', 'Assistant Manager')
                AND id IN (
                    SELECT MAX(id)
                    FROM scheduled_calls
                    WHERE is_active = 1
                    AND mail_type IN ('Functional Head', 'Assistant Manager')
                    GROUP BY mail_type
                )
                ORDER BY id DESC
            `;

            connection.query(query, (error, result) => {
                if (error) {
                    console.error('Error in Scheduler Date.fetchSchedules:', error);
                    return reject({ error, success: false });
                }

                // Separate by role type
                const functionalHeadData = result.find(row => row.mail_type === 'Functional Head');
                const assistantManagerData = result.find(row => row.mail_type === 'Assistant Manager');

                resolve({
                    success: true,
                    functionalHeadDate: functionalHeadData?.mail_date || null,
                    assistantManagerDate: assistantManagerData?.mail_date || null,
                    allData: result
                });
            });
        });
    }

}

export default MonthlyScheduler;