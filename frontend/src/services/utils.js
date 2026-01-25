/**
 * Core Utilities Module - Reusable pure functions for formatting, calculations, etc.
 */

const CURRENCY_SYMBOLS = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
};

export const formatCurrency = (amount, currency = 'TRY', useKFormat = false) => {
    if (useKFormat && amount >= 1000) {
        const symbol = CURRENCY_SYMBOLS[currency] || '$';
        return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
    
    const formatter = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    const absAmount = Math.abs(amount);
    const formatted = formatter.format(absAmount);
    
    return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

export const formatPercentage = (value, showSign = true) => {
    const sign = showSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

export const createDateUTC = (year, month, day, hours = 12) => {
    return new Date(Date.UTC(year, month, day, hours));
};

export const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
};

export const formatDateDisplay = (dateStr, options = { month: 'short', day: 'numeric' }) => {
    return new Date(dateStr).toLocaleDateString('en-US', options);
};

export const formatDateRange = (startDate, endDate) => {
    const start = formatDateDisplay(startDate);
    const end = formatDateDisplay(endDate, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    return `${start} - ${end}`;
};

export const getDateRangeForType = (type) => {
    const now = new Date();
    let startDate, endDate;
    
    switch(type) {
        case 'ytd':
            startDate = createDateUTC(now.getFullYear(), 0, 1);
            endDate = now;
            break;
        case 'last-year':
            const lastYear = now.getFullYear() - 1;
            startDate = createDateUTC(lastYear, 0, 1);
            endDate = createDateUTC(lastYear, 11, 31);
            break;
        case 'last-6m':
            const sixMonthsAgoDate = new Date(now);
            sixMonthsAgoDate.setMonth(now.getMonth() - 6);
            startDate = createDateUTC(sixMonthsAgoDate.getFullYear(), sixMonthsAgoDate.getMonth(), 1);
            endDate = now;
            break;
        case 'last-3m':
            const threeMonthsAgoDate = new Date(now);
            threeMonthsAgoDate.setMonth(now.getMonth() - 3);
            startDate = createDateUTC(threeMonthsAgoDate.getFullYear(), threeMonthsAgoDate.getMonth(), 1);
            endDate = now;
            break;
        case 'this-year':
            startDate = createDateUTC(now.getFullYear(), 0, 1);
            endDate = createDateUTC(now.getFullYear(), 11, 31);
            break;
        default:
            return null;
    }
    
    return {
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate)
    };
};

export const calculateMonthsDifference = (startDate, endDate) => {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        return months < 1 ? 1 : months;
    } catch (e) {
        return 1;
    }
};

export const capitalizeWords = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Split by whitespace to handle Unicode words correctly (fixes "Eğlence" -> "EğLence" bug)
    return text.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
};

export const formatCategoryName = (categoryName) => {
    return capitalizeWords(categoryName);
};

export const proxyImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
    if (url.startsWith('http')) return `/api/proxy/image?url=${encodeURIComponent(url)}`;
    return url;
};

export const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

export const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return { valid: false, message: 'Please select both start and end dates' };
    }
    if (new Date(startDate) > new Date(endDate)) {
        return { valid: false, message: 'Start date must be before end date' };
    }
    return { valid: true };
};

/**
 * Helper to get the computed value of a CSS variable.
 * Used for non-HTML elements (like Canvas/Charts) that need to know the current theme colors.
 * @param {string} variableName - The CSS variable name (e.g., '--color-primary')
 * @returns {string} The computed color value
 */
export const getCssVariableValue = (variableName) => {
    // Optimization: If performance becomes an issue, we can cache these values 
    // and clear cache on theme switch. For now, reading direct is safest for accuracy.
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
};
