const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('cashFlowController', () => {
    let cashFlowController;
    let mockCashFlowService;
    let req;
    let res;
    let next;

    beforeEach(() => {
        mockCashFlowService = {
            computeForecast: sinon.stub(),
            computeConfidenceBands: sinon.stub()
        };
        cashFlowController = proxyquire('../../controllers/cashFlowController', {
            '../services/cashFlowService': mockCashFlowService,
            '../utils/catchAsync': fn => fn
        });

        req = {
            user: { uid: 'user123' },
            query: {}
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

    describe('getCashFlowForecast', () => {
        it('should default to 30 days when duration is missing', async () => {
            mockCashFlowService.computeForecast.resolves({ dailyBalances: [], warnings: [] });
            mockCashFlowService.computeConfidenceBands.returns([]);

            await cashFlowController.getCashFlowForecast(req, res, next);

            assert.ok(mockCashFlowService.computeForecast.calledOnceWith('user123', { duration: 30 }));
        });

        it('should clamp an excessively large duration to the max (DoS guard)', async () => {
            req.query.duration = '999999999';
            mockCashFlowService.computeForecast.resolves({ dailyBalances: [], warnings: [] });
            mockCashFlowService.computeConfidenceBands.returns([]);

            await cashFlowController.getCashFlowForecast(req, res, next);

            // Must be clamped to MAX_FORECAST_DURATION (365), not passed through raw
            const durationArg = mockCashFlowService.computeForecast.firstCall.args[1].duration;
            assert.ok(durationArg <= 365, `duration should be clamped to 365, got ${durationArg}`);
        });

        it('should clamp a negative duration to a minimum of 1', async () => {
            req.query.duration = '-50';
            mockCashFlowService.computeForecast.resolves({ dailyBalances: [], warnings: [] });
            mockCashFlowService.computeConfidenceBands.returns([]);

            await cashFlowController.getCashFlowForecast(req, res, next);

            const durationArg = mockCashFlowService.computeForecast.firstCall.args[1].duration;
            assert.strictEqual(durationArg, 1);
        });
    });
});
