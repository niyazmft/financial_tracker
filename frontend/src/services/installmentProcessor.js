/**
 * Installment Plans Data Processor - ES6 Version
 */

function getItemName(inst) {
    if (!inst || !inst.items) return 'Unknown Plan';
    if (Array.isArray(inst.items)) return inst.items.length > 0 ? (inst.items[0].item_name || 'Unknown Plan') : 'Unknown Plan';
    return inst.items.item_name || 'Unknown Plan';
}

function getCategoryName(inst) {
    if (!inst || !inst.categories) return 'Uncategorized';
    if (Array.isArray(inst.categories)) return inst.categories.length > 0 ? (inst.categories[0].category_name || 'Uncategorized') : 'Uncategorized';
    return inst.categories.category_name || 'Uncategorized';
}

function getMonthYear(dateString) {
    const date = new Date(dateString);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
}

export function processUpcomingPayments(installments) {
    const groups = {};
    const unpaid = installments.filter(inst => !inst.paid);
    
    unpaid.forEach(inst => {
        const monthYear = getMonthYear(inst.start_date);
        const key = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}`;
        
        if (!groups[key]) {
            groups[key] = {
                groupKey: key,
                monthName: monthYear.monthName,
                year: monthYear.year,
                month: monthYear.month,
                installments: []
            };
        }
        
        groups[key].installments.push({
            ...inst,
            planName: getItemName(inst),
            categoryName: getCategoryName(inst),
            dueDate: inst.start_date,
            amount: inst.installment_payment
        });
    });
    
    return Object.values(groups).sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
}

export function processAllPlans(installments) {
    const planGroups = {};
    installments.forEach(inst => {
        const planName = getItemName(inst);
        if (!planGroups[planName]) planGroups[planName] = { planName, installments: [] };
        planGroups[planName].installments.push(inst);
    });
    
    return Object.values(planGroups).map(group => {
        const insts = group.installments;
        const total = insts.reduce((sum, i) => sum + (i.installment_payment || 0), 0);
        const paid = insts.filter(i => i.paid).reduce((sum, i) => sum + (i.installment_payment || 0), 0);
        const progress = total > 0 ? (paid / total) * 100 : 0;
        
        return {
            planName: group.planName,
            categoryName: getCategoryName(insts[0]),
            itemId: insts[0]?.items_id,
            categoryId: insts[0]?.categories_id,
            totalAmount: total,
            amountPaid: paid,
            progress,
            installmentCount: insts.length,
            installments: insts
        };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
}
