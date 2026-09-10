const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const AppError = require('../../utils/AppError');

describe('subscriptionController', () => {
    let subscriptionController;
    let mockNocodbService;
    let mockSubscriptionService;
    let req;
    let res;
    let next;

    beforeEach(() => {
        mockNocodbService = {
            getRecordById: sinon.stub()
        };
        mockSubscriptionService = {
            updateSubscription: sinon.stub(),
            deleteSubscription: sinon.stub()
        };
        subscriptionController = proxyquire('../../controllers/subscriptionController', {
            '../services/nocodbService': mockNocodbService,
            '../services/subscriptionService': mockSubscriptionService,
            '../utils/catchAsync': fn => fn
        });

        req = {
            user: { uid: 'user123' },
            params: { id: 'sub1' },
            body: { name: 'Netflix', amount: 10 }
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('updateSubscription', () => {
        it('should return 404 if the subscription does not exist', async () => {
            mockNocodbService.getRecordById.resolves({});

            await subscriptionController.updateSubscription(req, res, next);

            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 404);
        });

        it('should return 403 if the subscription belongs to another user (IDOR)', async () => {
            mockNocodbService.getRecordById.resolves({ Id: 'sub1', user_id: 'other-user' });

            await subscriptionController.updateSubscription(req, res, next);

            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 403);
            assert.ok(mockSubscriptionService.updateSubscription.notCalled, 'service must not be called for cross-user access');
        });

        it('should update the subscription when ownership is verified', async () => {
            mockNocodbService.getRecordById.resolves({ Id: 'sub1', user_id: 'user123' });
            mockSubscriptionService.updateSubscription.resolves({ Id: 'sub1', name: 'Netflix' });

            await subscriptionController.updateSubscription(req, res, next);

            assert.ok(mockSubscriptionService.updateSubscription.calledOnceWith('sub1', req.body));
            assert.ok(res.status.calledOnceWith(200));
            assert.ok(next.notCalled);
        });
    });

    describe('deleteSubscription', () => {
        it('should return 404 if the subscription does not exist', async () => {
            mockNocodbService.getRecordById.resolves({});

            await subscriptionController.deleteSubscription(req, res, next);

            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 404);
        });

        it('should return 403 if the subscription belongs to another user (IDOR)', async () => {
            mockNocodbService.getRecordById.resolves({ Id: 'sub1', user_id: 'other-user' });

            await subscriptionController.deleteSubscription(req, res, next);

            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 403);
            assert.ok(mockSubscriptionService.deleteSubscription.notCalled, 'service must not be called for cross-user access');
        });

        it('should delete the subscription when ownership is verified', async () => {
            mockNocodbService.getRecordById.resolves({ Id: 'sub1', user_id: 'user123' });
            mockSubscriptionService.deleteSubscription.resolves({});

            await subscriptionController.deleteSubscription(req, res, next);

            assert.ok(mockSubscriptionService.deleteSubscription.calledOnceWith('sub1'));
            assert.ok(res.status.calledOnceWith(204));
            assert.ok(next.notCalled);
        });
    });
});
