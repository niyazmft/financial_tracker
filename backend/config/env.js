const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
    PORT: process.env.PORT || 3000,
    FRONTEND_URL: process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`,
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || 'TRY',

    // NocoDB Configuration
    NOCODB: {
        API_URL: process.env.NOCODB_API_URL,
        API_TOKEN: process.env.NOCODB_API_TOKEN,
        TABLES: {
            BANK_STATEMENTS: process.env.BANK_STATEMENTS_TABLE_ID,
            CATEGORIES: process.env.CATEGORIES_TABLE_ID,
            ITEMS: process.env.ITEMS_TABLE_ID,
            TAGGING_RULES: process.env.TAGGING_RULES_TABLE_ID,
            SUBSCRIPTIONS: process.env.SUBSCRIPTIONS_TABLE_ID,
            INSTALLMENTS: process.env.INSTALLMENTS_PER_RECORD_TABLE_ID,
            BUDGETS: process.env.BUDGET_MANAGER_TABLE_ID,
            USER_SETTINGS: process.env.USER_SETTINGS_TABLE_ID,
            SAVINGS_GOALS: process.env.SAVINGS_GOALS_TABLE_ID,
        },
        CONSTANTS: {
            SALARY_CATEGORY_ID: process.env.SALARY_CATEGORY_ID || 10,
            SPENDING_CATEGORY_TYPE: process.env.SPENDING_CATEGORY_TYPE || 'spending',
        }
    },

    // Firebase Configuration
    FIREBASE: {
        SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON,
        CLIENT_CONFIG: {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID,
            measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
        }
    },

    // Email Configuration
    SMTP: {
        HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        PORT: process.env.SMTP_PORT || 587,
        USER: process.env.SMTP_USER,
        PASS: process.env.SMTP_PASS,
        FROM: process.env.SMTP_FROM
    }
};