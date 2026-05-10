const nocodbService = require('../services/nocodbService');
const transactionService = require('../services/transactionService');
const csv = require('csv-parser');
const fs = require('fs');
const { getCategoryMapping } = require('../services/categoryService');
const { validateAndFormatDate, validateAndFormatAmount, normalizeAndValidateBank, normalizeAndValidateCategory, validateCategoryById } = require('../utils/validationUtils');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const getTransactions = catchAsync(async (req, res, _next) => {
    const verifiedUserId = req.user.uid;
    const { startDate, endDate } = req.query;
    
    const result = await transactionService.getTransactions(verifiedUserId, { startDate, endDate });
    
    res.json({
        success: true,
        dateRange: {
            startDate: startDate || null,
            endDate: endDate || null
        },
        ...result
    });
});

const getTransactionById = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    const { id } = req.params;

    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;

    const transaction = await nocodbService.getRecordById(bankStatementsTableId, id);

    // Ensure the record exists before checking ownership to prevent TypeErrors
    if (!transaction || Object.keys(transaction).length === 0) {
        return next(new AppError('Transaction not found.', 404));
    }

    if (transaction.user_id != verifiedUserId) {
        return next(new AppError('Forbidden: You do not have permission to view this transaction.', 403));
    }

    const categoryMapping = await getCategoryMapping(verifiedUserId);
    const categoryName = categoryMapping[transaction.categories_id] || 'Unknown';

    res.json({
        success: true,
        transaction: {
            id: transaction.Id,
            date: transaction.date,
            amount: transaction.amount,
            bank: transaction.bank,
            category: categoryName,
            categoryId: transaction.categories_id,
            description: transaction.description,
            ref_no: transaction.ref_no
        }
    });
});

const createTransaction = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    const { date, amount, bank, categories_id, description, ref_no } = req.body;
    
    if (!date || !amount || !bank || !categories_id) {
        return next(new AppError('Missing required fields: date, amount, bank, and categories_id are required', 400));
    }
    
    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;
    
    let validatedDate, validatedAmount, validatedBank, validatedCategory;
    
    try {
        validatedDate = validateAndFormatDate(date);
        validatedAmount = validateAndFormatAmount(amount);
        validatedBank = normalizeAndValidateBank(bank);
        
        const categoryMapping = await getCategoryMapping(verifiedUserId);
        validatedCategory = validateCategoryById(categories_id, categoryMapping);
        
    } catch (validationError) {
        return next(new AppError(validationError.message, 400));
    }
    
    const transactionData = {
        date: validatedDate,
        amount: validatedAmount,
        bank: validatedBank,
        categories_id: validatedCategory.id,
        description: description || null,
        ref_no: ref_no || null,
        user_id: verifiedUserId
    };

    const response = await nocodbService.createRecord(bankStatementsTableId, transactionData);
    
    res.json({
        success: true,
        transaction: {
            id: response.Id,
            date: transactionData.date,
            amount: transactionData.amount,
            bank: transactionData.bank,
            category: validatedCategory.name,
            description: transactionData.description
        },
        message: 'Transaction created successfully'
    });
});

const updateTransaction = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    const { id } = req.params;
    const { date, amount, bank, categories_id, description, ref_no } = req.body;

    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;

    const existingRecord = await nocodbService.getRecordById(bankStatementsTableId, id);

    // Ensure the record exists before checking ownership to prevent TypeErrors
    if (!existingRecord || Object.keys(existingRecord).length === 0) {
        return next(new AppError('Transaction not found.', 404));
    }

    if (existingRecord.user_id !== verifiedUserId) {
        return next(new AppError('Forbidden: You do not have permission to edit this transaction.', 403));
    }

    let validatedDate, validatedAmount, validatedBank, validatedCategory;

    try {
        validatedDate = validateAndFormatDate(date);
        validatedAmount = validateAndFormatAmount(amount);
        validatedBank = normalizeAndValidateBank(bank);

        const categoryMapping = await getCategoryMapping(verifiedUserId);
        validatedCategory = validateCategoryById(categories_id, categoryMapping);

    } catch (validationError) {
        return next(new AppError(validationError.message, 400));
    }

    const updatedData = {
        date: validatedDate,
        amount: validatedAmount,
        bank: validatedBank,
        categories_id: validatedCategory.id,
        description: description || null,
        ref_no: ref_no || null,
    };

    const response = await nocodbService.updateRecord(bankStatementsTableId, id, updatedData);

    res.json({
        success: true,
        transaction: {
            id: response.Id,
            date: updatedData.date,
            amount: updatedData.amount,
            bank: updatedData.bank,
            category: validatedCategory.name,
            description: updatedData.description
        },
        message: 'Transaction updated successfully'
    });
});

