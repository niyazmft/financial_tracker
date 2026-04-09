const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const env = require('../config/env');
const logger = require('../config/logger');

describe('Email Service', () => {
    let emailService;
    let nodemailerMock;
    let templateServiceMock;
    let transportMock;
    let originalEnv;

    beforeEach(() => {
        // Save original env values
        originalEnv = { ...env, SMTP: { ...env.SMTP } };

        // Setup transport mock
        transportMock = {
            sendMail: sinon.stub().resolves({ messageId: 'test-message-id' }),
            verify: sinon.stub().resolves(true)
        };

        // Setup nodemailer mock
        nodemailerMock = {
            createTransport: sinon.stub().returns(transportMock),
            createTestAccount: sinon.stub().resolves({ user: 'test-user', pass: 'test-pass' }),
            getTestMessageUrl: sinon.stub().returns('http://test-url.com')
        };

        // Setup template service mock
        templateServiceMock = {
            compileTemplate: sinon.stub().resolves('<h1>Test HTML</h1>')
        };

        // Mock logger to avoid noise in test output
        sinon.stub(logger, 'info');
        sinon.stub(logger, 'error');

        // Reset transporter cached in module scope by requiring freshly
        emailService = proxyquire('../services/emailService', {
            'nodemailer': nodemailerMock,
            '../services/emailTemplateService': templateServiceMock,
            '../config/logger': logger
        });

        // ensure default clean state for env
        env.NODE_ENV = 'production';
        env.SMTP.USER = 'user@example.com';
        env.SMTP.FROM = 'from@example.com';
    });

    afterEach(() => {
        sinon.restore();
        // Restore env
        Object.assign(env, originalEnv);
        env.SMTP = originalEnv.SMTP;
    });

    describe('sendEmail', () => {
        it('should successfully send an email', async () => {
            const to = 'recipient@example.com';
            const subject = 'Test Subject';
            const templateName = 'testTemplate';
            const context = { name: 'Test' };

            const result = await emailService.sendEmail(to, subject, templateName, context);

            assert.strictEqual(result.messageId, 'test-message-id');
            assert(templateServiceMock.compileTemplate.calledOnceWithExactly(templateName, context));
            assert(nodemailerMock.createTransport.calledOnce);

            const mailOptions = transportMock.sendMail.getCall(0).args[0];
            assert.strictEqual(mailOptions.from, env.SMTP.FROM);
            assert.strictEqual(mailOptions.to, to);
            assert.strictEqual(mailOptions.subject, subject);
            assert.strictEqual(mailOptions.html, '<h1>Test HTML</h1>');
        });

        it('should fallback to env.SMTP.USER if env.SMTP.FROM is not set', async () => {
            env.SMTP.FROM = undefined;
            env.SMTP.USER = 'user@example.com';

            // Need to recreate service to get a fresh local transporter cache
            emailService = proxyquire('../services/emailService', {
                'nodemailer': nodemailerMock,
                '../services/emailTemplateService': templateServiceMock,
                '../config/logger': logger
            });

            await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {});

            const mailOptions = transportMock.sendMail.getCall(0).args[0];
            assert.strictEqual(mailOptions.from, 'user@example.com');
        });

        it('should throw an error if from/user context is missing', async () => {
            env.SMTP.FROM = undefined;
            env.SMTP.USER = undefined;

            emailService = proxyquire('../services/emailService', {
                'nodemailer': nodemailerMock,
                '../services/emailTemplateService': templateServiceMock,
                '../config/logger': logger
            });

            await assert.rejects(
                async () => await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {}),
                { message: 'SMTP_FROM or SMTP_USER must be defined in environment variables.' }
            );
        });

        it('should re-throw and log error if compileTemplate fails', async () => {
            templateServiceMock.compileTemplate.rejects(new Error('Template Compilation Failed'));

            await assert.rejects(
                async () => await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {}),
                { message: 'Template Compilation Failed' }
            );
            assert(logger.error.calledOnce);
        });

        it('should re-throw and log error if sendMail fails', async () => {
            transportMock.sendMail.rejects(new Error('SMTP Error'));

            await assert.rejects(
                async () => await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {}),
                { message: 'SMTP Error' }
            );
            assert(logger.error.calledOnce);
        });

        it('should use Ethereal in development environment without SMTP.USER', async () => {
            env.NODE_ENV = 'development';
            env.SMTP.USER = undefined;
            env.SMTP.FROM = 'from@test.com'; // bypass missing from error

            emailService = proxyquire('../services/emailService', {
                'nodemailer': nodemailerMock,
                '../services/emailTemplateService': templateServiceMock,
                '../config/logger': logger
            });

            await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {});

            assert(nodemailerMock.createTestAccount.calledOnce);
            const transportArgs = nodemailerMock.createTransport.getCall(0).args[0];
            assert.strictEqual(transportArgs.host, 'smtp.ethereal.email');
            assert(logger.info.calledWithMatch(/Using Ethereal/));
            assert(logger.info.calledWithMatch(/Preview URL/));
        });
    });
});
