import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    try {
        const SMTP_HOST = process.env.SMTP_HOST?.trim();
        const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
        const SMTP_USER = process.env.SMTP_USER?.trim();
        const SMTP_PASS = process.env.SMTP_PASS?.trim();
        const EMAIL_FROM = process.env.EMAIL_FROM?.trim() || SMTP_USER;

        if (!SMTP_HOST) {
            throw new Error("Missing SMTP_HOST credentials in .env");
        }

        if (!SMTP_PASS) {
            throw new Error("Missing SMTP_PASS credentials in .env");
        }

        if (!SMTP_USER) {
            throw new Error("Missing SMTP_USER credentials in .env");
        }

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: options.email,
            subject: options.subject,
            html: options.message,
        });

        console.log("Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("Email send error:", error.message);
        throw error;
    }
};

export default sendEmail;