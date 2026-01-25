const nocodbService = require('../services/nocodbService');
const { getEarningCategoryIds, getSpendingCategoryIds, getCategoryMapping } = require('../services/categoryService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const BANK_STATEMENTS_TABLE_ID = env.NOCODB.TABLES.BANK_STATEMENTS;

const getLastMonthSalary = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    if (!BANK_STATEMENTS_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB BANK_STATEMENTS_TABLE_ID configuration.', 500));
    }
        
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // Last Month
    const lastMonth = currentMonth - 1;
    const lastMonthYear = lastMonth <= 0 ? currentYear - 1 : currentYear;
    const lastMonthNum = lastMonth <= 0 ? 12 : lastMonth;
    const lastMonthStart = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-01`;
    const lastMonthEnd = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-${new Date(lastMonthYear, lastMonthNum, 0).getDate()}`;

    // Two Months Ago
    const twoMonthsAgo = currentMonth - 2;
    const twoMonthsAgoYear = twoMonthsAgo <= 0 ? currentYear - 1 : currentYear;
    const twoMonthsAgoNum = twoMonthsAgo <= 0 ? 12 + twoMonthsAgo : twoMonthsAgo;
    const previousMonthStart = `${twoMonthsAgoYear}-${String(twoMonthsAgoNum).padStart(2, '0')}-01`;
    const previousMonthEnd = `${twoMonthsAgoYear}-${String(twoMonthsAgoNum).padStart(2, '0')}-${new Date(twoMonthsAgoYear, twoMonthsAgoNum, 0).getDate()}`;

    const earningCategories = await getEarningCategoryIds(verifiedUserId);
    if (earningCategories.length === 0) {
        return res.json({
            lastMonthEarnings: 0, previousMonthEarnings: 0, percentageChange: 0,
            currency: env.DEFAULT_CURRENCY, lastMonthName: new Date(lastMonthStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            previousMonthName: new Date(previousMonthStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        });
    }
    
    const userFilter = `(user_id,eq,${verifiedUserId})`;
    const categoriesFilter = `(categories_id,in,${earningCategories.join(',')})`;

    const fetchEarnings = async (start, end) => {
        const dateFilter = `(date,ge,exactDate,${start})~and(date,le,exactDate,${end})`;
        const whereClause = `${userFilter}~and${categoriesFilter}~and${dateFilter}`;
        const response = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: whereClause });
        return response.list || [];
    };

    const [lastMonthData, previousMonthData] = await Promise.all([
        fetchEarnings(lastMonthStart, lastMonthEnd),
        fetchEarnings(previousMonthStart, previousMonthEnd)
    ]);
    
    const lastMonthSalary = lastMonthData.reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);
    const previousMonthSalary = previousMonthData.reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);

    let percentageChange = 0;
    if (previousMonthSalary > 0) {
        percentageChange = ((lastMonthSalary - previousMonthSalary) / previousMonthSalary) * 100;
    }

    res.status(200).json({
        lastMonthEarnings: lastMonthSalary,
        previousMonthEarnings: previousMonthSalary,
        percentageChange: Math.round(percentageChange * 100) / 100,
        currency: env.DEFAULT_CURRENCY,
        lastMonthName: new Date(lastMonthStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        previousMonthName: new Date(previousMonthStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        earningCategories: earningCategories
    });
});

