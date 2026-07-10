class TemplateAssignmentsModel {
    static create(connection, assignmentData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO template_assignments (
                    ta_template_id,
                    ta_assigned_to_user_id,
                    ta_assigned_by_user_id,
                    ta_status
                ) VALUES (?, ?, ?, ?)
            `;

            const values = [
                assignmentData.ta_template_id,
                assignmentData.ta_assigned_to_user_id,
                assignmentData.ta_assigned_by_user_id,
                assignmentData.ta_status || 'Assigned',
            ];

            connection.query(query, values, (error, result) => {
                if (error) {
                    console.error('Error in TemplateAssignmentsModel.create:', error);
                    return reject({ error, success: false });
                }
                resolve({ success: true, insertId: result.insertId });
            });
        });
    }
}

export {
    TemplateAssignmentsModel
};