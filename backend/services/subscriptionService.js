const nocodbService = require('./nocodbService');
const env = require('../config/env');

const BANK_STATEMENTS_TABLE_ID = env.NOCODB.TABLES.BANK_STATEMENTS;
const SUBSCRIPTIONS_TABLE_ID = env.NOCODB.TABLES.SUBSCRIPTIONS;

// Helper to calculate days between two dates
const daysBetween = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

exports.getSubscriptionsByUser = async (userId) => {
    const response = await nocodbService.getRecords(SUBSCRIPTIONS_TABLE_ID, {
        where: `(user_id,eq,${userId})`,
        sort: 'next_payment_date'
    });
    return response.list || [];
};

exports.createSubscription = async (data) => {
    // Map frontend fields to NocoDB schema
    const record = {
        user_id: data.user_id,
        name: data.name,
        amount: data.amount,
        currency: data.currency || 'TRY',
        billing_cycle: (data.recurrence_type || data.billing_cycle || 'monthly').toLowerCase(),
        status: data.status || 'Active',
        start_date: data.last_payment_date || new Date().toISOString().split('T')[0], // Map last payment to start date if needed
        next_payment_date: data.next_due_date || data.next_payment_date,
        categories_id: parseInt(data.category_id || data.categories_id),
        auto_renewal: data.auto_renewal !== false,
        notes: data.description || data.notes,
        description: data.description || data.notes // Include description as per user schema
    };

    return await nocodbService.createRecord(SUBSCRIPTIONS_TABLE_ID, record);
};

exports.updateSubscription = async (id, data) => {
    // Map fields for update, allowing for different key names from the frontend
    const record = {
        Id: id,
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        billing_cycle: (data.recurrence_type || data.billing_cycle)?.toLowerCase(),
        status: data.status,
        next_payment_date: data.next_due_date || data.next_payment_date,
        categories_id: data.category_id || data.categories_id ? parseInt(data.category_id || data.categories_id) : undefined,
        auto_renewal: data.auto_renewal,
        notes: data.description || data.notes,
    };

    // Remove any properties that are undefined so they don't overwrite existing values
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);

    return await nocodbService.updateRecord(SUBSCRIPTIONS_TABLE_ID, record);
};

exports.deleteSubscription = async (id) => {
    return await nocodbService.deleteRecord(SUBSCRIPTIONS_TABLE_ID, id);
};

/**
 * Groups transactions by a normalized key (description + amount) to find potential recurring payments.
 * @param {Array<object>} transactions - A list of transaction objects.
 * @returns {Map<string, Array<object>>} A map where keys are a unique identifier and values are arrays of matching transactions.
 */
const _groupTransactionsForRecurrence = (transactions) => {
    const grouped = new Map();
    transactions
        .filter(t => parseFloat(t.amount) < 0) // Only look at expenses
        .forEach(t => {
            const amount = Math.abs(parseFloat(t.amount));
            const description = t.description ? t.description.toLowerCase().trim() : 'UNKNOWN';
            // Normalize description by removing dates, times, and long alphanumeric IDs
            const normalizedDescription = description.replace(/\d{2,4}[-/]\d{2,4}[-/]\d{2,4}|\d{2}:\d{2}|[A-Z0-9]{6,}/gi, '').replace(/\s+/g, ' ').trim();

            if (!normalizedDescription) return; // Skip transactions with no usable description

            const key = `${normalizedDescription}|${amount.toFixed(2)}`;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(t);
        });
    return grouped;
};

/**
 * Analyzes a group of transactions to determine if they are recurring.
 * @param {Array<object>} group - An array of transactions sorted by date.
 * @returns {object|null} A recurrence info object if recurring, otherwise null.
 */
const _analyzeGroupForRecurrence = (group) => {
    if (group.length < 2) return null;

    // Sort by date ascending for interval calculation
    group.sort((a, b) => new Date(a.date) - new Date(b.date));

    const intervals = [];
    for (let i = 0; i < group.length - 1; i++) {
        intervals.push(daysBetween(group[i].date, group[i + 1].date));
    }

    const averageInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    const tolerance = 3;
    let recurrenceType = null;

    if (averageInterval >= (30 - tolerance) && averageInterval <= (30 + tolerance)) {
        recurrenceType = 'Monthly';
    } else if (averageInterval >= (14 - tolerance) && averageInterval <= (14 + tolerance)) {
        recurrenceType = 'Bi-Weekly';
    } else if (averageInterval >= (7 - tolerance) && averageInterval <= (7 + tolerance)) {
        recurrenceType = 'Weekly';
    }

    if (!recurrenceType) return null;

    const latestTransaction = group[group.length - 1];
    return {
        description: group[0].description,
        amount: parseFloat(group[0].amount),
        category: group[0].categories_id,
        recurrence: recurrenceType,
        averageIntervalDays: Math.round(averageInterval),
        lastPaymentDate: latestTransaction.date,
        nextPossiblePaymentDate: new Date(new Date(latestTransaction.date).setDate(new Date(latestTransaction.date).getDate() + Math.round(averageInterval))).toISOString().split('T')[0],
        allPayments: group.map(t => ({ date: t.date, amount: parseFloat(t.amount) }))
    };
};

exports.findRecurringTransactions = async (verifiedUserId) => {
    const response = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, {
        where: `(user_id,eq,${verifiedUserId})`,
        sort: '-date',
        limit: 10000,
    });
    const transactions = response.list || [];

    const groupedTransactions = _groupTransactionsForRecurrence(transactions);

    return Array.from(groupedTransactions.values())
        .map(_analyzeGroupForRecurrence)
        .filter(result => result !== null); // Filter out non-recurring groups
};
