const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const transactionController = require('../../controllers/transactionController');
const AppError = require('../../utils/AppError');

describe('Transaction Controller', () => {
    describe('createTransaction', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                user: { uid: 'user123' },
                body: {
                    date: 'invalid-date', // This will trigger validateAndFormatDate to throw an error
                    amount: '100',
                    bank: 'Chase',
                    categories_id: 'cat1'
                }
            };
            res = {
                json: sinon.spy()
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should catch validation error and call next with AppError 400', async () => {
            // Because transactionController destructures validationUtils on require,
            // standard sinon stubs on the validationUtils object won't work on the
            // destructured function references inside transactionController.
            // Instead, we pass an intentionally invalid date ('invalid-date') in the request body
            // to naturally trigger the validation error and hit the catch block.

            // Call the wrapped catchAsync controller method
            // Since it's wrapped in catchAsync, it returns a function that we need to call
            // await is technically optional here since catchAsync handles the promise internally,
            // but it's good practice for tests, or wait for next to be called.
            transactionController.createTransaction(req, res, next);

            // Need to wait for the promise to resolve since catchAsync is handling it asynchronously
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify next was called
            assert.strictEqual(next.calledOnce, true, 'next should be called once');

            // Verify the argument passed to next
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError, 'next should be called with an AppError');
            assert.strictEqual(errorArg.statusCode, 400, 'AppError status code should be 400');
            assert.ok(errorArg.message.includes('Invalid date format'), 'AppError message should reflect the invalid date format error');
        });
    });

    describe('updateTransaction', () => {
        let req, res, next;
        let mockNocodbService;
        let mockCategoryService;
        let proxiedController;

        beforeEach(() => {
            mockNocodbService = {
                getRecordById: sinon.stub(),
                updateRecord: sinon.stub()
            };
            mockCategoryService = {
                getCategoryMapping: sinon.stub()
            };
            proxiedController = proxyquire('../../controllers/transactionController', {
                '../services/nocodbService': mockNocodbService,
                '../services/categoryService': mockCategoryService,
                '../utils/catchAsync': fn => fn
            });

            req = {
                user: { uid: 'user123' },
                params: { id: 'txn1' },
                body: {
                    date: '2024-01-15',
                    amount: '50.00',
                    bank: 'Chase',
                    categories_id: '1',
                    description: 'Groceries',
                    ref_no: 'REF123'
                }
            };
            res = {
                json: sinon.spy()
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should send the validated fields (not the raw id) as the update payload', async () => {
            mockNocodbService.getRecordById.resolves({ Id: 'txn1', user_id: 'user123' });
            mockCategoryService.getCategoryMapping.resolves({ '1': 'Groceries' });
            mockNocodbService.updateRecord.resolves({ Id: 'txn1', amount: 50 });

            await proxiedController.updateTransaction(req, res, next);

            assert.ok(mockNocodbService.updateRecord.calledOnce);
            const [tableId, payload] = mockNocodbService.updateRecord.firstCall.args;
            assert.strictEqual(tableId, require('../../config/env').NOCODB.TABLES.BANK_STATEMENTS);
            // The payload must be an object containing the Id plus the validated fields,
            // NOT the raw id string as the entire body (the pre-fix bug).
            assert.strictEqual(typeof payload, 'object');
            assert.strictEqual(payload.Id, 'txn1');
            assert.strictEqual(payload.amount, 50);
            assert.strictEqual(payload.date, '2024-01-15');
            assert.strictEqual(payload.categories_id, 1);
            assert.strictEqual(payload.description, 'Groceries');
            assert.ok(next.notCalled);
        });

        it('should return 403 when the transaction belongs to another user', async () => {
            mockNocodbService.getRecordById.resolves({ Id: 'txn1', user_id: 'other-user' });

            await proxiedController.updateTransaction(req, res, next);

            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 403);
            assert.ok(mockNocodbService.updateRecord.notCalled);
        });
    });

    describe('importTransactionsCsv (path-injection guard)', () => {
        let req, res, next;
        let mockNocodbService;
        let mockCategoryService;
        let proxiedController;

        beforeEach(() => {
            mockNocodbService = {
                createRecord: sinon.stub()
            };
            mockCategoryService = {
                getCategoryMapping: sinon.stub()
            };
            proxiedController = proxyquire('../../controllers/transactionController', {
                '../services/nocodbService': mockNocodbService,
                '../services/categoryService': mockCategoryService,
                '../utils/catchAsync': fn => fn
            });

            req = {
                user: { uid: 'user123' },
                file: { path: '/etc/passwd' } // attacker-controlled path outside uploads dir
            };
            res = {
                json: sinon.spy()
            };
            next = sinon.spy();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should reject a file path outside the uploads directory (path-injection guard)', async () => {
            await proxiedController.importTransactionsCsv(req, res, next);

            assert.ok(next.calledOnce);
            const errorArg = next.firstCall.args[0];
            assert.ok(errorArg instanceof AppError);
            assert.strictEqual(errorArg.statusCode, 400);
            assert.ok(errorArg.message.includes('Invalid file path'));
            // Must not attempt to read the arbitrary file
            assert.ok(mockCategoryService.getCategoryMapping.notCalled);
        });
    });
});
