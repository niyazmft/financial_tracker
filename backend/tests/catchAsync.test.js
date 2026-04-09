const assert = require('assert');
const catchAsync = require('../utils/catchAsync');

describe('catchAsync Utils', () => {
    it('should call the original function with req, res, next', async () => {
        let called = false;
        const mockFn = async (req, res, next) => {
            called = true;
            assert.strictEqual(req, 'mockReq');
            assert.strictEqual(res, 'mockRes');
            assert.strictEqual(next, 'mockNext');
        };

        const wrappedFn = catchAsync(mockFn);
        await wrappedFn('mockReq', 'mockRes', 'mockNext');

        assert.strictEqual(called, true);
    });

    it('should catch errors and pass them to next()', async () => {
        const mockError = new Error('Test Error');
        const mockFn = async (req, res, next) => {
            throw mockError;
        };

        let nextCalledWithError = null;
        const mockNext = (err) => {
            nextCalledWithError = err;
        };

        const wrappedFn = catchAsync(mockFn);
        wrappedFn('mockReq', 'mockRes', mockNext);
        // Yield to the microtask queue to allow the .catch(next) block to execute
        await Promise.resolve();

        assert.strictEqual(nextCalledWithError, mockError);
    });

    it('should handle rejected promises', async () => {
        const mockError = new Error('Promise Rejected');
        const mockFn = (req, res, next) => {
            return Promise.reject(mockError);
        };

        let nextCalledWithError = null;
        const mockNext = (err) => {
            nextCalledWithError = err;
        };

        const wrappedFn = catchAsync(mockFn);
        await wrappedFn('mockReq', 'mockRes', mockNext);

        assert.strictEqual(nextCalledWithError, mockError);
    });
});
