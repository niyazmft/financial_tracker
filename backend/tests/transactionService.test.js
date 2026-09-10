const assert = require('assert');
const sinon = require('sinon');
const transactionService = require('../services/transactionService');
const nocodbService = require('../services/nocodbService');
const categoryService = require('../services/categoryService');
const env = require('../config/env');
const AppError = require('../utils/AppError');

describe('Transaction Service', () => {
    let getRecordsStub;
    let getAllRecordsStub;
    let getCategoryMappingStub;

    beforeEach(() => {
        getRecordsStub = sinon.stub(nocodbService, 'getRecords');
        getAllRecordsStub = sinon.stub(nocodbService, 'getAllRecords');
        getCategoryMappingStub = sinon.stub(categoryService, 'getCategoryMapping');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should fetch transactions and format them correctly', async () => {
        const userId = 'user123';
        const mockRecords = {
            list: [
                {
                    Id: 1,
                    date: '2023-01-01',
                    amount: 100.50,
                    bank: 'test bank',
                    categories_id: 10,
                    description: 'Test Transaction'
                }
            ],
            pageInfo: { totalRows: 1 }
        };

        const mockCategoryMapping = {
            10: 'Groceries'
        };

        getAllRecordsStub.resolves(mockRecords.list);
        getCategoryMappingStub.resolves(mockCategoryMapping);

        const result = await transactionService.getTransactions(userId, {});

        // Verify NocoDB call
        assert.ok(getAllRecordsStub.calledOnce);
        const callArgs = getAllRecordsStub.firstCall.args;
        assert.strictEqual(callArgs[0], env.NOCODB.TABLES.BANK_STATEMENTS);
        assert.ok(callArgs[1].where.includes(`(user_id,eq,${userId})`));

        // Verify Result Format
        assert.strictEqual(result.transactions.length, 1);
        assert.strictEqual(result.transactions[0].category, 'Groceries');
        assert.strictEqual(result.transactions[0].bank, 'Test bank'); // capitalized
        assert.strictEqual(result.statistics.totalAmount, 100.5);
    });

    it('should handle pagination correctly', async () => {
        const userId = 'user123';
        
        // Mock first page (full page)
        getAllRecordsStub.resolves(Array(1001).fill({ Id: 1, amount: 10 }));

        getCategoryMappingStub.resolves({});

        const result = await transactionService.getTransactions(userId, {});

        assert.ok(getAllRecordsStub.calledOnce);
        assert.strictEqual(result.transactions.length, 1001);
    });

    it('should calculate monthly income estimate correctly', async () => {
        const userId = 'user123';
        const earningCategoryIds = [5, 6];

        sinon.stub(categoryService, 'getEarningCategoryIds').resolves(earningCategoryIds);

        // Mock 2 months of income
        const mockIncomeRecords = {
            list: [
                { date: '2023-01-15', amount: 1000 },
                { date: '2023-01-30', amount: 500 }, // Total Jan: 1500
                { date: '2023-02-15', amount: 2000 }  // Total Feb: 2000
            ]
        };

        getRecordsStub.resolves(mockIncomeRecords);

        const estimate = await transactionService.calculateMonthlyIncome(userId);

        // (1500 + 2000) / 2 = 1750
        assert.strictEqual(estimate, 1750);
        
        assert.ok(getRecordsStub.calledOnce);
        // Verify filters
        const callArgs = getRecordsStub.firstCall.args;
        assert.ok(callArgs[1].where.includes(`(categories_id,in,5,6)`));
    });

    it('should reject an invalid startDate with AppError 400 (filter injection guard)', async () => {
        const userId = 'user123';
        getCategoryMappingStub.resolves({});

        // A malicious date string that could inject NocoDB filter operators
        await assert.rejects(
            () => transactionService.getTransactions(userId, { startDate: '2024-01-01)~or(user_id,eq,attacker', endDate: '2024-12-31' }),
            (err) => {
                assert.ok(err instanceof AppError);
                assert.strictEqual(err.statusCode, 400);
                return true;
            }
        );
        // NocoDB must not be called with the unvalidated input
        assert.ok(getAllRecordsStub.notCalled);
    });

    it('should reject an invalid endDate with AppError 400', async () => {
        const userId = 'user123';
        getCategoryMappingStub.resolves({});

        await assert.rejects(
            () => transactionService.getTransactions(userId, { startDate: '2024-01-01', endDate: 'not-a-date' }),
            (err) => {
                assert.ok(err instanceof AppError);
                assert.strictEqual(err.statusCode, 400);
                return true;
            }
        );
        assert.ok(getAllRecordsStub.notCalled);
    });

    it('should pass validated dates into the NocoDB where clause', async () => {
        const userId = 'user123';
        getCategoryMappingStub.resolves({});
        getAllRecordsStub.resolves([]);

        await transactionService.getTransactions(userId, { startDate: '2024-01-01', endDate: '2024-12-31' });

        assert.ok(getAllRecordsStub.calledOnce);
        const where = getAllRecordsStub.firstCall.args[1].where;
        assert.ok(where.includes('(date,ge,exactDate,2024-01-01)'));
        assert.ok(where.includes('(date,le,exactDate,2024-12-31)'));
    });
});
