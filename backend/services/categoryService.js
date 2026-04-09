const nocodbService = require('./nocodbService');
const env = require('../config/env');

const { NOCODB } = env;

const categoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetch categories dynamically from NocoDB for a specific user.
 * This is the core data retrieval function; other functions in this service should use its output.
 */
async function fetchCategoriesFromDB(verifiedUserId) {
    // Return cached data if available and not expired
    const cacheKey = verifiedUserId || 'global';
    const cachedEntry = categoryCache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL)) {
        return cachedEntry.data;
    }

    try {
        const categoriesTableId = NOCODB.TABLES.CATEGORIES;
        if (!categoriesTableId) {
            console.warn('Missing CATEGORIES_TABLE_ID, using fallback.');
            return null;
        }
        
        const params = { limit: 1000 };
        if (verifiedUserId) {
            params.where = `(user_id,eq,${verifiedUserId})`;
        }
        
        const { list: categories = [] } = await nocodbService.getRecords(categoriesTableId, params);
        
        const categoryMapping = {};
        const spendingCategories = [];
        const earningCategories = [];
        
        for (const category of categories) {
            if (category.Id && category.category_name) {
                categoryMapping[category.Id] = category.category_name;
                
                if (category.type === NOCODB.CONSTANTS.SPENDING_CATEGORY_TYPE) {
                    spendingCategories.push(category.Id);
                } else if (category.type === 'earning') {
                    earningCategories.push(category.Id);
                }
            }
        }
        
        const result = {
            mapping: categoryMapping,
            spendingCategories,
            earningCategories,
            allCategories: categories,
        };

        // Cache the successful result
        categoryCache.set(cacheKey, {
            data: result,
            timestamp: now,
        });

        return result;
        
    } catch (error) {
        console.error('Error fetching categories dynamically:', error.message);
        return null;
    }
}

/**
 * Get category mapping with fallback to an empty object.
 */
async function getCategoryMapping(verifiedUserId) {
    const categoriesData = await fetchCategoriesFromDB(verifiedUserId);
    return categoriesData ? categoriesData.mapping : {};
}

/**
 * Get spending category IDs with fallback to an empty array.
 */
async function getSpendingCategoryIds(verifiedUserId) {
    const categoriesData = await fetchCategoriesFromDB(verifiedUserId);
    return categoriesData ? categoriesData.spendingCategories : [];
}

/**
 * Get earning category IDs dynamically.
 */
async function getEarningCategoryIds(verifiedUserId) {
    const categoriesData = await fetchCategoriesFromDB(verifiedUserId);
    return categoriesData ? categoriesData.earningCategories : [];
}

/**
 * Clear the category cache (mainly for testing purposes).
 */
function clearCategoryCache() {
    categoryCache.clear();
}

module.exports = {
    fetchCategoriesFromDB,
    getCategoryMapping,
    getSpendingCategoryIds,
    getEarningCategoryIds,
    clearCategoryCache,
};
