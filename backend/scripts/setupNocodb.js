const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const NOCODB_URL = process.env.NOCODB_API_URL || 'http://localhost:8080';
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN;
const BASE_ID = process.env.NOCODB_PROJECT_ID;

// Safeguard: Check for --force flag
const force = process.argv.includes('--force');

if (!NOCODB_TOKEN || !BASE_ID) {
    console.error('❌ Error: NOCODB_API_TOKEN and NOCODB_PROJECT_ID must be set in .env');
    process.exit(1);
}

const client = axios.create({
    baseURL: NOCODB_URL,
    headers: {
        'xc-token': NOCODB_TOKEN,
        'Content-Type': 'application/json'
    }
});

const SCHEMA = {
    categories: {
        category_name: { uidt: 'SingleLineText', rqd: true, un: true },
        type: { uidt: 'SingleSelect', rqd: true, colOptions: { options: [{ title: 'spending', color: '#FF928C' }, { title: 'earning', color: '#7DE6A3' }, { title: 'saving', color: '#86D9FF' }] } },
        user_id: { uidt: 'SingleLineText', rqd: true },
        is_deleted: { uidt: 'Checkbox', cdf: 'false' }
    },
    user_settings: {
        user_id: { uidt: 'SingleLineText', rqd: true },
        monthly_income_estimate: { uidt: 'Number', cdf: '0' },
        warning_threshold: { uidt: 'Number' },
        currency: { uidt: 'SingleLineText', cdf: 'TRY' },
        name: { uidt: 'SingleLineText' },
        email: { uidt: 'Email' },
        time_zone: { uidt: 'SingleLineText' },
        anomaly_detection_enabled: { uidt: 'Checkbox', cdf: 'false' },
        anomaly_detection_sensitivity: { uidt: 'Number', cdf: '3' },
        dismissed_warnings: { uidt: 'JSON' },
        onboarding_completed: { uidt: 'Checkbox', cdf: 'false' }
    },
    items: {
        item_name: { uidt: 'SingleLineText', rqd: true },
        user_id: { uidt: 'SingleLineText', rqd: true },
        categories_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'categories' },
        is_deleted: { uidt: 'Checkbox', cdf: 'false' }
    },
    bank_statments: {
        date: { uidt: 'Date', rqd: true },
        amount: { uidt: 'Number', rqd: true },
        description: { uidt: 'SingleLineText' },
        bank: { uidt: 'SingleLineText' },
        ref_no: { uidt: 'SingleLineText' },
        user_id: { uidt: 'SingleLineText', rqd: true },
        categories_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'categories' },
        is_deleted: { uidt: 'Checkbox', cdf: 'false' }
    },
    budget_manager: {
        user_id: { uidt: 'SingleLineText', rqd: true },
        target_amount: { uidt: 'Number', rqd: true },
        start_date: { uidt: 'Date', rqd: true },
        end_date: { uidt: 'Date', rqd: true },
        is_active: { uidt: 'Checkbox', cdf: 'true' },
        categories_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'categories' }
    },
    tagging_rules: {
        user_id: { uidt: 'SingleLineText', rqd: true },
        keyword: { uidt: 'SingleLineText', rqd: true },
        type: { uidt: 'SingleLineText', cdf: 'contains' },
        categories_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'categories' }
    },
    subscriptions: {
        user_id: { uidt: 'SingleLineText', rqd: true },
        name: { uidt: 'SingleLineText', rqd: true },
        amount: { uidt: 'Number', rqd: true },
        currency: { uidt: 'SingleLineText', cdf: 'TRY' },
        billing_cycle: { uidt: 'SingleLineText', rqd: true },
        status: { uidt: 'SingleLineText', cdf: 'Active' },
        start_date: { uidt: 'Date' },
        next_payment_date: { uidt: 'Date' },
        auto_renewal: { uidt: 'Checkbox', cdf: 'true' },
        notes: { uidt: 'LongText' },
        categories_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'categories' }
    },
    saving_goals: {
        user_id: { uidt: 'SingleLineText', rqd: true },
        goal_name: { uidt: 'SingleLineText', rqd: true },
        target_amount: { uidt: 'Number', rqd: true },
        priority: { uidt: 'Number', cdf: '1' },
        target_date: { uidt: 'Date' }
    },
    installments_per_record: {
        user_id: { uidt: 'SingleLineText', rqd: true },
        installment_payment: { uidt: 'Number', rqd: true },
        start_date: { uidt: 'Date', rqd: true },
        paid: { uidt: 'Checkbox', cdf: 'false' },
        items_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'items' },
        categories_id: { uidt: 'LinkToAnotherRecord', relatedTable: 'categories' },
        is_deleted: { uidt: 'Checkbox', cdf: 'false' }
    }
};