const deleteTransaction = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    const { id } = req.params;

    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;

    // First, verify the transaction belongs to the user
    const existingRecord = await nocodbService.getRecordById(bankStatementsTableId, id);

    // Ensure the record exists before checking ownership to prevent TypeErrors
    if (!existingRecord || Object.keys(existingRecord).length === 0) {
        return next(new AppError('Transaction not found.', 404));
    }

    if (existingRecord.user_id !== verifiedUserId) {
        return next(new AppError('Forbidden: You do not have permission to delete this transaction.', 403));
    }

    await nocodbService.deleteRecord(bankStatementsTableId, id);

    res.json({ success: true, message: 'Transaction deleted successfully' });
});

const getTransactionStats = catchAsync(async (req, res, _next) => {
    const verifiedUserId = req.user.uid;

    const { statistics } = await transactionService.getTransactions(verifiedUserId, {});

    res.json({
        success: true,
        statistics
    });
});

/**
 * Bulk inserts transactions into NocoDB in batches.
 *
 * @param {Array} records - DB-ready records with an `index` property mapping to original rows
 * @param {string} bankStatementsTableId - NocoDB table ID
 * @param {Object} categoryMapping - Optional mapping to resolve category names, if omitted names will be generic
 * @returns {Promise<Object>} Object containing successful and failed arrays
 */
async function bulkInsertTransactions(records, bankStatementsTableId, categoryMapping = {}) {
    const successful = [];
    const failed = [];
    const batchSize = 100; // NocoDB strict limit

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        try {
            // Strip out internal 'index' before sending to NocoDB
            const batchData = batch.map(({ index: _index, ...rest }) => rest);

            const response = await nocodbService.createRecord(bankStatementsTableId, batchData);

            successful.push(...batch.map((row, j) => {
                const categoryName = categoryMapping[row.categories_id] || 'Unknown';
                return {
                    row: row.index,
                    transaction: {
                        id: response[j] ? response[j].Id : null,
                        date: row.date,
                        amount: row.amount,
                        bank: row.bank,
                        category: categoryName,
                        description: row.description
                    }
                };
            }));
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            batch.forEach((row) => {
                failed.push({
                    row: row.index,
                    data: row,
                    error: errorMessage
                });
            });
        }
    }

    return { successful, failed };
}

const importTransactionsJson = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    const transactions = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return next(new AppError('Request body must be a non-empty array of transactions.', 400));
    }

    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;

    const categoryMapping = await getCategoryMapping(verifiedUserId);

    const results = [];
    const validationErrors = [];

    transactions.forEach((transaction, index) => {
        try {
            const validatedDate = validateAndFormatDate(transaction.date);
            const validatedAmount = validateAndFormatAmount(transaction.amount);
            const validatedBank = normalizeAndValidateBank(transaction.bank);
            
            let validatedCategory;
            if (transaction.categories_id) {
                validatedCategory = validateCategoryById(transaction.categories_id, categoryMapping);
            } else {
                validatedCategory = normalizeAndValidateCategory(transaction.category, categoryMapping);
            }

            results.push({
                index: index + 1,
                date: validatedDate,
                amount: validatedAmount,
                bank: validatedBank,
                categories_id: validatedCategory.id,
                description: transaction.description || null,
                ref_no: transaction.ref_no || null,
                user_id: verifiedUserId
            });
        } catch (error) {
            validationErrors.push({ row: index + 1, data: transaction, errors: [error.message] });
        }
    });

    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Some transactions failed validation.',
            summary: {
                total: transactions.length,
                successful: 0,
                failed: transactions.length,
                validationErrors: validationErrors,
                importErrors: []
            }
        });
    }

    const { successful, failed: importErrors } = await bulkInsertTransactions(results, bankStatementsTableId, categoryMapping);

    res.json({
        success: true,
        message: `Import completed: ${successful.length} successful, ${importErrors.length} failed.`,
        summary: {
            total: transactions.length,
            successful: successful.length,
            failed: importErrors.length,
            validationErrors: [],
            importErrors: importErrors,
            successfulTransactions: successful
        }
    });
});

