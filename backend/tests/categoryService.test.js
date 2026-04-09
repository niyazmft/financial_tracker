const assert = require('assert');
const sinon = require('sinon');
const categoryService = require('../services/categoryService');
const nocodbService = require('../services/nocodbService');

describe('Category Service', () => {
    let getRecordsStub;
    let consoleErrorStub;
    let _consoleWarnStub;

    beforeEach(() => {
        getRecordsStub = sinon.stub(nocodbService, 'getRecords');
        consoleErrorStub = sinon.stub(console, 'error');
        _consoleWarnStub = sinon.stub(console, 'warn');
        categoryService.clearCategoryCache();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('fetchCategoriesFromDB', () => {
        it('should fetch and map categories correctly', async () => {
            const userId = 'user123';
            const mockCategories = {
                list: [
                    { Id: 1, category_name: 'Salary', type: 'earning' },
                    { Id: 2, category_name: 'Rent', type: 'spending' },
                    { Id: 3, category_name: 'Gift', type: 'earning' },
                    { Id: 4, category_name: 'Food', type: 'spending' }
                ]
            };

            getRecordsStub.resolves(mockCategories);

            const result = await categoryService.fetchCategoriesFromDB(userId);

            assert.strictEqual(Object.keys(result.mapping).length, 4);
            assert.strictEqual(result.mapping[1], 'Salary');
            assert.deepStrictEqual(result.spendingCategories, [2, 4]);
            assert.deepStrictEqual(result.earningCategories, [1, 3]);

            assert.ok(getRecordsStub.calledOnce);
            assert.ok(getRecordsStub.firstCall.args[1].where.includes(`(user_id,eq,${userId})`));
        });

        it('should return empty data if no categories found', async () => {
            getRecordsStub.resolves({ list: [] });

            const result = await categoryService.fetchCategoriesFromDB('user123');

            assert.deepStrictEqual(result.mapping, {});
            assert.deepStrictEqual(result.spendingCategories, []);
            assert.deepStrictEqual(result.earningCategories, []);
        });

        it('should return null and log error if nocodb service throws', async () => {
            getRecordsStub.rejects(new Error('NocoDB Error'));

            const result = await categoryService.fetchCategoriesFromDB('user123');

            assert.strictEqual(result, null);
            assert.ok(consoleErrorStub.calledOnce);
        });
        
        it('should use cached data if available and not expired', async () => {
            const userId = 'user_cache';
            const mockCategories = {
                list: [
                    { Id: 1, category_name: 'Salary', type: 'earning' }
                ]
            };
            getRecordsStub.resolves(mockCategories);

            const result1 = await categoryService.fetchCategoriesFromDB(userId);
            const result2 = await categoryService.fetchCategoriesFromDB(userId);

            assert.strictEqual(result1, result2); // Exact same object returned
            assert.ok(getRecordsStub.calledOnce); // should only call DB once
        });
    });

    describe('getCategories', () => {
        it('should fetch categories successfully', async () => {
            const mockList = [{ Id: 1, category_name: 'Salary', type: 'earning' }];
            getRecordsStub.resolves({ list: mockList });

            const result = await categoryService.getCategories();
            assert.deepStrictEqual(result, mockList);
            assert.ok(getRecordsStub.calledOnce);
        });

        it('should throw an error if nocodb service throws', async () => {
            const error = new Error('NocoDB Error');
            getRecordsStub.rejects(error);

            await assert.rejects(categoryService.getCategories(), error);
            assert.ok(getRecordsStub.calledOnce);
            assert.ok(consoleErrorStub.calledOnce);
        });
    });

    describe('Helper functions fallback handling', () => {
        it('getCategoryMapping should fallback to empty object if fetch fails', async () => {
            getRecordsStub.rejects(new Error('API failure'));
            const result = await categoryService.getCategoryMapping('user1');
            assert.deepStrictEqual(result, {});
        });

        it('getSpendingCategoryIds should fallback to empty array if fetch fails', async () => {
            getRecordsStub.rejects(new Error('API failure'));
            const result = await categoryService.getSpendingCategoryIds('user1');
            assert.deepStrictEqual(result, []);
        });

        it('getEarningCategoryIds should fallback to empty array if fetch fails', async () => {
            getRecordsStub.rejects(new Error('API failure'));
            const result = await categoryService.getEarningCategoryIds('user1');
            assert.deepStrictEqual(result, []);
        });
    });
});
