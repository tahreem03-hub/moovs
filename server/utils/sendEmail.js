const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter; // already built, reuse it

    if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
        return null; // not configured
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
    });

    return transporter;
}

const sendDriverCredentials = async ({ email, firstName, tempPassword, companyName }) => {
    const transporter = getTransporter(); // build lazily, env is loaded by now

    // If SMTP not configured, just log the credentials
    if (!transporter) {
        return { sent: false, reason: 'smtp-not-configured' };
    }

    try {
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Your Driver Account Credentials - MOOVS',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #4CAF50;">
                        <h1 style="color: #4CAF50; margin: 0;">MOOVS</h1>
                        <p style="color: #666; margin: 5px 0;">Driver Account Credentials</p>
                    </div>

                    <div style="padding: 30px 20px;">
                        <p style="font-size: 16px; color: #333;">Dear <strong>${firstName}</strong>,</p>
                        <p style="font-size: 16px; color: #333;">Your driver account has been created for <strong>${companyName}</strong>.</p>

                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #333;">Your Login Credentials:</h3>
                            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <span style="background: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 16px;">${tempPassword}</span></p>
                        </div>

                        <p style="color: #ff6b6b; font-size: 14px; background: #fff5f5; padding: 10px; border-radius: 4px;">
                            ⚠️ For security reasons, please change your password after your first login.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${loginUrl}" style="background: #4CAF50; color: white; padding: 12px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                                Login to Your Account
                            </a>
                        </div>

                        <p style="font-size: 14px; color: #666; margin: 20px 0;">
                            If you didn't request this account, please ignore this email.
                        </p>
                    </div>

                    <div style="padding: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
                        <p>© ${new Date().getFullYear()} MOOVS. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        return { sent: false, reason: 'send-failed', error: error.message };
    }
};

module.exports = { sendDriverCredentials };