const getMonthlySpending = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { startDate, endDate } = req.query;
    
    if (!BANK_STATEMENTS_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB BANK_STATEMENTS_TABLE_ID configuration.', 500));
    }

    let actualStartDate, actualEndDate;
    if (startDate && endDate) {
        actualStartDate = startDate;
        actualEndDate = endDate;
    } else {
        const today = new Date();
        const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, 1);
        actualStartDate = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        actualEndDate = `${endOfLastMonth.getFullYear()}-${String(endOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfLastMonth.getDate()).padStart(2, '0')}`;
    }
        
    const targetCategories = await getSpendingCategoryIds(verifiedUserId);
    if (targetCategories.length === 0) {
        return res.status(200).json({ monthlyData: [], statistics: { totalSpending: 0, currency: env.DEFAULT_CURRENCY } });
    }

    const userFilter = `(user_id,eq,${verifiedUserId})`;
    const categoriesFilter = `(categories_id,in,${targetCategories.join(',')})`;
    const dateRangeFilter = `(date,ge,exactDate,${actualStartDate})~and(date,le,exactDate,${actualEndDate})`;
    const whereClause = `${userFilter}~and${categoriesFilter}~and${dateRangeFilter}`;
    
    const records = [];
    let offset = 0;
    const pageSize = 1000;
    const MAX_RECORDS = 50000; // Safety limit
    
    while (true) {
        const pageResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: whereClause, limit: pageSize, offset: offset, sort: 'date' });
        const pageData = pageResponse.list || [];
        
        records.push(...pageData);
        if (pageData.length < pageSize || records.length >= MAX_RECORDS) {
            break;
        }
        offset += pageSize;
    }
    
    const monthlyTotals = {};
    let currentMonth = new Date(actualStartDate);
    const endMonth = new Date(actualEndDate);
    endMonth.setDate(1);

    while (currentMonth <= endMonth) {
        const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals[monthKey] = {
            month: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            monthKey: monthKey,
            totalAmount: 0,
            recordCount: 0
        };
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    records.forEach(record => {
        const recordDate = new Date(record.date);
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(record.amount) || 0;
        
        if (monthlyTotals[monthKey]) {
            monthlyTotals[monthKey].totalAmount += amount;
            monthlyTotals[monthKey].recordCount += 1;
        }
    });
    
    const monthlyData = Object.keys(monthlyTotals)
        .sort()
        .map(monthKey => ({
            ...monthlyTotals[monthKey],
            totalAmount: Math.abs(monthlyTotals[monthKey].totalAmount)
        }));
    
    const totalSpending = monthlyData.reduce((sum, month) => sum + month.totalAmount, 0);
    const totalRecords = monthlyData.reduce((sum, month) => sum + month.recordCount, 0);
    const averageMonthlySpending = monthlyData.length > 0 ? (totalSpending / monthlyData.length) : 0;
    
    let monthOverMonthChange = 0;
    if (monthlyData.length >= 2) {
        const currentMonthData = monthlyData[monthlyData.length - 1];
        const previousMonthData = monthlyData[monthlyData.length - 2];
        if (previousMonthData.totalAmount > 0) {
            monthOverMonthChange = ((currentMonthData.totalAmount - previousMonthData.totalAmount) / previousMonthData.totalAmount) * 100;
        }
    }
    
    res.status(200).json({
        success: true,
        dateRange: {
            startDate: actualStartDate,
            endDate: actualEndDate,
            monthsIncluded: monthlyData.length
        },
        monthlyData: monthlyData,
        statistics: {
            totalSpending: Math.round(totalSpending * 100) / 100,
            totalRecords: totalRecords,
            averageMonthlySpending: Math.round(averageMonthlySpending * 100) / 100,
            monthOverMonthChange: Math.round(monthOverMonthChange * 100) / 100,
            currency: env.DEFAULT_CURRENCY
        },
        metadata: {
            filterMethod: 'category_based',
            categoriesFiltered: targetCategories,
            recordsProcessed: records.length,
            timestamp: new Date().toISOString()
        }
    });
});

