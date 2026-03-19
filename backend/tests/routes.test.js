const assert = require('assert');
const routes = require('../routes');

describe('API Route Registration Smoke Tests', () => {
    
    // Helper to find a mount point in a router's stack
    function findMountPath(router, path) {
        return router.stack.some(layer => {
            if (layer.name === 'router' || layer.name === 'bound dispatch') {
                // Express uses regex for paths
                // For router.use('/api/transactions', ...) it looks like /^\/api\/transactions\/?(?=\/|$)/
                return layer.regexp.toString().includes(path.replace(/\//g, '\\/'));
            }
            if (layer.route && layer.route.path === path) {
                return true;
            }
            return false;
        });
    }

    it('should have installment plan route registered', () => {
        // router.post('/api/installment-plans', ...) in index.js
        const exists = routes.stack.some(layer => 
            layer.route && 
            layer.route.path === '/api/installment-plans' && 
            layer.route.methods.post
        );
        assert.ok(exists, 'POST /api/installment-plans missing from main router');
    });

    it('should have transactions router mounted', () => {
        // router.use('/api/transactions', transactionRoutes) in index.js
        assert.ok(findMountPath(routes, '/api/transactions'), 'Transactions router not mounted at /api/transactions');
    });

    it('should have budgets router mounted', () => {
        // router.use('/api', budgetRoutes) in index.js
        assert.ok(findMountPath(routes, '/api'), 'Budget routes not mounted at /api');
    });

    it('should have user router mounted', () => {
        // router.use('/api', userRoutes) in index.js
        assert.ok(findMountPath(routes, '/api'), 'User routes not mounted at /api');
    });

    it('should have specific transaction endpoints in transactionRoutes', () => {
        const transactionRoutes = require('../routes/transactionRoutes');
        const hasImportJson = transactionRoutes.stack.some(layer => 
            layer.route && layer.route.path === '/import-json' && layer.route.methods.post
        );
        const hasGetTransactions = transactionRoutes.stack.some(layer => 
            layer.route && layer.route.path === '/' && layer.route.methods.get
        );
        
        assert.ok(hasImportJson, 'POST /import-json missing from transactionRoutes');
        assert.ok(hasGetTransactions, 'GET / missing from transactionRoutes');
    });
});
