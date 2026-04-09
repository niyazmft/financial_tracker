const assert = require('assert');
const sinon = require('sinon');
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
});
