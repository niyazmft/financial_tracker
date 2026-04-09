const assert = require('assert');
const sinon = require('sinon');
const nocodbService = require('../services/nocodbService');
const transactionController = require('../controllers/transactionController');
const budgetController = require('../controllers/budgetController');
const taggingRulesController = require('../controllers/taggingRulesController');
const savingsGoalController = require('../controllers/savingsGoalController');
const AppError = require('../utils/AppError');

describe('Security Vulnerability Tests - Record Existence Checks', () => {
    let getRecordByIdStub;
    let next;
    let req;
    let res;

    beforeEach(() => {
        getRecordByIdStub = sinon.stub(nocodbService, 'getRecordById');
        next = sinon.spy();
        res = {
            json: sinon.spy(),
            status: sinon.stub().returns({ json: sinon.spy() })
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Transaction Controller', () => {
        it('getTransactionById should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = { params: { id: 'non-existent' }, user: { uid: 'user123' } };

            await transactionController.getTransactionById(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
            // If it's not fixed, it will throw TypeError: Cannot read property 'user_id' of null
        });

        it('updateTransaction should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = {
                params: { id: 'non-existent' },
                user: { uid: 'user123' },
                body: { date: '2023-01-01', amount: 100, bank: 'bank', categories_id: 1 }
            };

            await transactionController.updateTransaction(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });

        it('deleteTransaction should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = { params: { id: 'non-existent' }, user: { uid: 'user123' } };

            await transactionController.deleteTransaction(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });
    });

    describe('Budget Controller', () => {
        it('updateBudget should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = {
                params: { id: 'non-existent' },
                user: { uid: 'user123' },
                body: { categories_id: 1, target_amount: 100, start_date: '2023-01-01', end_date: '2023-01-31' }
            };

            await budgetController.updateBudget(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });

        it('deleteBudget should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = { params: { id: 'non-existent' }, user: { uid: 'user123' } };

            await budgetController.deleteBudget(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });
    });

    describe('Tagging Rules Controller', () => {
        it('updateRule should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = {
                params: { id: 'non-existent' },
                user: { uid: 'user123' },
                body: { keyword: 'test', category_id: 1 }
            };

            await taggingRulesController.updateRule(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });

        it('deleteRule should handle non-existent record', async () => {
            getRecordByIdStub.resolves(null);
            req = { params: { id: 'non-existent' }, user: { uid: 'user123' } };

            await taggingRulesController.deleteRule(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });
    });

    describe('Savings Goal Controller', () => {
        it('updateGoal should handle non-existent record and check ownership', async () => {
            getRecordByIdStub.resolves(null);
            req = {
                params: { id: 'non-existent' },
                user: { uid: 'user123' },
                body: { goal_name: 'test', target_amount: 1000, priority: 1, target_date: '2023-12-31' }
            };

            await savingsGoalController.updateGoal(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });

        it('deleteGoal should handle non-existent record and check ownership', async () => {
            getRecordByIdStub.resolves(null);
            req = { params: { id: 'non-existent' }, user: { uid: 'user123' } };

            await savingsGoalController.deleteGoal(req, res, next);

            assert.ok(next.calledOnce);
            const error = next.firstCall.args[0];
            assert.ok(error instanceof AppError);
        });
    });
});