/**
 * Fetch tagging rules for a user.
 *
 * @param {string} userId - The user ID.
 * @returns {Promise<Array>} Array of tagging rules.
 */
async function fetchTaggingRules(userId) {
    let taggingRules = [];
    try {
        const rulesResponse = await nocodbService.getRecords(env.NOCODB.TABLES.TAGGING_RULES, {
            where: `(user_id,eq,${userId})`
        });
        taggingRules = rulesResponse.list || [];
    } catch (error) {
        console.warn('Failed to fetch tagging rules during import:', error.message);
        // Continue without tagging rules
    }
    return taggingRules;
}

/**
 * Apply tagging rules to a raw transaction row.
 *
 * @param {Object} rawRow - The raw transaction row.
 * @param {Array} taggingRules - The tagging rules.
 * @param {Object} categoryMapping - The category mapping.
 */
function applyTaggingRules(rawRow, taggingRules, categoryMapping) {
    if (!rawRow.category && rawRow.description) {
        const descriptionLower = rawRow.description.toLowerCase();
        const matchedRule = taggingRules.find(rule => {
            if (!rule.keyword) return false;
            const keyword = rule.keyword.toLowerCase();
            if (rule.type === 'exact') {
                return descriptionLower === keyword;
            }
            return descriptionLower.includes(keyword); // Default to 'contains'
        });

        if (matchedRule) {
            const categoryName = categoryMapping[matchedRule.categories_id];
            if (categoryName) {
                rawRow.category = categoryName;
            }
        }
    }
}

/**
 * Process a single CSV row, apply tagging rules, and validate.
 *
 * @param {Object} data - The raw data from CSV row.
 * @param {number} rowIndex - The current row index.
 * @param {Array} taggingRules - The tagging rules.
 * @param {Object} categoryMapping - The category mapping.
 * @returns {Object} { validatedRow, rowErrors, rawRow }
 */
function processCsvRow(data, rowIndex, taggingRules, categoryMapping) {
    const rawRow = {
        index: rowIndex,
        date: data.date?.trim(),
        amount: data.amount?.trim(),
        bank: data.bank?.trim(),
        category: data.category?.trim(),
        description: data.description?.trim() || null,
        ref_no: data.ref_no?.trim() || null
    };

    applyTaggingRules(rawRow, taggingRules, categoryMapping);

    let validatedRow = null;
    const rowErrors = [];

    try {
        const validatedDate = validateAndFormatDate(rawRow.date);
        const validatedAmount = validateAndFormatAmount(rawRow.amount);
        const validatedBank = normalizeAndValidateBank(rawRow.bank);
        const validatedCategory = normalizeAndValidateCategory(rawRow.category, categoryMapping);

        validatedRow = {
            index: rowIndex,
            date: validatedDate,
            amount: validatedAmount,
            bank: validatedBank,
            category: validatedCategory,
            description: rawRow.description,
            ref_no: rawRow.ref_no
        };
    } catch (validationError) {
        rowErrors.push(validationError.message);
    }

    return { validatedRow, rowErrors, rawRow };
}


/**
 * Insert validated CSV records into NocoDB in batches.
 *
 * @param {Array} results - The validated records.
 * @param {string} bankStatementsTableId - The NocoDB table ID.
 * @param {string} verifiedUserId - The user ID.
 * @returns {Promise<Object>} { successful, failed }
 */