const getCategorySpending = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return next(new AppError('Both startDate and endDate parameters are required', 400));
    }
    if (!BANK_STATEMENTS_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB BANK_STATEMENTS_TABLE_ID configuration.', 500));
    }
    
    const targetCategories = await getSpendingCategoryIds(verifiedUserId);
    const categoryMapping = await getCategoryMapping(verifiedUserId);
    
    if (targetCategories.length === 0) {
        return res.status(200).json({ categoryData: [], statistics: { totalSpending: 0, currency: env.DEFAULT_CURRENCY } });
    }

    const userFilter = `(user_id,eq,${verifiedUserId})`;
    const categoriesFilter = `(categories_id,in,${targetCategories.join(',')})`;
    const dateRangeFilter = `(date,ge,exactDate,${startDate})~and(date,le,exactDate,${endDate})`;
    const whereClause = `${userFilter}~and${categoriesFilter}~and${dateRangeFilter}`;
    
    const records = [];
    let offset = 0;
    const pageSize = 1000;
    const MAX_RECORDS = 50000; // Safety limit
    
    while (true) {
        const pageResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: whereClause, limit: pageSize, offset: offset, sort: 'categories_id' });
        const pageData = pageResponse.list || [];
        
        records.push(...pageData);
        if (pageData.length < pageSize || records.length >= MAX_RECORDS) {
            break;
        }
        offset += pageSize;
    }
    
    const categoryTotals = {};
    targetCategories.forEach(catId => {
        categoryTotals[catId] = {
            categoryId: catId,
            categoryName: categoryMapping[catId],
            totalAmount: 0,
            recordCount: 0
        };
    });
    
    records.forEach(record => {
        const categoryId = parseInt(record.categories_id);
        const amount = parseFloat(record.amount) || 0;
        
        if (categoryTotals[categoryId]) {
            categoryTotals[categoryId].totalAmount += amount;
            categoryTotals[categoryId].recordCount += 1;
        }
    });
    
    const categoryData = Object.values(categoryTotals)
        .map(cat => ({
            ...cat,
            totalAmount: Math.abs(cat.totalAmount)
        }))
        .filter(cat => cat.totalAmount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount);
    
    const totalSpending = categoryData.reduce((sum, cat) => sum + cat.totalAmount, 0);
    const totalRecords = categoryData.reduce((sum, cat) => sum + cat.recordCount, 0);
    
    res.status(200).json({
        success: true,
        dateRange: {
            startDate: startDate,
            endDate: endDate
        },
        categoryData: categoryData,
        statistics: {
            totalSpending: Math.round(totalSpending * 100) / 100,
            totalRecords: totalRecords,
            categoriesWithSpending: categoryData.length,
            currency: env.DEFAULT_CURRENCY
        },
        metadata: {
            categoriesTracked: targetCategories.length,
            recordsProcessed: records.length,
            timestamp: new Date().toISOString()
        }
    });
});

const getCustomRangeSalary = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return next(new AppError('Both startDate and endDate parameters are required', 400));
    }
    if (!BANK_STATEMENTS_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB BANK_STATEMENTS_TABLE_ID configuration.', 500));
    }
    
    const earningCategories = await getEarningCategoryIds(verifiedUserId);
    if (earningCategories.length === 0) {
        return res.status(200).json({ totalEarnings: 0, recordCount: 0, currency: env.DEFAULT_CURRENCY });
    }
    
    const userFilter = `(user_id,eq,${verifiedUserId})`;
    const categoriesFilter = `(categories_id,in,${earningCategories.join(',')})`;
    const dateRangeFilter = `(date,ge,exactDate,${startDate})~and(date,le,exactDate,${endDate})`;
    const whereClause = `${userFilter}~and${categoriesFilter}~and${dateRangeFilter}`;
    
    const records = [];
    let offset = 0;
    const pageSize = 1000;
    const MAX_RECORDS = 50000; // Safety limit
    
    while (true) {
        const pageResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: whereClause, limit: pageSize, offset: offset, sort: 'date' });
        const pageData = pageResponse.list || [];
        
        records.push(...pageData);
        if (pageData.length < pageSize || records.length >= MAX_RECORDS) {
            break;
        }
        offset += pageSize;
    }
    
    const customRangeData = records;
    
    const totalEarnings = customRangeData.reduce((total, record) => total + (parseFloat(record.amount) || 0), 0);
        
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const monthsDiff = (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + 
                          (endDateObj.getMonth() - startDateObj.getMonth());
    
    res.status(200).json({
        totalEarnings: totalEarnings,
        recordCount: customRangeData.length,
        currency: env.DEFAULT_CURRENCY,
        startDate: startDate,
        endDate: endDate,
        monthsSpan: monthsDiff + 1,
        averagePerMonth: monthsDiff > 0 ? (totalEarnings / monthsDiff) : totalEarnings,
        earningCategories: earningCategories,
        records: customRangeData
    });
});

module.exports = {
    getLastMonthSalary,
    getMonthlySpending,
    getCategorySpending,
    getCustomRangeSalary,
};