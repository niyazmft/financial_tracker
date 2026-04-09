const nocodbService = require('../services/nocodbService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const TAGGING_RULES_TABLE_ID = env.NOCODB.TABLES.TAGGING_RULES;

exports.getRules = catchAsync(async (req, res, next) => {
    const userId = req.user.uid;

    if (!TAGGING_RULES_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB TAGGING_RULES_TABLE_ID configuration.', 500));
    }
    
    const query = `(user_id,eq,${userId})`;
    const rules = await nocodbService.getRecords(TAGGING_RULES_TABLE_ID, { where: query });

    res.status(200).json({
        status: 'success',
        data: {
            rules: rules.list || []
        }
    });
});

exports.createRule = catchAsync(async (req, res, next) => {
    const userId = req.user.uid;
    const { keyword, category_id, type = 'contains' } = req.body;

    if (!keyword || !category_id) {
        return next(new AppError('Keyword and category are required', 400));
    }

    if (!TAGGING_RULES_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB TAGGING_RULES_TABLE_ID configuration.', 500));
    }

    // 1. Check rule limit (Free tier: max 3 rules)
    const query = `(user_id,eq,${userId})`;
    const existingRules = await nocodbService.getRecords(TAGGING_RULES_TABLE_ID, { where: query });
    
    if (existingRules.list.length >= 3) {
        return next(new AppError('You have reached the maximum limit of 3 tagging rules.', 403));
    }

    // 2. Create rule
    const newRule = await nocodbService.createRecord(TAGGING_RULES_TABLE_ID, {
        user_id: userId,
        keyword,
        categories_id: category_id,
        type
    });

    res.status(201).json({
        status: 'success',
        data: {
            rule: newRule
        }
    });
});


exports.deleteRule = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Verify ownership
    const ruleToDelete = await nocodbService.getRecordById(TAGGING_RULES_TABLE_ID, id);
    if (!ruleToDelete || ruleToDelete.user_id !== req.user.uid) {
        return next(new AppError('Forbidden: You do not have permission to delete this rule.', 403));
    }
    
    await nocodbService.deleteRecord(TAGGING_RULES_TABLE_ID, id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateRule = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { keyword, category_id } = req.body;

    if (!keyword || !category_id) {
        return next(new AppError('Keyword and category are required', 400));
    }

    // Verify ownership
    const ruleToUpdate = await nocodbService.getRecordById(TAGGING_RULES_TABLE_ID, id);
    if (!ruleToUpdate || ruleToUpdate.user_id !== req.user.uid) {
        return next(new AppError('Forbidden: You do not have permission to update this rule.', 403));
    }

    const updatedRule = await nocodbService.updateRecord(TAGGING_RULES_TABLE_ID, {
        Id: id,
        keyword,
        categories_id: category_id,
    });

    res.status(200).json({
        status: 'success',
        data: {
            rule: updatedRule
        }
    });
});