async function setup() {
    try {
        console.log(`🚀 Starting NocoDB Setup for Base: ${BASE_ID}`);
        
        // 1. Get existing tables
        const tablesResponse = await client.get(`/api/v2/meta/bases/${BASE_ID}/tables`);
        const existingTables = tablesResponse.data.list;
        const tableMap = {}; // name -> id
        const preExisting = [];

        existingTables.forEach(t => {
            tableMap[t.table_name] = t.id;
            if (SCHEMA[t.table_name]) {
                preExisting.push(t.table_name);
            }
        });

        // Safeguard check
        if (preExisting.length > 0 && !force) {
            console.error('\n⚠️  Safeguard Triggered: Pre-existing tables found!');
            console.error('The following tables already exist in your NocoDB project:');
            preExisting.forEach(t => console.error(' - ' + t));
            console.error('\nTo avoid data corruption or duplicate columns, the setup has been aborted.');
            console.error('If you want to proceed anyway, run the command with the --force flag:');
            console.error('npm run db:setup -- --force');
            process.exit(1);
        }

        if (force) {
            console.log('⚠️  Proceeding with --force flag. Existing tables will be updated with missing columns.');
        }

        // 2. Create tables if they don't exist
        for (const tableName of Object.keys(SCHEMA)) {
            if (!tableMap[tableName]) {
                console.log(`➕ Creating table: ${tableName}`);
                const createRes = await client.post(`/api/v2/meta/bases/${BASE_ID}/tables`, {
                    table_name: tableName,
                    title: tableName,
                    columns: [{ column_name: 'Id', title: 'Id', uidt: 'ID', pk: true, ai: true }]
                });
                tableMap[tableName] = createRes.data.id;
            } else {
                console.log(`✅ Table exists: ${tableName}`);
            }
        }

        // 3. Create columns
        for (const [tableName, columns] of Object.entries(SCHEMA)) {
            const tableId = tableMap[tableName];
            const colsResponse = await client.get(`/api/v2/meta/tables/${tableId}/columns`);
            const existingCols = new Set(colsResponse.data.map(c => c.column_name));

            for (const [colName, config] of Object.entries(columns)) {
                if (existingCols.has(colName)) {
                    continue;
                }

                if (config.uidt === 'LinkToAnotherRecord') {
                    // Relationships handled in next step
                    continue;
                }

                console.log(`  ➕ Creating column: ${tableName}.${colName} (${config.uidt})`);
                await client.post(`/api/v2/meta/tables/${tableId}/columns`, {
                    column_name: colName,
                    title: colName,
                    ...config
                });
            }
        }

        // 4. Create Relationships (Links)
        for (const [tableName, columns] of Object.entries(SCHEMA)) {
            const tableId = tableMap[tableName];
            const colsResponse = await client.get(`/api/v2/meta/tables/${tableId}/columns`);
            const existingCols = new Set(colsResponse.data.map(c => c.column_name));

            for (const [colName, config] of Object.entries(columns)) {
                if (config.uidt !== 'LinkToAnotherRecord' || existingCols.has(colName)) continue;

                const relatedTableId = tableMap[config.relatedTable];
                if (!relatedTableId) {
                    console.warn(`  ⚠️ Warning: Related table ${config.relatedTable} not found for ${tableName}.${colName}`);
                    continue;
                }

                console.log(`  🔗 Creating relationship: ${tableName}.${colName} -> ${config.relatedTable}`);
                try {
                    await client.post(`/api/v2/meta/bases/${BASE_ID}/links`, {
                        type: 'hm', 
                        childId: tableId,
                        parentId: relatedTableId,
                        childColumnName: colName,
                        parentColumnName: tableName, 
                    });
                } catch (linkError) {
                    if (linkError.response && linkError.response.data && linkError.response.data.msg?.includes('already exists')) {
                        console.log(`  ✅ Relationship already exists for ${tableName}.${colName}`);
                    } else {
                        console.error(`  ❌ Error creating relationship ${tableName}.${colName}:`, linkError.message);
                    }
                }
            }
        }

        console.log('\n✨ NocoDB Setup Completed Successfully!');
        console.log('📌 Please ensure your .env file has the correct Table IDs as shown below:');
        Object.entries(tableMap).forEach(([name, id]) => {
            console.log(`${name.toUpperCase()}_TABLE_ID=${id}`);
        });

    } catch (error) {
        console.error('❌ Setup Failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        process.exit(1);
    }
}

setup();