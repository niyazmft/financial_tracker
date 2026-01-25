require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const nocodbService = require('../services/nocodbService');
const env = require('../config/env');

const USER_ID = process.argv[2];
if (!USER_ID) {
    console.error('Usage: node backend/scripts/checkData.js <USER_ID>');
    process.exit(1);
}

async function check() {
    console.log(`🔍 Checking data for User ID: ${USER_ID}`);

    try {
        // 1. Check Categories
        console.log('\n--- Categories ---');
        const categoriesResponse = await nocodbService.getRecords(env.NOCODB.TABLES.CATEGORIES, {
            where: `(user_id,eq,${USER_ID})`
        });
        const categories = categoriesResponse.list || [];
        
        let earningCategoryIds = [];
        categories.forEach(c => {
            console.log(`ID: ${c.Id}, Name: "${c.category_name}", Type: "${c.type}"`);
            if (c.type === 'earning') earningCategoryIds.push(c.Id);
        });

        if (earningCategoryIds.length === 0) {
            console.warn('⚠️ No categories found with type "earning"!');
        } else {
            console.log(`✅ Found ${earningCategoryIds.length} earning categories: [${earningCategoryIds.join(', ')}]`);
        }

        // 2. Check Transactions for Last Month
        console.log('\n--- Transactions (Last Month: November 2024) ---');
        // Hardcoded for quick check based on today's context
        const start = '2024-11-01';
        const end = '2024-11-30';
        
        const transactionsResponse = await nocodbService.getRecords(env.NOCODB.TABLES.BANK_STATEMENTS, {
            where: `(user_id,eq,${USER_ID})~and(date,ge,exactDate,${start})~and(date,le,exactDate,${end})`,
            limit: 100
        });
        const transactions = transactionsResponse.list || [];
        
        let earningTransactions = transactions.filter(t => earningCategoryIds.includes(t.categories_id));
        
        console.log(`Total Transactions in Nov: ${transactions.length}`);
        console.log(`Earning Transactions in Nov: ${earningTransactions.length}`);
        
        earningTransactions.forEach(t => {
            console.log(` - Date: ${t.date}, Amount: ${t.amount}, CategoryID: ${t.categories_id}, Desc: ${t.description}`);
        });

    } catch (error) {
        console.error('❌ Error checking data:', error);
        if (error.response) {
            console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

check();
