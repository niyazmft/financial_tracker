const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');

describe('nocodbController', () => {
    let nocodbController;
    let mockNocodbService;
    let mockCategoryService;
    let req;
    let res;
    let next;

    beforeEach(() => {
        mockNocodbService = {
            createRecord: sinon.stub()
        };
        mockCategoryService = {
            getCategoryMapping: sinon.stub()
        };
        nocodbController = proxyquire('../../controllers/nocodbController', {
            '../services/nocodbService': mockNocodbService,
            '../services/categoryService': mockCategoryService,
            '../utils/catchAsync': fn => fn
        });

        req = {
            user: { uid: 'test-user-id' },
            body: {}
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

    describe('createItem', () => {
        it('should return 400 if item_name or categories_id is missing', async () => {
            req.body = { item_name: 'Test Item' }; // Missing categories_id
            await nocodbController.createItem(req, res, next);
            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 400);
            assert.ok(errorArg.message.includes('item_name and categories_id are required'));
        });

        it('should return 403 AppError for an invalid category', async () => {
            req.body = { item_name: 'Test Item', categories_id: 99 };
            mockCategoryService.getCategoryMapping.resolves({ '1': 'Category 1' });

            await nocodbController.createItem(req, res, next);

            assert.ok(mockCategoryService.getCategoryMapping.calledOnceWith('test-user-id'));
            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 403);
            assert.ok(errorArg.message.includes('Forbidden: You do not have permission to use this category.'));
        });

        it('should return 403 AppError if categories_id exists only on prototype chain', async () => {
            req.body = { item_name: 'Test Item', categories_id: 'toString' };
            // Empty mapping, but 'toString' exists on Object prototype
            mockCategoryService.getCategoryMapping.resolves({});

            await nocodbController.createItem(req, res, next);

            assert.ok(mockCategoryService.getCategoryMapping.calledOnceWith('test-user-id'));
            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 403);
            assert.ok(errorArg.message.includes('Forbidden: You do not have permission to use this category.'));
        });

        it('should return success for a valid category', async () => {
            req.body = { item_name: 'Test Item', categories_id: 1 };
            mockCategoryService.getCategoryMapping.resolves({ '1': 'Category 1' });
            const mockCreatedItem = { Id: 10, item_name: 'Test Item', categories_id: 1, user_id: 'test-user-id' };
            mockNocodbService.createRecord.resolves(mockCreatedItem);

            await nocodbController.createItem(req, res, next);

            assert.ok(mockCategoryService.getCategoryMapping.calledOnceWith('test-user-id'));
            assert.ok(mockNocodbService.createRecord.calledOnceWith(env.NOCODB.TABLES.ITEMS, {
                item_name: 'Test Item',
                categories_id: 1,
                user_id: 'test-user-id'
            }));
            assert.ok(res.status.calledOnceWith(201));
            assert.ok(res.json.calledOnceWith({ success: true, item: mockCreatedItem }));
            assert.ok(next.notCalled);
        });
    });
});
