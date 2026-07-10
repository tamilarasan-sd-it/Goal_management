
// employeePersonalModel
class EmployeePersonalModel {
    static getUserByEmpId(connection,employee_id){
        return new Promise((resolve, reject) => {

                    const query = `
                        SELECT 
                            emp_id,
                            employee_id,
                            emp_pass,
                            emp_name,
                            department,
                            level,
                            ReportingManager
                        FROM employee_personal
                        WHERE  employee_id = ? 
                    `;

                    connection.query(query, [employee_id],(error, result) => {
                        if (error) {
                            console.error('Error in getCategories:', error);
                            return reject({ error, success: false });
                        }
                        resolve({ result, success: true });
                    });
                });
    }
}

export { 
    EmployeePersonalModel
};