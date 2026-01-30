const path = require('path');
const fs = require('fs').promises;

// Helper to serve pages
const servePage = async (res, pagePath, pageId) => {
    try {
        // We now serve from the 'dist' folder which contains the built assets
        const rootDir = path.join(__dirname, '..', '..');
        // Adjust path to point to dist. 
        // Note: pagePath passed in currently starts with 'frontend/src/...'. 
        // We need to map this to 'dist/...'.
        
        let distPath = pagePath;
        if (pagePath.startsWith('frontend/src/')) {
            distPath = pagePath.replace('frontend/src/', 'dist/');
        } else if (pagePath === 'frontend/index.html') {
             // Case for the root index moved to src
             distPath = 'dist/index.html';
        }

        const fullPagePath = path.join(rootDir, distPath);

        let pageContent = await fs.readFile(fullPagePath, 'utf-8');

        // Inject the unique page identifier into the body tag
        // This allows the main.js to know which page-specific logic to load (for legacy pages)
        // Vue app (dashboard) ignores this but it doesn't hurt.
        if (pageContent.includes('<body')) {
            pageContent = pageContent.replace('<body', `<body data-page="${pageId}"`);
        }

        res.send(pageContent);
    } catch (err) {
        console.error(`Error serving page ${pagePath}:`, err);
        // Fallback for development/missing build - try to serve source if dist fails (OPTIONAL, maybe risky)
        // For now, let's stick to erroring if build is missing to enforce correct workflow.
        res.status(500).send('Internal Server Error: Page not found in build output. Run "pnpm run build".');
    }
};

// We keep the original paths in the calls here to serve as "keys", 
// but the function logic above maps them to 'dist'.
// EXCEPTION: getDashboard now points to the new root index.
const getDashboard = (req, res) => servePage(res, 'frontend/src/index.html', 'dashboard');
const getLogin = (req, res) => servePage(res, 'frontend/src/index.html', 'login');
const getInstallmentPlans = (req, res) => servePage(res, 'frontend/src/index.html', 'installment_plans');
const getSpendingAnalysis = (req, res) => servePage(res, 'frontend/src/index.html', 'spending_analysis');
const getSettings = (req, res) => servePage(res, 'frontend/src/index.html', 'settings');
const getBudgetManager = (req, res) => servePage(res, 'frontend/src/index.html', 'budget_manager');
const getReports = (req, res) => servePage(res, 'frontend/src/index.html', 'reports');
const getTransactions = (req, res) => servePage(res, 'frontend/src/index.html', 'transactions');
const getSubscriptions = (req, res) => servePage(res, 'frontend/src/index.html', 'subscriptions');

module.exports = {
    getDashboard,
    getLogin,
    getInstallmentPlans,
    getSpendingAnalysis,
    getSettings,
    getBudgetManager,
    getReports,
    getTransactions,
    getSubscriptions,
};
