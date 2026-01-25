const nocodbService = require('../services/nocodbService');
const { getCategoryMapping } = require('../services/categoryService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const getCategories = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    const categoriesTableId = env.NOCODB.TABLES.CATEGORIES;
    
    const whereClause = `(user_id,eq,${verifiedUserId})${(req.query.includeGlobal ? '~or(user_id,isnull)' : '')}`;
    
    const response = await nocodbService.getRecords(categoriesTableId, { where: whereClause });
    const categories = response.list || [];
    
    res.status(200).json({ success: true, categories });
});

const getCategoryTypes = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const categoriesTableId = env.NOCODB.TABLES.CATEGORIES;
    const whereClause = `(user_id,eq,${verifiedUserId})`;

    const response = await nocodbService.getRecords(categoriesTableId, { where: whereClause, limit: 1000 });
    const categories = response.list || [];
    
    const types = [...new Set(categories.map(c => c.type).filter(Boolean))];

    if (types.length > 0) {
        res.status(200).json({ success: true, types });
    } else {
        // Provide a fallback if user has no categories with types yet
        res.status(200).json({ success: true, types: ['spending', 'earning', 'saving'] });
    }
});

const createCategory = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { category_name, type } = req.body;
    
    if (!category_name || !type) {
        return next(new AppError('category_name and type are required', 400));
    }
    
    const categoriesTableId = env.NOCODB.TABLES.CATEGORIES;
    
    const response = await nocodbService.createRecord(categoriesTableId, {
        category_name,
        type,
        user_id: verifiedUserId
    });
    
    res.status(201).json({ success: true, category: response });
});

const updateCategory = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { id } = req.params;
    const { category_name, type } = req.body;

    if (!category_name && !type) {
        return next(new AppError('category_name or type is required', 400));
    }

    const categoriesTableId = env.NOCODB.TABLES.CATEGORIES;

    // Verify ownership
    const existingRecord = await nocodbService.getRecordById(categoriesTableId, id);
    if (!existingRecord || existingRecord.user_id !== verifiedUserId) {
        return next(new AppError('Forbidden: You do not have permission to edit this category.', 403));
    }

    const updatePayload = { Id: id };
    if (category_name) updatePayload.category_name = category_name;
    if (type) updatePayload.type = type;

    const response = await nocodbService.updateRecord(categoriesTableId, updatePayload);

    res.status(200).json({ success: true, category: response });
});

const deleteCategory = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { id } = req.params;
    const { targetCategoryId } = req.body;

    if (!targetCategoryId) {
        return next(new AppError('targetCategoryId is required for merging', 400));
    }
    if (id == targetCategoryId) {
        return next(new AppError('Cannot merge a category into itself', 400));
    }

    const { CATEGORIES, BANK_STATEMENTS, ITEMS } = env.NOCODB.TABLES;
    
    // 1. Verify ownership of both categories
    const [catToDelete, targetCat] = await Promise.all([
        nocodbService.getRecordById(CATEGORIES, id),
        nocodbService.getRecordById(CATEGORIES, targetCategoryId)
    ]);

    if (!catToDelete || catToDelete.user_id !== verifiedUserId || !targetCat || targetCat.user_id !== verifiedUserId) {
        return next(new AppError('Forbidden: You do not own one or both of the categories.', 403));
    }

    // 2. Re-assign records in bank_statements
    const statementsToUpdate = (await nocodbService.getRecords(BANK_STATEMENTS, { where: `(categories_id,eq,${id})` })).list || [];
    if (statementsToUpdate.length > 0) {
        const updatePayload = statementsToUpdate.map(r => ({ Id: r.Id, categories_id: targetCategoryId }));
        await nocodbService.updateRecord(BANK_STATEMENTS, updatePayload);
    }

    // 3. Re-assign records in items
    const itemsToUpdate = (await nocodbService.getRecords(ITEMS, { where: `(categories_id,eq,${id})` })).list || [];
    if (itemsToUpdate.length > 0) {
        const updatePayload = itemsToUpdate.map(r => ({ Id: r.Id, categories_id: targetCategoryId }));
        await nocodbService.updateRecord(ITEMS, updatePayload);
    }

    // 4. Delete the original category
    await nocodbService.deleteRecord(CATEGORIES, id);

    res.status(200).json({ success: true, message: 'Category deleted and records merged successfully.' });
});

const createItem = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { item_name, categories_id } = req.body;
    
    if (!item_name || !categories_id) {
        return next(new AppError('item_name and categories_id are required', 400));
    }

    const categoryMapping = await getCategoryMapping(verifiedUserId);
    if (!Object.keys(categoryMapping).includes(categories_id.toString())) {
        return next(new AppError('Forbidden: You do not have permission to use this category.', 403));
    }
    
    const itemsTableId = env.NOCODB.TABLES.ITEMS;
    
    const response = await nocodbService.createRecord(itemsTableId, {
        item_name,
        categories_id,
        user_id: verifiedUserId
    });
    
    res.status(201).json({ success: true, item: response });
});

const updateItem = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { id } = req.params;
    const { item_name } = req.body;

    if (!item_name) {
        return next(new AppError('item_name is required', 400));
    }

    const itemsTableId = env.NOCODB.TABLES.ITEMS;

    // Verify ownership
    const existingRecord = await nocodbService.getRecordById(itemsTableId, id);
    if (!existingRecord || existingRecord.user_id !== verifiedUserId) {
        return next(new AppError('Forbidden: You do not have permission to edit this item.', 403));
    }

    const response = await nocodbService.updateRecord(itemsTableId, { Id: id, item_name });

    res.status(200).json({ success: true, item: response });
});

const deleteItem = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { id } = req.params;

    const itemsTableId = env.NOCODB.TABLES.ITEMS;
    const installmentsTableId = env.NOCODB.TABLES.INSTALLMENTS;

    // Verify ownership
    const existingRecord = await nocodbService.getRecordById(itemsTableId, id);
    if (!existingRecord || existingRecord.user_id !== verifiedUserId) {
        return next(new AppError('Forbidden: You do not have permission to delete this item.', 403));
    }

    // Delete associated installments first (cascade delete manually)
    // We need to find installments linked to this item
    const installments = await nocodbService.getRecords(installmentsTableId, { where: `(items_id,eq,${id})` });
    if (installments.list && installments.list.length > 0) {
        const deletePromises = installments.list.map(inst => nocodbService.deleteRecord(installmentsTableId, inst.Id));
        await Promise.all(deletePromises);
    }

    // Delete the item
    await nocodbService.deleteRecord(itemsTableId, id);

    res.status(200).json({ success: true, message: 'Item and associated installments deleted successfully.' });
});

const createInstallment = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { start_date, installment_payment, categories_id, items_id, paid = false } = req.body;
    
    if (!start_date || !installment_payment || !categories_id || !items_id) {
        return next(new AppError('start_date, installment_payment, categories_id, and items_id are required', 400));
    }
    
    const installmentsTableId = env.NOCODB.TABLES.INSTALLMENTS;
    
    const response = await nocodbService.createRecord(installmentsTableId, {
        start_date,
        installment_payment,
        categories_id,
        items_id,
        paid,
        user_id: verifiedUserId
    });
    
    res.status(201).json({ success: true, installment: response });
});

module.exports = {
    getCategories,
    getCategoryTypes,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    createInstallment,
};