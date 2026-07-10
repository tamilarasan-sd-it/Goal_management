import { sendEmail } from "./emailServices.js";

const AsssignedGoalSendMail = async (goalAssignedDetails) => {
    try {
        const to = ["nikita@pdmrindia.com"];

        console.log(goalAssignedDetails, "goalAssignedDetails");

        const subject = `Goal Template:  ${goalAssignedDetails?.template_name} -  ${goalAssignedDetails?.template_year}`;

        const text = `
                <html>
                <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                    
                    <p>Dear Team,</p>
                    <p>
                    A new <b>Goal Template</b> has been assigned in <b>PDMR</b>.
                    Please find the details below:
                    </p>

                    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <th align="left">Template Name</th>
                        <td>${goalAssignedDetails?.template_name}</td>
                    </tr>
                    <tr>
                        <th align="left">Template Year</th>
                        <td>${goalAssignedDetails?.template_year}</td>
                    </tr>
                    </table>

                    <br />

                    <p><b>Assigned Goals:</b></p>

                    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #f2f2f2;">
                        <th align="left">Employee Name</th>
                        <th align="left">Reviewer Name</th>
                    </tr>
                    ${goalAssignedDetails?.assignments?.map(a => `
                        <tr>
                            <td>${a.assigned_employee_name}</td>
                            <td>${a.assigned_reviewer_name}</td>
                        </tr>
                        `).join("")
            }
                    </table>

                    <br />

                    <p>
                    Kind regards,<br/>
                    <b>PDMR Team</b>
                    </p>

                </body>
                </html>
                `;

        const cc = [];
        const bcc = [];

        // console.log(to, subject, text, cc, bcc, "to, subject, text, cc, bcc");

        const mailResult = await sendEmail(to, subject, text, cc, bcc);
        return mailResult;

    } catch (error) {
        console.error('Error AsssignedGoalSendMail email:', error);
    }
};

