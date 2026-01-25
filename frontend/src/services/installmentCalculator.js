/**
 * Installment Calculator Core Module - ES6 Version
 */

export function parseAmount(value) {
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addMonthsToDate(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

export function calculateDueDate(startDate, installmentIndex, frequency) {
    let dueDate;
    const startDateObj = new Date(startDate);
    
    switch (frequency) {
        case 'weekly':
            dueDate = addDaysToDate(startDateObj, installmentIndex * 7);
            break;
        case 'bi-weekly':
            dueDate = addDaysToDate(startDateObj, installmentIndex * 14);
            break;
        case 'monthly':
        default:
            dueDate = addMonthsToDate(startDateObj, installmentIndex);
            break;
    }
    
    return formatDate(dueDate);
}

export function generateSchedule(params) {
    const { totalAmount, startDate, installmentCount, frequency } = params;
    
    if (!totalAmount || !startDate || !installmentCount || !frequency) {
        throw new Error('Missing required parameters for schedule generation');
    }
    
    const parsedAmount = parseAmount(totalAmount);
    const baseAmount = Math.floor((parsedAmount * 100) / installmentCount) / 100;
    const remainder = Math.round((parsedAmount - (baseAmount * installmentCount)) * 100) / 100;
    
    const schedule = [];
    
    for (let i = 0; i < installmentCount; i++) {
        const installment = {
            number: i + 1,
            dueDate: calculateDueDate(startDate, i, frequency),
            amount: baseAmount,
            isEditable: true
        };
        
        if (i === installmentCount - 1) {
            installment.amount = Math.round((installment.amount + remainder) * 100) / 100;
        }
        
        schedule.push(installment);
    }
    
    return schedule;
}

export function rebalanceSchedule(schedule, editedIndex, newAmount, targetTotal) {
    const newSchedule = schedule.map(item => ({ ...item }));
    const parsedNewAmount = parseAmount(newAmount);
    const parsedTargetTotal = parseAmount(targetTotal);
    
    newSchedule[editedIndex].amount = parsedNewAmount;
    
    const remainingTotal = parsedTargetTotal - parsedNewAmount;
    const otherInstallmentsCount = schedule.length - 1;
    
    if (otherInstallmentsCount === 0) return newSchedule;
    
    if (remainingTotal < 0) {
        const excessAmount = Math.abs(remainingTotal);
        const reductionPerInstallment = Math.round((excessAmount / otherInstallmentsCount) * 100) / 100;
        
        newSchedule.forEach((installment, index) => {
            if (index !== editedIndex) {
                installment.amount = Math.max(0, installment.amount - reductionPerInstallment);
            }
        });
    } else {
        const baseAmount = Math.floor((remainingTotal * 100) / otherInstallmentsCount) / 100;
        const remainder = Math.round((remainingTotal - (baseAmount * otherInstallmentsCount)) * 100) / 100;
        
        let remainderDistributed = 0;
        newSchedule.forEach((installment, index) => {
            if (index !== editedIndex) {
                installment.amount = baseAmount;
                if (remainderDistributed < remainder) {
                    installment.amount = Math.round((installment.amount + 0.01) * 100) / 100;
                    remainderDistributed = Math.round((remainderDistributed + 0.01) * 100) / 100;
                }
            }
        });
    }
    
    return newSchedule;
}

export function rebalanceAfterDeletion(remainingAmounts, originalPlanTotal) {
    if (remainingAmounts.length === 0) return [];

    const currentSum = remainingAmounts.reduce((sum, amount) => sum + parseAmount(amount), 0);
    const amountToDistribute = parseAmount(originalPlanTotal) - currentSum;

    if (amountToDistribute === 0) return remainingAmounts.map(parseAmount);

    const newAmounts = remainingAmounts.map(parseAmount);
    const count = newAmounts.length;
    const baseAddition = Math.floor((amountToDistribute * 100) / count) / 100;
    let remainderCents = Math.round((amountToDistribute - (baseAddition * count)) * 100);

    for (let i = 0; i < count; i++) {
        newAmounts[i] = parseAmount(newAmounts[i] + baseAddition);
        if (remainderCents > 0) {
            newAmounts[i] = parseAmount(newAmounts[i] + 0.01);
            remainderCents--;
        } else if (remainderCents < 0) {
            newAmounts[i] = parseAmount(newAmounts[i] - 0.01);
            remainderCents++;
        }
    }

    return newAmounts;
}
