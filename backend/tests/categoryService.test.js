const assert = require('assert');
const sinon = require('sinon');
const categoryService = require('../services/categoryService');
const nocodbService = require('../services/nocodbService');
const env = require('../config/env');

describe('Category Service', () => {
    let getRecordsStub;

    beforeEach(() => {
        getRecordsStub = sinon.stub(nocodbService, 'getRecords');
    });

    afterEach(() => {
        sinon.restore();
    });

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
});
