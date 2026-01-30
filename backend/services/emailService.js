const nodemailer = require('nodemailer');
const env = require('../config/env');
const { compileTemplate } = require('./emailTemplateService');
const logger = require('../config/logger');

let transporter = null;

const initTransporter = async () => {
    if (transporter) return transporter;

    const host = env.SMTP.HOST || 'smtp.gmail.com';
    const port = parseInt(env.SMTP.PORT) || 587;
    const user = env.SMTP.USER ? env.SMTP.USER.trim().replace(/^["'](.+)["']$/, '$1') : null;
    // Remove quotes AND all spaces from the password
    const pass = env.SMTP.PASS ? env.SMTP.PASS.trim().replace(/^["'](.+)["']$/, '$1').replace(/\s+/g, '') : null;

    if (env.NODE_ENV === 'development' && !user) {
        // Use Ethereal for testing if no SMTP creds in dev
        logger.info('📧 Email Service: Using Ethereal (Fake SMTP) for development');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } else {
        logger.info(`📧 Email Service: Initializing SMTP (${host}:${port}) for ${user}`);
        // Use Real SMTP
        transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465, // true for 465, false for other ports (like 587)
            auth: {
                user: user,
                pass: pass
            }
        });

        try {
            await transporter.verify();
            logger.info('✅ Email Service: SMTP connection verified successfully.');
        } catch (verifyError) {
            logger.error(`❌ Email Service: SMTP verification failed: ${verifyError.message}`);
        }
    }
    return transporter;
};

/**
 * Sends a branded email using a template.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} templateName - Name of the .hbs template file.
 * @param {object} context - Variables for the template.
 */
const sendEmail = async (to, subject, templateName, context) => {
    try {
        const html = await compileTemplate(templateName, context);
        const transport = await initTransporter();

        const from = env.SMTP.FROM || env.SMTP.USER;
        
        if (!from) {
            throw new Error('SMTP_FROM or SMTP_USER must be defined in environment variables.');
        }

        const mailOptions = {
            from: from,
            to,
            subject,
            html
        };

        const info = await transport.sendMail(mailOptions);
        logger.info(`📧 Email sent to ${to}: ${info.messageId}`);

        if (env.NODE_ENV === 'development' && !env.SMTP.USER) {
            logger.info(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        
        return info;
    } catch (error) {
        logger.error(`❌ Email Service Error: ${error.message}`);
        throw error; // Re-throw so controller can handle it
    }
};

module.exports = {
    sendEmail
};