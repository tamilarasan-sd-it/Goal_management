import nodemailer from 'nodemailer';
import inlineBase64 from 'nodemailer-plugin-inline-base64';



// Create the transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_USER_EMAIL,
        pass: process.env.AUTH_USER_PASSWORD
    }
});

transporter.use('compile', inlineBase64({ cidPrefix: 'somePrefix_' }));

// Define the email sending function
const sendEmail = async (to, subject, text, ccList = [], bccList = [], attachments = []) => {
    const mailOptions = {
        from: process.env.AUTH_USER_EMAIL,
        to: to,
        subject: subject,
        cc: ccList,
        bcc: bccList,
        html: text.replace(/<br\s*[\/]?>/gi, '\n'),
        attachments: attachments
    };

    const plainHtml = text

    // console.log(mailOptions, "mailoptions");

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { success: true, message: 'Email sent successfully', mailOptions: { ...mailOptions, plainHtml } };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send email' };
    }
};

export {
    sendEmail
}


// ---- this is for check credentials with google

// Steps to Validate Email Credentials Using Google API
// Set Up Google API:
// Create a project in the Google Developers Console.
// Enable the Gmail API for your project.
// Set up OAuth 2.0 credentials to obtain an access token.
// Authenticate with OAuth 2.0:
// Use OAuth 2.0 to authenticate users instead of using their email and password directly. This is a more secure method.
// Use the users.getProfile Method:
// Once authenticated, you can call the users.getProfile method to check if the credentials are valid.

// import { google } from 'googleapis';

// // Function to validate email credentials
// const validateEmailCredentials = async (email, accessToken) => {
//     const gmail = google.gmail({ version: 'v1', auth: accessToken });

//     try {
//         const response = await gmail.users.getProfile({ userId: email });
//         console.log('Valid credentials for:', response.data.emailAddress);
//         return true; // Valid credentials
//     } catch (error) {
//         console.error('Invalid credentials:', error.message);
//         return false; // Invalid credentials
//     }
// };

// // Example usage
// const email = 'user@gmail.com';
// const accessToken = 'YOUR_ACCESS_TOKEN'; // Obtain this through OAuth 2.0 flow

// validateEmailCredentials(email, accessToken)
//     .then(isValid => {
//         if (isValid) {
//             console.log('Email and password are valid.');
//         } else {
//             console.log('Invalid email or password.');
//         }
//     });