const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const AppError = require('../../utils/AppError');

describe('loggingController.logError Security Tests', () => {
    let loggingController;
    let loggerMock;
    let req;
    let res;
    let next;

    beforeEach(() => {
        loggerMock = {
            error: sinon.stub()
        };

        loggingController = proxyquire('../../controllers/loggingController', {
            '../config/logger': loggerMock
        });

        res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub().returnsThis()
        };
        next = sinon.stub();
    });

    it('should validate missing message', () => {
        req = { body: {} };
        loggingController.logError(req, res, next);

        assert.ok(next.calledOnce);
        const error = next.firstCall.args[0];
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 400);
        assert.strictEqual(error.message, 'Invalid or missing error message');
        assert.ok(!loggerMock.error.called);
    });

    it('should validate message length', () => {
        req = { body: { message: 'a'.repeat(2001) } };
        loggingController.logError(req, res, next);

        assert.ok(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0].message, 'Invalid or missing error message');
    });

    it('should validate stack length', () => {
        req = { body: { message: 'Valid message', stack: 'a'.repeat(5001) } };
        loggingController.logError(req, res, next);

        assert.ok(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0].message, 'Invalid stack trace');
    });

    it('should validate url length', () => {
        req = { body: { message: 'Valid message', url: 'a'.repeat(1001) } };
        loggingController.logError(req, res, next);

        assert.ok(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0].message, 'Invalid URL');
    });

    it('should log valid error and include userId if available', () => {
        req = {
            body: { message: 'Test error', stack: 'Test stack', url: '/test', timestamp: '2023-01-01' },
            ip: '127.0.0.1',
            get: sinon.stub().withArgs('User-Agent').returns('Test Agent'),
            user: { uid: 'user123' }
        };

        loggingController.logError(req, res, next);

        assert.ok(res.status.calledWith(204));
        assert.ok(loggerMock.error.calledOnce);
        const logArgs = loggerMock.error.firstCall.args[1];
        assert.strictEqual(logArgs.message, 'Test error');
        assert.strictEqual(logArgs.userId, 'user123');
    });
});