async function _insertCsvRecords(results, bankStatementsTableId, verifiedUserId) {
    const successful = [];
    const failed = [];
    const batchSize = 10;

    for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);

        await Promise.all(batch.map(async (row) => {
            try {
                const transactionData = {
                    date: row.date,
                    amount: row.amount,
                    bank: row.bank,
                    categories_id: parseInt(row.category.id),
                    description: row.description,
                    ref_no: row.ref_no,
                    user_id: verifiedUserId
                };

                const response = await nocodbService.createRecord(bankStatementsTableId, transactionData);

                successful.push({
                    row: row.index,
                    transaction: {
                        id: response.Id,
                        date: transactionData.date,
                        amount: transactionData.amount,
                        bank: transactionData.bank,
                        category: row.category.name,
                        description: transactionData.description
                    }
                });

            } catch (error) {
                failed.push({
                    row: row.index,
                    data: row,
                    error: error.response?.data?.message || error.message
                });
            }
        }));

        if (i + batchSize < results.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return { successful, failed };
}


/**
 * Process a CSV file stream and parse transactions.
 *
 * @param {string} filePath - Path to the CSV file.
 * @param {Array} taggingRules - The tagging rules.
 * @param {Object} categoryMapping - The category mapping.
 * @returns {Promise<Object>} { results, errors, rowIndex }
 */
function processCsvFile(filePath, taggingRules, categoryMapping) {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];
        let rowIndex = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                rowIndex++;

                const { validatedRow, rowErrors, rawRow } = processCsvRow(data, rowIndex, taggingRules, categoryMapping);

                if (rowErrors.length > 0) {
                    errors.push({
                        row: rowIndex,
                        data: rawRow,
                        errors: rowErrors
                    });
                } else if (validatedRow) {
                    results.push(validatedRow);
                }
            })
            .on('end', () => {
                // ⚡ PERF: Using async unlink instead of fs.unlinkSync avoids blocking the event loop
                fs.promises.unlink(filePath).catch(err => console.error('Failed to delete temp file:', err));
                resolve({ results, errors, rowIndex });
            })
            .on('error', (error) => {
                // ⚡ PERF: Using async unlink instead of fs.unlinkSync avoids blocking the event loop
                fs.promises.unlink(filePath).catch(err => console.error('Failed to delete temp file:', err));
                reject(error);
            });
    });
}

const importTransactionsCsv = catchAsync(async (req, res, next) => {
    try {
        const verifiedUserId = req.user.uid;

        if (!req.file) {
            throw new AppError('No CSV file provided', 400);
        }
        
        const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;
        
        const categoryMapping = await getCategoryMapping(verifiedUserId);

        const taggingRules = await fetchTaggingRules(verifiedUserId);
        
        const { results, errors, rowIndex } = await processCsvFile(req.file.path, taggingRules, categoryMapping);

        if (results.length === 0) {
            return res.json({
                success: false,
                error: 'No valid transactions found in CSV',
                summary: {
                    total: rowIndex,
                    successful: 0,
                    failed: errors.length,
                    errors: errors
                }
            });
        }

        // Format results for bulk insert
        const recordsToInsert = results.map(row => ({
            index: row.index,
            date: row.date,
            amount: row.amount,
            bank: row.bank,
            categories_id: parseInt(row.category.id),
            description: row.description,
            ref_no: row.ref_no,
            user_id: verifiedUserId
        }));

        const { successful, failed } = await bulkInsertTransactions(recordsToInsert, bankStatementsTableId, categoryMapping);
        
        res.json({
            success: true,
            message: `Import completed: ${successful.length} successful, ${failed.length + errors.length} failed`,
            summary: {
                total: rowIndex,
                successful: successful.length,
                failed: failed.length + errors.length,
                validationErrors: errors,
                importErrors: failed,
                successfulTransactions: successful
            }
        });
        
    } catch (error) {
        if (req.file) {
            // ⚡ PERF: Using async unlink instead of fs.unlinkSync avoids blocking the event loop
            fs.promises.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
        }
        
        // Pass to global error handler
        return next(new AppError(error.message, 500));
    }
});

module.exports = {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats,
    importTransactionsJson,
    importTransactionsCsv,
};
