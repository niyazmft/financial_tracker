const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const AppError = require('../../utils/AppError');

describe('userController.proxyProfileImage', () => {
    let userController;
    let req, res, next;
    let axiosStub;

    beforeEach(() => {
        req = { query: {} };
        res = {
            setHeader: sinon.spy(),
            status: sinon.stub().returnsThis(),
            send: sinon.spy(),
        };
        next = sinon.spy();
        axiosStub = sinon.stub();

        userController = proxyquire('../../controllers/userController', {
            'axios': axiosStub,
            // Mock dependencies we don't need for this specific test
            '../services/transactionService': {},
            '../services/nocodbService': {},
            '../services/emailService': {},
            '../config/firebase': {},
            '../config/env': {
                NOCODB: { TABLES: { USER_SETTINGS: 'test' } },
                FIREBASE: { CLIENT_CONFIG: {} }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    const runProxyProfileImage = async () => {
        return new Promise((resolve) => {
             const nextWrapper = (err) => resolve(err || undefined);
             res.send = sinon.spy(() => resolve());
             res.status = sinon.stub().returns(res);
             res.json = sinon.spy(() => resolve());

             // In tests where axios is called successfully, we want data.pipe to resolve the promise.
             // We can check if axiosStub has a mock that includes a special resolve.

             try {
                userController.proxyProfileImage(req, res, nextWrapper);
             } catch (err) {
                resolve(err);
             }
        });
    };

    it('should return AppError 400 if url is missing', async () => {
        const result = await runProxyProfileImage();
        assert.ok(result instanceof AppError);
        assert.strictEqual(result.statusCode, 400);
        assert.strictEqual(result.message, 'Image URL is required');
    });

    it('should return AppError 403 for unauthorized domains', async () => {
        req.query.url = 'https://attackergoogleusercontent.com/image.jpg';
        const result = await runProxyProfileImage();
        assert.ok(result instanceof AppError);
        assert.strictEqual(result.statusCode, 403);
        assert.strictEqual(result.message, 'Unauthorized image domain');
    });

    it('should return AppError 403 for domains with incorrect suffix', async () => {
        req.query.url = 'https://attacker-lh3.googleusercontent.com.evil.com/image.jpg';
        const result = await runProxyProfileImage();
        assert.ok(result instanceof AppError);
        assert.strictEqual(result.statusCode, 403);
    });

    it('should call axios for exactly matching domain', async () => {
        req.query.url = 'https://googleusercontent.com/image.jpg';

        let pipeCalled = false;
        const resultPromise = new Promise(resolve => {
            axiosStub.resolves({ headers: {}, data: { pipe: () => { pipeCalled = true; resolve(); } } });
            userController.proxyProfileImage(req, res, next);
        });
        await resultPromise;

        assert.ok(axiosStub.calledOnce);
        assert.ok(pipeCalled);
    });

    it('should call axios for valid subdomain', async () => {
        req.query.url = 'https://lh3.googleusercontent.com/image.jpg';

        let pipeCalled = false;
        const resultPromise = new Promise(resolve => {
            axiosStub.resolves({ headers: {}, data: { pipe: () => { pipeCalled = true; resolve(); } } });
            userController.proxyProfileImage(req, res, next);
        });
        await resultPromise;

        assert.ok(axiosStub.calledOnce);
        assert.ok(pipeCalled);
    });

    it('should call axios for nested valid subdomain', async () => {
        req.query.url = 'https://foo.lh3.googleusercontent.com/image.jpg';

        let pipeCalled = false;
        const resultPromise = new Promise(resolve => {
            axiosStub.resolves({ headers: {}, data: { pipe: () => { pipeCalled = true; resolve(); } } });
            userController.proxyProfileImage(req, res, next);
        });
        await resultPromise;

        assert.ok(axiosStub.calledOnce);
        assert.ok(pipeCalled);
    });
});
