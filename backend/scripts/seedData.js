require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const nocodbService = require('../services/nocodbService');
const env = require('../config/env');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// --- Helper Functions ---
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};
const formatDate = (date) => date.toISOString().split('T')[0];

// --- Data Definitions ---
const categoriesData = [
    { name: 'Salary', type: 'earning' },
    { name: 'Side Income', type: 'earning' },
    { name: 'Housing (Mortgage/Rent)', type: 'spending' },
    { name: 'Groceries & Food', type: 'spending' },
    { name: 'Transportation & Vehicle', type: 'spending' },
    { name: 'Bills & Utilities', type: 'spending' },
    { name: 'Shopping & Clothing', type: 'spending' },
    { name: 'Health', type: 'spending' },
    { name: 'Entertainment & Dining', type: 'spending' },
    { name: 'Education', type: 'spending' },
    { name: 'Technology', type: 'spending' }
];

const budgetsData = [
    { category: 'Groceries & Food', amount: 18000 },
    { category: 'Shopping & Clothing', amount: 5000 },
    { category: 'Entertainment & Dining', amount: 6000 },
    { category: 'Transportation & Vehicle', amount: 4000 }
];

const savingsGoalsData = [
    { name: 'Summer Vacation', target: 100000, current: 25000, monthsAhead: 6, priority: 1 },
    { name: 'Emergency Fund', target: 50000, current: 12000, monthsAhead: 12, priority: 2 },
    { name: 'New Car Down Payment', target: 500000, current: 0, monthsAhead: 24, priority: 3 }
];

async function seed() {
    console.log('\n🌱 --- FinTrack Data Seeding Tool ---');
    
    let userId = process.argv[2];
    if (!userId) {
        userId = await askQuestion('👤 Enter User ID (Firebase UID): ');
    }

    if (!userId) {
        console.error('❌ Error: User ID is required.');
        process.exit(1);
    }

    const monthsInput = await askQuestion('📅 How many months of history to generate? (default: 12): ');
    const monthsBack = parseInt(monthsInput) || 12;

    const confirm = await askQuestion(`🚀 Ready to seed ${monthsBack} months of data for user ${userId}? (y/n): `);
    if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Aborted.');
        process.exit(0);
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);

    console.log(`\n🎬 Starting seeding from ${formatDate(startDate)} to today...`);

    try {
        // A. Create Categories
        console.log('Creating Categories...');
        const categoryMap = {};
        for (const cat of categoriesData) {
            const record = await nocodbService.createRecord(env.NOCODB.TABLES.CATEGORIES, {
                category_name: cat.name,
                type: cat.type,
                user_id: userId
            });
            categoryMap[cat.name] = record.Id;
        }

        // B. Create Transactions
        console.log('Generating Transactions...');
        const transactions = [];
        let currentDate = new Date(startDate);
        const today = new Date();

        while (currentDate <= today) {
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // 1. Salary
            transactions.push({
                date: formatDate(new Date(year, month, 1)),
                amount: 85000.00,
                bank: 'Chase Bank',
                categories_id: categoryMap['Salary'],
                description: 'Monthly Salary Payment',
                user_id: userId
            });

            // 2. Rent/Mortgage
            transactions.push({
                date: formatDate(new Date(year, month, 2)),
                amount: -28500.00,
                bank: 'Wells Fargo',
                categories_id: categoryMap['Housing (Mortgage/Rent)'],
                description: 'Rent/Mortgage Payment',
                user_id: userId
            });

            // 3. Bills
            const bills = [
                { name: 'Electricity Bill', cat: 'Bills & Utilities', min: 800, max: 1500 },
                { name: 'Water Bill', cat: 'Bills & Utilities', min: 300, max: 600 },
                { name: 'Natural Gas Bill', cat: 'Bills & Utilities', min: 200, max: 3500 },
                { name: 'Internet Subscription', cat: 'Bills & Utilities', min: 400, max: 400 },
                { name: 'Mobile Phone Plan', cat: 'Bills & Utilities', min: 900, max: 1200 }
            ];

            bills.forEach(bill => {
                let amount = getRandomFloat(bill.min, bill.max);
                if (bill.name.includes('Natural Gas') && (month < 3 || month > 10)) amount = getRandomFloat(2500, 4000);
                transactions.push({
                    date: formatDate(new Date(year, month, getRandomInt(5, 25))),
                    amount: -parseFloat(amount),
                    bank: 'Online Banking',
                    categories_id: categoryMap[bill.cat],
                    description: bill.name,
                    user_id: userId
                });
            });

            // 4. Groceries
            const visits = getRandomInt(6, 10);
            for (let i = 0; i < visits; i++) {
                transactions.push({
                    date: formatDate(new Date(year, month, getRandomInt(1, daysInMonth))),
                    amount: -getRandomFloat(800, 3500),
                    bank: 'Credit Card',
                    categories_id: categoryMap['Groceries & Food'],
                    description: ['Walmart', 'Target', 'Costco'][getRandomInt(0, 2)],
                    user_id: userId
                });
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        const chunkSize = 50;
        for (let i = 0; i < transactions.length; i += chunkSize) {
            const chunk = transactions.slice(i, i + chunkSize);
            await Promise.all(chunk.map(t => nocodbService.createRecord(env.NOCODB.TABLES.BANK_STATEMENTS, t)));
            console.log(`Inserted ${Math.min(i + chunkSize, transactions.length)} / ${transactions.length} transactions...`);
        }

        // C. Create Budgets
        console.log('Creating Budgets...');
        for (const budget of budgetsData) {
            const now = new Date();
            await nocodbService.createRecord(env.NOCODB.TABLES.BUDGETS, {
                categories_id: categoryMap[budget.category],
                target_amount: budget.amount,
                start_date: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
                end_date: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
                is_active: true,
                user_id: userId
            });
        }

        // D. Create Savings Goals
        console.log('Creating Savings Goals...');
        for (const goal of savingsGoalsData) {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + goal.monthsAhead);
            await nocodbService.createRecord(env.NOCODB.TABLES.SAVINGS_GOALS, {
                goal_name: goal.name,
                target_amount: goal.target,
                current_amount: goal.current,
                target_date: formatDate(targetDate),
                priority: goal.priority,
                user_id: userId
            });
        }

        console.log('\n✨ Data seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        process.exit(1);
    }
}

seed();