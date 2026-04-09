const assert = require('assert');
const catchAsync = require('../utils/catchAsync');

describe('catchAsync utility', () => {
    it('should call next with the error when the async function rejects', async () => {
        const error = new Error('Async error');
        const asyncFn = async () => {
            throw error;
        };

        const wrappedFn = catchAsync(asyncFn);
        const req = {};
        const res = {};

        let nextCalledWithError = null;
        const next = (err) => {
            nextCalledWithError = err;
        };

        // Call the wrapped function. It catches internally so no throw here.
        // Wait for next tick to ensure the catch block executes
        wrappedFn(req, res, next);

        // Wait for any microtasks to finish
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify next was called with the correct error
        assert.strictEqual(nextCalledWithError, error);
    });

    it('should not call next with an error when the async function resolves successfully', async () => {
        const asyncFn = async () => {
            return 'success';
        };

        const wrappedFn = catchAsync(asyncFn);
        const req = {};
        const res = {};

        let nextCalled = false;
        const next = () => {
            nextCalled = true;
        };

        wrappedFn(req, res, next);

        await new Promise(resolve => setTimeout(resolve, 0));

        assert.strictEqual(nextCalled, false);
    });

    it('should pass req, res, and next to the wrapped function', async () => {
        const expectedReq = { id: 1 };
        const expectedRes = { status: () => {} };
        const expectedNext = () => {};

        let actualReq, actualRes, actualNext;

        const asyncFn = async (req, res, next) => {
            actualReq = req;
            actualRes = res;
            actualNext = next;
        };

        const wrappedFn = catchAsync(asyncFn);

        wrappedFn(expectedReq, expectedRes, expectedNext);

        await new Promise(resolve => setTimeout(resolve, 0));

        assert.strictEqual(actualReq, expectedReq);
        assert.strictEqual(actualRes, expectedRes);
        assert.strictEqual(actualNext, expectedNext);
    });
});
