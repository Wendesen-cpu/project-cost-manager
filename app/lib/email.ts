import nodemailer from 'nodemailer';

export async function sendOtpEmail(email: string, otp: string) {
    console.log(`[EMAIL MOCK] Sending OTP ${otp} to ${email}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.SMTP_USER || 'user',
            pass: process.env.SMTP_PASS || 'pass',
        },
    });

    // If no real SMTP is configured, we stop here in dev (logging above is enough)
    // unless explicit env vars are set.
    if (!process.env.SMTP_HOST) {
        return;
    }

    try {
        await transporter.sendMail({
            from: '"Project Cost Manager" <no-reply@projectcostmanager.com>',
            to: email,
            subject: 'Your Admin Approval OTP',
            text: `Your OTP code is: ${otp}`,
            html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
