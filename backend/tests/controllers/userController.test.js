const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const AppError = require('../../utils/AppError');

describe('userController', () => {
    let userController;
    let req;
    let res;
    let next;
    let axiosStub;

    beforeEach(() => {
        req = { query: {}, body: {}, user: { uid: 'user123', email: 'test@example.com' } };
        res = {
            json: sinon.spy(),
            setHeader: sinon.spy(),
            status: sinon.stub().returnsThis(),
            send: sinon.spy(),
        };
        next = sinon.spy();
        axiosStub = sinon.stub();

        userController = proxyquire('../../controllers/userController', {
            'axios': axiosStub,
            '../services/transactionService': {
                calculateMonthlyIncome: sinon.stub().resolves(5000),
            },
            '../services/nocodbService': {
                getRecords: sinon.stub().resolves({ list: [] }),
                createRecord: sinon.stub().resolves({ Id: 1 }),
                updateRecord: sinon.stub().resolves({ Id: 1 }),
            },
            '../services/emailService': {
                sendEmail: sinon.stub().resolves(),
            },
            '../config/firebase': {
                auth: () => ({
                    generatePasswordResetLink: sinon.stub().resolves('https://example.com/reset'),
                }),
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('proxyProfileImage', () => {
        it('should block missing URLs', async () => {
            await userController.proxyProfileImage(req, res, next);
            assert.strictEqual(next.calledOnce, true);
            assert.strictEqual(next.firstCall.args[0] instanceof AppError, true);
            assert.strictEqual(next.firstCall.args[0].statusCode, 400);
            assert.strictEqual(next.firstCall.args[0].message, 'Image URL is required');
        });

        it('should block malformed URLs', async () => {
            req.query.url = 'not-a-url';
            await userController.proxyProfileImage(req, res, next);
            assert.strictEqual(next.calledOnce, true);
            assert.strictEqual(next.firstCall.args[0] instanceof AppError, true);
            assert.strictEqual(next.firstCall.args[0].statusCode, 400);
            assert.strictEqual(next.firstCall.args[0].message, 'Invalid image URL format');
        });

        it('should block invalid protocols', async () => {
            req.query.url = 'file:///etc/passwd';
            await userController.proxyProfileImage(req, res, next);
            assert.strictEqual(next.calledOnce, true);
            assert.strictEqual(next.firstCall.args[0] instanceof AppError, true);
            assert.strictEqual(next.firstCall.args[0].statusCode, 400);
            assert.strictEqual(next.firstCall.args[0].message, 'Invalid image URL protocol');
        });

        it('should block attacker domains mimicking allowed domains', async () => {
            req.query.url = 'https://attacker-googleusercontent.com/image.jpg';
            await userController.proxyProfileImage(req, res, next);
            assert.strictEqual(next.calledOnce, true);
            assert.strictEqual(next.firstCall.args[0] instanceof AppError, true);
            assert.strictEqual(next.firstCall.args[0].statusCode, 403);
            assert.strictEqual(next.firstCall.args[0].message, 'Unauthorized image domain');
        });

        it('should block unauthorized domains', async () => {
            req.query.url = 'https://attacker.com/image.jpg';
            await userController.proxyProfileImage(req, res, next);
            assert.strictEqual(next.calledOnce, true);
            assert.strictEqual(next.firstCall.args[0] instanceof AppError, true);
            assert.strictEqual(next.firstCall.args[0].statusCode, 403);
            assert.strictEqual(next.firstCall.args[0].message, 'Unauthorized image domain');
        });

        it('should allow valid root domains', async () => {
            req.query.url = 'https://googleusercontent.com/image.jpg';
            const stream = { pipe: sinon.spy() };
            axiosStub.resolves({ headers: { 'content-type': 'image/jpeg' }, data: stream });

            await userController.proxyProfileImage(req, res, next);

            assert.strictEqual(next.called, false);
            assert.strictEqual(axiosStub.calledOnce, true);
            assert.strictEqual(res.setHeader.calledWith('Content-Type', 'image/jpeg'), true);
            assert.strictEqual(stream.pipe.calledWith(res), true);
        });

        it('should allow valid subdomains', async () => {
            req.query.url = 'https://lh3.googleusercontent.com/image.jpg';
            const stream = { pipe: sinon.spy() };
            axiosStub.resolves({ headers: { 'content-type': 'image/jpeg' }, data: stream });

            await userController.proxyProfileImage(req, res, next);

            assert.strictEqual(next.called, false);
            assert.strictEqual(axiosStub.calledOnce, true);
            assert.strictEqual(res.setHeader.calledWith('Content-Type', 'image/jpeg'), true);
            assert.strictEqual(stream.pipe.calledWith(res), true);
        });
    });
});
