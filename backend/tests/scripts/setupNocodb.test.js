const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('setupNocodb script', () => {
    let axiosCreateStub;
    let clientGetStub;
    let clientPostStub;
    let consoleLogStub;
    let consoleErrorStub;
    let processExitStub;
    let envBackup;
    let argvBackup;

    beforeEach(() => {
        // Backup
        envBackup = { ...process.env };
        argvBackup = [...process.argv];

        // Set env vars to avoid the early exit for missing env vars
        process.env.NOCODB_API_TOKEN = 'test-token';
        process.env.NOCODB_PROJECT_ID = 'test-base-id';

        clientGetStub = sinon.stub();
        clientPostStub = sinon.stub();

        const mockClient = {
            get: clientGetStub,
            post: clientPostStub
        };

        axiosCreateStub = sinon.stub().returns(mockClient);

        consoleLogStub = sinon.stub(console, 'log');
        consoleErrorStub = sinon.stub(console, 'error');
        sinon.stub(console, 'warn');
        processExitStub = sinon.stub(process, 'exit');
    });

    afterEach(() => {
        // Restore
        process.env = envBackup;
        process.argv = argvBackup;
        sinon.restore();

        // Remove from require cache so we can run it again
        const resolvedPath = require.resolve('../../scripts/setupNocodb.js');
        delete require.cache[resolvedPath];
    });

    function runScript() {
        proxyquire('../../scripts/setupNocodb.js', {
            'axios': {
                create: axiosCreateStub
            },
            'dotenv': {
                config: sinon.stub()
            }
        });

        // Return a promise that resolves after the script's async setup function completes
        // Since the setup function is called but not awaited or exported, we need a small delay
        return new Promise(resolve => setTimeout(resolve, 50));
    }

    it('should exit if NOCODB_API_TOKEN or NOCODB_PROJECT_ID are missing', async () => {
        delete process.env.NOCODB_API_TOKEN;

        runScript();

        // We do a small delay as there's no await for require in our test
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.ok(consoleErrorStub.calledWith('❌ Error: NOCODB_API_TOKEN and NOCODB_PROJECT_ID must be set in .env'));
        assert.ok(processExitStub.calledWith(1));
    });

    it('should trigger safeguard and exit if tables already exist and --force is not provided', async () => {
        // Mock get tables response
        clientGetStub.onFirstCall().resolves({
            data: {
                list: [
                    { table_name: 'categories', id: 'tbl1' }
                ]
            }
        });

        runScript();
        await new Promise(resolve => setTimeout(resolve, 50));

        assert.ok(consoleErrorStub.calledWithMatch(/Safeguard Triggered/));
        assert.ok(processExitStub.calledWith(1));
    });

    it('should create missing tables, columns, and relationships when --force is used or no tables exist', async () => {
        process.argv.push('--force');

        // First get: tables
        clientGetStub.onCall(0).resolves({
            data: {
                list: [
                    // Pretend 'categories' exists but others don't to test both paths
                    { table_name: 'categories', id: 'tbl1' }
                ]
            }
        });

        // Mock subsequent gets for columns for each table
        clientGetStub.callsFake((url) => {
            if (url.includes('/columns')) {
                return Promise.resolve({
                    data: [
                        { column_name: 'Id' }
                    ]
                });
            }
            return Promise.resolve({ data: {} });
        });

        // Mock post for tables, columns, relationships
        clientPostStub.resolves({ data: { id: 'new_id' } });

        runScript();
        await new Promise(resolve => setTimeout(resolve, 100)); // give more time for all async ops

        assert.ok(consoleLogStub.calledWithMatch(/Starting NocoDB Setup/));
        assert.ok(consoleLogStub.calledWithMatch(/Proceeding with --force flag/));

        // Check if client.post was called to create tables
        // 'categories' already exists, so it shouldn't be created
        // others should be
        const tablePostCalls = clientPostStub.getCalls().filter(call => call.args[0].endsWith('/tables'));
        assert.ok(tablePostCalls.length > 0);

        // Check if relationships were created (post to /links)
        const linkPostCalls = clientPostStub.getCalls().filter(call => call.args[0].endsWith('/links'));
        assert.ok(linkPostCalls.length > 0);

        assert.ok(consoleLogStub.calledWithMatch(/NocoDB Setup Completed Successfully/));
    });

    it('should catch and log errors during setup', async () => {
        clientGetStub.onFirstCall().rejects(new Error('Network error'));

        runScript();
        await new Promise(resolve => setTimeout(resolve, 50));

        assert.ok(consoleErrorStub.calledWithMatch(/Setup Failed/));
        assert.ok(processExitStub.calledWith(1));
    });
});
