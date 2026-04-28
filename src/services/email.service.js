require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

//verifying the connection configuration
transporter.verify((error, success) =>{
    if(error){
        console.error('error connecting to email server', error);

    } else {
        console.log('email server is ready to send mseesages')
    }
});


//function to send emails 
const sendEmail = async(to, subject, text, html)=>{
    try{
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, //sender address
            to, 
            subject, 
            text, 
            html, 
        });
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    } catch(error){
        console.log("error sending the email:", error);
    }
    
}

async function sendRegistrationEmail(userEmail, name){
    const subject = "Welcome to Backend Ledger";
    const text = `Hello ${name}, \n\nThank you for registering at Backend Ledger.\n\nBest regards,\nBackend Ledger Team`;
    const html = `<h2>Hello ${name},</h2><p>Thank you for registering at <strong>Backend Ledger</strong>.</p><p>Best regards,<br>Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendLoginEmail(userEmail, name, loginInfo) {
    const subject = "New Login Detected";
    const text = `Hello ${name},\n\nA new login was detected on your account.\n\nTime: ${loginInfo.time}\nDevice: ${loginInfo.device}\nLocation: ${loginInfo.location}\n\nIf this wasn't you, please secure your account immediately.\n\nBest regards,\nBackend Ledger Team`;
    const html = `
        <h2>Hello ${name},</h2>
        <p>A new login was detected on your account.</p>
        <table style="border-collapse: collapse;">
            <tr><td><strong>Time:</strong></td><td>${loginInfo.time}</td></tr>
            <tr><td><strong>Device:</strong></td><td>${loginInfo.device}</td></tr>
            <tr><td><strong>Location:</strong></td><td>${loginInfo.location}</td></tr>
        </table>
        <p style="color: red;">If this wasn't you, please secure your account immediately.</p>
        <p>Best regards,<br>Backend Ledger Team</p>
    `;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionAlertEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Alert";
    const text = `Hello ${name},\n\nA transaction of $${amount} was made from your account to account ${toAccount}.\n.\n\nBest regards,\nBackend Ledger Team`;
    const html = `
        <h2>Hello ${name},</h2>
        <p>A transaction of <strong>$${amount}</strong> was made from your account to account <strong>${toAccount}</strong>.</p>
        <p style="color: red;"></p>
        <p>Best regards,<br>Backend Ledger Team</p>
    `;
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Failed";
    const text = `Hello ${name},\n\nA transaction of $${amount} to account ${toAccount} has failed.\n.\n\nBest regards,\nBackend Ledger Team`;
    const html = `
        <h2>Hello ${name},</h2>
        <p>A transaction of <strong>$${amount}</strong> to account <strong>${toAccount}</strong> has failed.</p>
        <p style="color: red;"></p>
        <p>Best regards,<br>Backend Ledger Team</p>
    `;
    await sendEmail(userEmail, subject, text, html);
}


module.exports = { transporter, sendEmail, sendRegistrationEmail, sendLoginEmail, sendTransactionAlertEmail, sendTransactionFailureEmail };


