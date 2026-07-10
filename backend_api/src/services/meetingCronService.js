import cron from 'node-cron';
import connectionPool from '../database/dbConfig.js';
import { sendEmail } from '../emailUtils/emailServices.js';

// Store active cron jobs
const activeCronJobs = new Map();

// Initialize meeting reminder cron jobs
export const initializeMeetingCrons = async () => {
  console.log('🔄 Initializing meeting reminder cron jobs...');
  
  try {
    const connection = await new Promise((resolve, reject) => {
      connectionPool.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    try {
      // Get all active scheduled calls
      const query = `
        SELECT 
          id,
          mail_type,
          mail_date,
          is_active
        FROM scheduled_calls
        WHERE is_active = 1
        ORDER BY mail_date
      `;
      
      const scheduledCalls = await new Promise((resolve, reject) => {
        connection.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
      
      console.log(`📋 Found ${scheduledCalls.length} active scheduled calls`);
      
      // Create cron job for each scheduled call
      for (const call of scheduledCalls) {
         const data = {
          id: call.id,
          date: call.mail_date,
          type: call.mail_type,
          is_active: 1
        }
        createCronForScheduledCall(data);
      }
      
      console.log('✅ Meeting cron jobs initialized successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error initializing meeting crons:', error);
  }
};

// Create a cron job for a specific scheduled call
export const createCronForScheduledCall = (scheduledCall) => {
  try {
    
    const { id, date, type, is_active } = scheduledCall;
    console.log(date,"date")
    // Validate data
    if (!date) {
      console.error(`❌ Skipping call ID ${id}: date is null or undefined`);
      return;
    }

    if (is_active !== 1) {
      console.log(`⏭️ Skipping call ID ${id}: not active`);
      return;
    }
    
    // Stop existing cron if any
    if (activeCronJobs.has(id)) {
      activeCronJobs.get(id).stop();
      activeCronJobs.delete(id);
    }
    
    // Parse and validate the date
    const mailDate = new Date(date);
    
    if (isNaN(mailDate.getTime())) {
      console.error(`❌ Skipping call ID ${id}: Invalid date value "${date}"`);
      return;
    }
    
    const day = mailDate.getDate();
    
    // Validate day is between 1-31
    if (day < 1 || day > 31) {
      console.error(`❌ Skipping call ID ${id}: Invalid day ${day}`);
      return;
    }
    
    // Create cron expression: "0 11 {day} * *" means 11 AM on {day} of every month
    const cronExpression = `0 11 ${day} * *`;
    
    console.log(`📅 Scheduling cron for call ID ${id} (${type || 'N/A'}): ${cronExpression} (Day ${day} at 11 AM every month)`);
    
    // Create the cron job
    const job = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Triggering meeting reminder for call ID ${id} (${type || 'N/A'}) on day ${day} at 11 AM`);
      
      try {
        // Get recipient emails from database or use default
        const to = ["nikita@pdmrindia.com"];
        
        // Prepare email content
        const formattedDate = mailDate.toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        const subject = `Reminder: ${type || 'Monthly'} Meeting Scheduled for ${formattedDate}`;
        
        const text = `
          <html>
          <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            
            <p>Dear Team,</p>
            
            <p>
              This is a reminder about your scheduled <b>${type || 'Monthly'}</b> meeting on <b>${formattedDate}</b> at <b>11:00 AM</b>.
            </p>
            
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f2f2f2;">
                <th align="left">Meeting Type</th>
                <td>${type || 'Monthly Meeting'}</td>
              </tr>
              <tr>
                <th align="left">Meeting Date</th>
                <td>${formattedDate}</td>
              </tr>
              <tr>
                <th align="left">Time</th>
                <td>11:00 AM</td>
              </tr>
            </table>
            
            <p>Please make sure to attend the meeting.</p>
            
            <p>
              Kind regards,<br/>
              <b>PDMR Team</b>
            </p>
            
          </body>
          </html>
        `;
        
        const cc = [];
        const bcc = [];
        
        // Send email using your existing service
        const mailResult = await sendEmail(to, subject, text, cc, bcc);
        
        // Log the result in database
        const connection = await new Promise((resolve, reject) => {
          connectionPool.getConnection((err, conn) => {
            if (err) return reject(err);
            resolve(conn);
          });
        });

        try {
          await new Promise((resolve, reject) => {
            connection.query(
              `INSERT INTO email_logs (scheduled_call_id, recipient_emails, status, sent_at, error_message) 
               VALUES (?, ?, ?, NOW(), ?)`,
              [
                id, 
                JSON.stringify(to), 
                mailResult?.success ? 'sent' : 'failed',
                mailResult?.error || null
              ],
              (err) => {
                if (err) return reject(err);
                resolve();
              }
            );
          });
        } finally {
          connection.release();
        }
        
        if (mailResult?.success) {
          console.log(`✅ Meeting reminder sent for call ID ${id} (${type || 'N/A'}) to ${to.join(', ')}`);
        } else {
          console.error(`❌ Failed to send reminder for call ID ${id}:`, mailResult?.error);
        }
        
      } catch (error) {
        console.error(`❌ Error processing meeting reminder for call ID ${id}:`, error);
      }
    });
    
    // Store the job
    activeCronJobs.set(id, job);
    
    console.log(`✅ Cron job created for call ID ${id} - Runs on day ${day} at 11 AM every month`);
    
  } catch (error) {
    console.error(`❌ Error creating cron for call ID ${scheduledCall.id}:`, error);
  }
};

// Update cron when date changes
export const updateCronForScheduledCall = async (callId) => {
  try {
    const connection = await new Promise((resolve, reject) => {
      connectionPool.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    try {
      const query = `
        SELECT 
          id,
          mail_type,
          mail_date,
          is_active
        FROM scheduled_calls
        WHERE id = ?
      `;
      
      const scheduledCall = await new Promise((resolve, reject) => {
        connection.query(query, [callId], (err, results) => {
          if (err) return reject(err);
          resolve(results[0]);
        });
      });
      
      if (scheduledCall && scheduledCall.is_active === 1) {
        //console.log(scheduledCall,"scheduledCall")
        const data = {
          id: scheduledCall.id,
          date: scheduledCall.mail_date,
          type: scheduledCall.mail_type,
          is_active: 1
        }
        createCronForScheduledCall(data);
        
        console.log(`🔄 Cron job updated for call ID ${callId}`);
      } else {
        // If not active, stop the cron
        stopCronForScheduledCall(callId);
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`❌ Error updating cron for call ID ${callId}:`, error);
  }
};

// Refresh all crons (useful after bulk updates)
export const refreshAllCrons = async () => {
  console.log('🔄 Refreshing all cron jobs...');
  
  // Stop all existing crons
  activeCronJobs.forEach((job, id) => {
    job.stop();
  });
  activeCronJobs.clear();
  
  // Reinitialize
  await initializeMeetingCrons();
};

// Stop a specific cron job
export const stopCronForScheduledCall = (callId) => {
  if (activeCronJobs.has(callId)) {
    activeCronJobs.get(callId).stop();
    activeCronJobs.delete(callId);
    console.log(`⏹️ Cron job stopped for call ID ${callId}`);
  }
};

// Get all active cron jobs info
export const getActiveCronJobs = () => {
  const jobs = [];
  activeCronJobs.forEach((job, id) => {
    jobs.push({ call_id: id, status: 'running' });
  });
  return jobs;
};

//ScheduleCall Alert Mail
export const SchedulerCallAlertCrons = async () => {

  let connection;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeOnly = now.toTimeString().split(' ')[0].slice(0, 5);
  try {
    connection = await new Promise((resolve, reject) => {
      connectionPool.getConnection((err, conn) => {
          if (err) return reject(err);
          resolve(conn);
      });
    });

    // Employee Data
    const employeeQuery = `
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

    const EmpPostionData = await new Promise((resolve, reject) => {
        connection.query(employeeQuery, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });

    // Schedule Data
    const scheduleQuery = `
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

    const scheduleData = await new Promise((resolve, reject) => {
        connection.query(scheduleQuery, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });

     // Separate schedule dates by role
    const functionalHeadDate = scheduleData.find(row => row.mail_type === 'Functional Head');
    const assistantManagerDate = scheduleData.find(row => row.mail_type === 'Assistant Manager');

    const functionalHeadDateOnly = functionalHeadDate?.mail_date
        ? new Date(functionalHeadDate.mail_date).toISOString().split('T')[0]
        : null;

    const assistantManagerDateOnly = assistantManagerDate?.mail_date
        ? new Date(assistantManagerDate.mail_date).toISOString().split('T')[0]
        : null;
   

    const subject = "Current Month On Alert Schedule Call - Goal Management Review Meeting";
    const cc = [];
    const bcc = [];
    const results = [];

    for (const emp of EmpPostionData) {
      const { emp_name, mail_id, role_type } = emp;

      const roleGreeting = `Dear ${emp_name},`;

      let scheduleDate  = '';
      let formattedDate = '[Date Not Set]';
      let roleMessage   = '';

      // Set date based on role
      if (role_type === 'Senior Manager') {
          scheduleDate = functionalHeadDateOnly;
      } else if (role_type === 'Assistant Manager') {
          scheduleDate = assistantManagerDateOnly;
      }

      if (!scheduleDate) {
          continue;
      }


      if (!scheduleDate) {
          console.log("Schedule Date Empty");
          continue;
      }

      const todayDate = new Date(today);
      const mailDate = new Date(scheduleDate);

      // ✅ Fixed (gives +2 when mail date is 2 days ahead)
      const diffDays = Math.floor(
          (mailDate.getTime() - todayDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
     

      /* const diffDays = Math.floor((currentDateOnly - mailDateOnly) / (1000 * 60 * 60 * 24)); */

      //console.log(`${emp_name} - ${role_type} - Diff Days: ${diffDays}`);
      const time = "09:00";
      // Send only when difference is exactly 2 days
      if (diffDays !== 2 ) {
          continue;
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
      
     /*  console.log(`Sending email to: ${emp_name} (${role_type}) - ${mail_id} - Date: ${formattedDate}`);

      console.log(timeOnly,"current time");
      console.log(time,"set time"); */
      
      if(diffDays === 2 && time === "09:00")
      {
        const result = await sendEmail(
            [mail_id],
            subject,
            text,
            cc,
            bcc
        ); 
        results.push({ emp_name, mail_id, role_type, formattedDate, result });
      }
     
    } 
    return results; 
  } catch (error) {
     console.error('Error ScheduleCallMail email:', error); 
  }

};

// ✅ Bottom of file - cron schedule
cron.schedule('0 9 * * *', async () => {
    const now = new Date();
    const hours   = now.getHours();   // 9
    const minutes = now.getMinutes(); // 0

    // ✅ Only run at exactly 09:00
    if (hours === 9 && minutes === 0) {
        console.log('⏰ Exact 09:00 - Running SchedulerCallAlertCrons...');
        await SchedulerCallAlertCrons();
    } else {
        console.log(`⛔ Skipped - Current time: ${hours}:${minutes}`);
    }
});