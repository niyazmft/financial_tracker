const nocodbService = require('../services/nocodbService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const INSTALLMENTS_TABLE_ID = env.NOCODB.TABLES.INSTALLMENTS;

const getInstallments = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;

    if (!INSTALLMENTS_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB INSTALLMENTS_TABLE_ID configuration.', 500));
    }
    
    const params = {
        where: `(user_id,eq,${verifiedUserId})`,
        limit: 10000,
        sort: 'start_date',
        nested: true
    };
    
    const response = await nocodbService.getRecords(INSTALLMENTS_TABLE_ID, params);
    
    res.status(200).json({
        success: true,
        installments: response.list || [],
        total: response.pageInfo?.totalRows || response.list?.length || 0
    });
});

const updateInstallment = catchAsync(async (req, res, next) => {
    const { id, paid } = req.body;

    if (!id || typeof paid !== 'boolean') {
        return next(new AppError('id and paid status (boolean) are required', 400));
    }

    // Verify ownership before updating
    const existingRecord = await nocodbService.getRecordById(INSTALLMENTS_TABLE_ID, id);
    if (!existingRecord || existingRecord.user_id !== req.user.uid) {
        return next(new AppError('Forbidden: You do not have permission to edit this installment.', 403));
    }

    const response = await nocodbService.updateRecord(INSTALLMENTS_TABLE_ID, { Id: id, paid });

    res.status(200).json({ success: true, installment: response });
});

const batchUpdateInstallments = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return next(new AppError('Request body must be a non-empty array of updates.', 400));
    }

    if (!INSTALLMENTS_TABLE_ID) {
        return next(new AppError('Backend is missing NocoDB INSTALLMENTS_TABLE_ID configuration.', 500));
    }

    const idsToUpdate = updates.map(u => u.id);
    const whereClause = `(Id,in,${idsToUpdate.join(',')})~and(user_id,eq,${verifiedUserId})`;
    
    const { list: authorizedRecords } = await nocodbService.getRecords(INSTALLMENTS_TABLE_ID, { where: whereClause });
    const authorizedIds = new Set(authorizedRecords.map(r => r.Id));

    const updatePromises = updates.map(update => {
        if (!authorizedIds.has(update.id)) {
            return Promise.reject(new AppError(`Unauthorized access to installment ID: ${update.id}`, 403));
        }

        const payload = { Id: update.id };
        let hasChanges = false;
        
        const fields = ['paid', 'start_date', 'installment_payment', 'categories_id'];
        fields.forEach(field => {
            if (update[field] !== undefined) {
                payload[field] = update[field];
                hasChanges = true;
            }
        });

        if (!hasChanges) {
             return Promise.reject(new AppError(`No valid update fields for installment ID: ${update.id}`, 400));
        }

        return nocodbService.updateRecord(INSTALLMENTS_TABLE_ID, payload);
    });

    const results = await Promise.allSettled(updatePromises);

    const successfulUpdates = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failedUpdates = results.filter(r => r.status === 'rejected').map(r => r.reason.message);

    res.status(200).json({
        success: failedUpdates.length === 0,
        successfulCount: successfulUpdates.length,
        failedCount: failedUpdates.length,
        details: { successful: successfulUpdates, failed: failedUpdates }
    });
});

const deleteInstallment = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Verify ownership before deleting
    const existingRecord = await nocodbService.getRecordById(INSTALLMENTS_TABLE_ID, id);
    if (!existingRecord || existingRecord.user_id !== req.user.uid) {
        return next(new AppError('Forbidden: You do not have permission to delete this installment.', 403));
    }

    await nocodbService.deleteRecord(INSTALLMENTS_TABLE_ID, id);

    res.status(204).json({ success: true, data: null });
});

module.exports = {
    getInstallments,
    updateInstallment,
    batchUpdateInstallments,
    deleteInstallment,
};