const GoalSendToReviewerMail = async (goalSendDetails) => {
    try {
        if (!goalSendDetails) {
            throw new Error("goalSendDetails is missing");
        }

        const { assignmentData, goalsData } = goalSendDetails;

        const to = ["nikita@pdmrindia.com"];

        const subject = `Goal Template: ${assignmentData?.template_name} - ${assignmentData?.template_year} - (${assignmentData?.goal_owner_name})`;

        const goalsRows = Array.isArray(goalsData) && goalsData.length > 0
            ? goalsData.map(goal => `
                <tr>
                    <td>${goal?.goal_owner_name || "-"}</td>
                    <td>${assignmentData?.reviewer_name || "-"}</td>
                    <td>${goal?.category_name || "-"}</td>
                    <td>${goal?.tg_timeline || "-"}</td>
                    <td>${goal?.tg_goal_weightage || "-"}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5">No goals available</td></tr>`;

        const text = `
            <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                
                <p>Dear ${assignmentData?.reviewer_name || "Reviewer"},</p>

                <p>
                    The goal owner <b>${assignmentData?.goal_owner_name}</b> has submitted
                    the goals for your review in <b>PDMR</b>.
                </p>

                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <th align="left">Template Name</th>
                        <td>${assignmentData?.template_name}</td>
                    </tr>
                    <tr>
                        <th align="left">Template Year</th>
                        <td>${assignmentData?.template_year}</td>
                    </tr>
                    <tr>
                        <th align="left">Goal Owner</th>
                        <td>${assignmentData?.goal_owner_name} (${assignmentData?.goal_owner_position})</td>
                    </tr>
                    <tr>
                        <th align="left">Reviewer</th>
                        <td>${assignmentData?.reviewer_name} (${assignmentData?.reviewer_position})</td>
                    </tr>
                </table>

                <br />

                <p><b>Submitted Goals:</b></p>

                <table border="1" cellpadding="8" cellspacing="0"
                    style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #f2f2f2;">
                        <th>Employee Name</th>
                        <th>Reviewer Name</th>
                        <th>Category</th>
                        <th>Timeline</th>
                        <th>Weightage</th>
                    </tr>
                    ${goalsRows}
                </table>

                <br />

                <p>
                    Please review the goals and proceed with the next action in the system.
                </p>

                <p>
                    Kind regards,<br/>
                    <b>PDMR Team</b>
                </p>

            </body>
            </html>
        `;

        const cc = [];
        const bcc = [];

        // console.log(to, subject, text, cc, bcc, "to, subject, text, cc, bcc");

        const mailResult = await sendEmail(to, subject, text, cc, bcc);
        return mailResult;

    } catch (error) {
        console.error('Error GoalSendToReviewerMail email:', error);
        throw error;
    }
};

const SendForStatusBasedEmail = async (statusBasedEmailDetails) => {
    try {
        if (!statusBasedEmailDetails) {
            throw new Error("statusBasedEmailDetails is missing");
        }

        const { assignmentData, goalsData, currentStatus } = statusBasedEmailDetails;

        let isMailSend = false;
        let dearMessage = "";
        let messageContent = "";
        let to = ["nikita@pdmrindia.com"];

        const formattedStatus = currentStatus?.replace(/_/g, " ");

        switch (currentStatus) {

            case 'Under_Review': // Owner -> Reviewer
                isMailSend = true;
                dearMessage = `Dear ${assignmentData?.reviewer_name},`;
                // to = [assignmentData?.reviewer_email];
                break;

            case 'Approve_Reviewer':
            case 'Need_More_Information_Reviewer':
                isMailSend = true;
                dearMessage = `Dear ${assignmentData?.goal_owner_name},`;
                // to = [assignmentData?.goal_owner_email];
                break;

            case 'Modify_Correction_Reviewer': // Owner -> Reviewer
                isMailSend = true;
                dearMessage = `Dear ${assignmentData?.reviewer_name},`;
                // to = [assignmentData?.reviewer_email];
                break;

            case 'Need_More_Information_Super_Admin':
            case 'Approved':
            case 'Rejected':
                isMailSend = true;
                dearMessage = `Dear ${assignmentData?.goal_owner_name},`;
                // to = [assignmentData?.goal_owner_email];
                break;

            case 'Modify_Correction_Super_Admin': // Owner -> Super Admin
                isMailSend = true;
                dearMessage = `Dear ${assignmentData?.super_admin_name},`;
                // to = [assignmentData?.super_admin_email];
                break;

            default:
                return; // no mail
        }

        messageContent = `
            The goal status has been updated to 
            <b>${formattedStatus}</b>.
        `;

        const subject = `Goal Template: ${assignmentData?.template_name} - ${assignmentData?.template_year} - (${assignmentData?.goal_owner_name})`;

        const goalsRows = Array.isArray(goalsData) && goalsData.length > 0
            ? goalsData.map(goal => `
                <tr>
                    <td>${assignmentData?.goal_owner_name || "-"}</td>
                    <td>${assignmentData?.reviewer_name || "-"}</td>
                    <td>${goal?.category_name || "-"}</td>
                    <td>${goal?.tg_timeline || "-"}</td>
                    <td>${goal?.tg_goal_weightage || "-"}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5">No goals available</td></tr>`;

        const text = `
            <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                
                <p>${dearMessage}</p>

                <p>${messageContent}</p>
                
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <th align="left">Template Name</th>
                        <td>${assignmentData?.template_name}</td>
                    </tr>
                    <tr>
                        <th align="left">Template Year</th>
                        <td>${assignmentData?.template_year}</td>
                    </tr>
                    <tr>
                        <th align="left">Goal Owner</th>
                        <td>${assignmentData?.goal_owner_name}</td>
                    </tr>
                    <tr>
                        <th align="left">Reviewer</th>
                        <td>${assignmentData?.reviewer_name}</td>
                    </tr>
                </table>

                <br />

                <p><b>Submitted Goals:</b></p>

                <table border="1" cellpadding="8" cellspacing="0"
                    style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #f2f2f2;">
                        <th>Employee Name</th>
                        <th>Reviewer Name</th>
                        <th>Category</th>
                        <th>Timeline</th>
                        <th>Weightage</th>
                    </tr>
                    ${goalsRows}
                </table>

                <br />

                <p>
                    Please review the goals and proceed with the next action in the system.
                </p>

                <p>
                    Kind regards,<br/>
                    <b>PDMR Team</b>
                </p>

            </body>
            </html>
        `;

        const cc = [];
        const bcc = [];

        if (!isMailSend || !to?.length) return;

        // console.log(to, subject, text, cc, bcc, "to, subject, text, cc, bcc");
        const mailResult = await sendEmail(to, subject, text, cc, bcc);
        return mailResult;

    } catch (error) {
        console.error('Error SendForStatusBasedEmail email:', error);
        throw error;
    }
};

const ScheduleCallMail = async (EmpPostionData, scheduleResult) => {
    try {

        const Senior_Manage_Date    = scheduleResult.functionalHeadDate;
        const Assistant_Manage_Date = scheduleResult.assistantManagerDate;

        if (EmpPostionData.length > 0) {
            const subject = "Current Month On Schedule Call - Goal Management Review Meeting";
            const cc      = [];
            const bcc     = [];
            const results = [];

            for (const emp of EmpPostionData) {
                const { emp_name, mail_id, role_type } = emp;

                const roleGreeting = `Dear ${emp_name},`;

                let scheduleDate  = '';
                let formattedDate = '[Date Not Set]';
                let roleMessage   = '';

                // Set date based on role
                if (role_type === 'Senior Manager') {
                    scheduleDate = Senior_Manage_Date;
                } else if (role_type === 'Assistant Manager') {
                    scheduleDate = Assistant_Manage_Date;
                }

                // Format date
                if (scheduleDate) {
                    formattedDate = new Date(scheduleDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric'
                    });
                }

                // Role-wise message body
                if (role_type === 'Senior Manager') {
                    roleMessage = `
                        <p>You are invited to attend the <b>Monthly Goal Management Review Meeting</b> 
                        to discuss the progress of departmental goals, key achievements, challenges, 
                        and strategic action plans.</p>

                        <p><b>Meeting Details:</b></p>
                        <ul>
                            <li><b>Date:</b> ${formattedDate}</li>
                            <li><b>Time:</b> 2 to 4</li>
                        </ul>

                        <p>Kindly be prepared to present:</p>
                        <ul>
                            <li>Goal achievement status</li>
                            <li>Key accomplishments during the month</li>
                            <li>Risks or challenges impacting goal completion</li>
                            <li>Action plans and support requirements</li>
                        </ul>

                        <p>Your participation is essential to ensure effective monitoring 
                        and alignment with organizational objectives.</p>
                    `;
                } else if (role_type === 'Assistant Manager') {
                    roleMessage = `
                        <p>Please be informed that the <b>Monthly Goal Management Review Meeting</b> 
                        has been scheduled. Kindly ensure all your team's goal progress reports 
                        are updated before the meeting.</p>

                        <p><b>Meeting Details:</b></p>
                        <ul>
                            <li><b>Date:</b> ${formattedDate}</li>
                            <li><b>Time:</b> 2 to 4</li>
                        </ul>

                        <p>Please ensure the following are ready:</p>
                        <ul>
                            <li>Updated goal completion status</li>
                            <li>Monthly achievements summary</li>
                            <li>Pending tasks and blockers</li>
                            <li>Support or escalation requirements</li>
                        </ul>

                        <p>Your timely inputs are crucial for the smooth conduct of the review.</p>
                    `;
                }

                const text = `
                    <html>
                    <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                        <p>${roleGreeting}</p>

                        ${roleMessage}

                        <p>Thank you for your cooperation.</p>

                        <br />
                        <p>
                            Kind regards,<br/>
                            <b>PDMR Team</b>
                        </p>
                    </body>
                    </html>
                `;

                console.log(`Sending email to: ${emp_name} (${role_type}) - ${mail_id} - Date: ${formattedDate}`);

                const result = await sendEmail(
                    [mail_id],
                    subject,
                    text,
                    cc,
                    bcc
                );

                results.push({ emp_name, mail_id, role_type, formattedDate, result });
            }

            console.log('All emails sent:', results);
            return results;
        }

    } catch (error) {
        console.error('Error ScheduleCallMail email:', error);
    }
};


export {
    AsssignedGoalSendMail,
    GoalSendToReviewerMail,
    SendForStatusBasedEmail,
    ScheduleCallMail
}
