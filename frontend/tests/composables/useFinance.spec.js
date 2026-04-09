import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFinance } from '../../src/composables/useFinance';
import { useSettingsStore } from '../../src/stores/settings';
import { createPinia, setActivePinia } from 'pinia';
import * as utils from '../../src/services/utils';

// Mock utils formatting
vi.mock('../../src/services/utils', async () => {
    const actual = await vi.importActual('../../src/services/utils');
    return {
        ...actual,
        formatCurrency: vi.fn((amount, currency, useKFormat) => {
            return `FORMATTED_CURRENCY_${amount}_${currency}_${useKFormat}`;
        })
    };
});

describe('useFinance composable', () => {
    let finance;
    let settingsStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        settingsStore = useSettingsStore();
        settingsStore.currency = 'EUR';

        finance = useFinance();
    });

    describe('formatCurrency', () => {
        it('should format currency with default settings store currency', () => {
            const result = finance.formatCurrency(1000);
            expect(result).toBe('FORMATTED_CURRENCY_1000_EUR_true');
            expect(utils.formatCurrency).toHaveBeenCalledWith(1000, 'EUR', true);
        });

        it('should format currency with custom currency parameter', () => {
            const result = finance.formatCurrency(1000, 'USD');
            expect(result).toBe('FORMATTED_CURRENCY_1000_USD_true');
            expect(utils.formatCurrency).toHaveBeenCalledWith(1000, 'USD', true);
        });
    });

    describe('getAmountClass', () => {
        it('should return hidden for N/A or null', () => {
            expect(finance.getAmountClass('N/A')).toBe('hidden');
            expect(finance.getAmountClass(null)).toBe('hidden');
        });

        it('should return correct class for percentage strings', () => {
            expect(finance.getAmountClass('10%')).toBe('text-success');
            expect(finance.getAmountClass('-10%')).toBe('text-danger');
            expect(finance.getAmountClass('0%')).toBe('text-text-sub');
            expect(finance.getAmountClass('invalid%')).toBe('text-text-sub');
        });

        it('should return correct class for positive numbers', () => {
            expect(finance.getAmountClass(10)).toBe('text-success font-medium');
            expect(finance.getAmountClass('10.5')).toBe('text-success font-medium');
        });

        it('should return correct class for negative numbers', () => {
            expect(finance.getAmountClass(-10)).toBe('text-danger font-medium');
            expect(finance.getAmountClass('-10.5')).toBe('text-danger font-medium');
        });

        it('should return sub text class for zero or invalid inputs', () => {
            expect(finance.getAmountClass(0)).toBe('text-text-sub font-medium');
            expect(finance.getAmountClass('0')).toBe('text-text-sub font-medium');
            expect(finance.getAmountClass('invalid')).toBe('text-text-sub');
            expect(finance.getAmountClass(NaN)).toBe('text-text-sub');
        });
    });

    describe('getExpenseTrendClass', () => {
        it('should return hidden for N/A or null', () => {
            expect(finance.getExpenseTrendClass('N/A')).toBe('hidden');
            expect(finance.getExpenseTrendClass(null)).toBe('hidden');
        });

        it('should return danger class for positive values (increased spending)', () => {
            expect(finance.getExpenseTrendClass(10)).toBe('text-danger');
            expect(finance.getExpenseTrendClass('+$10')).toBe('text-danger');
            expect(finance.getExpenseTrendClass('10.5')).toBe('text-danger');
        });

        it('should return success class for negative values (decreased spending)', () => {
            expect(finance.getExpenseTrendClass(-10)).toBe('text-success');
            expect(finance.getExpenseTrendClass('-$10')).toBe('text-success');
            expect(finance.getExpenseTrendClass('-10.5')).toBe('text-success');
        });

        it('should return sub text class for zero or invalid values', () => {
            expect(finance.getExpenseTrendClass(0)).toBe('text-text-sub');
            expect(finance.getExpenseTrendClass('$0')).toBe('text-text-sub');
            expect(finance.getExpenseTrendClass('invalid')).toBe('text-text-sub');
            expect(finance.getExpenseTrendClass(NaN)).toBe('text-text-sub');
        });
    });

    describe('getForecastAmountClass', () => {
        it('should return text-danger for negative forecast amounts', () => {
            expect(finance.getForecastAmountClass(-10)).toBe('text-danger');
            expect(finance.getForecastAmountClass('-10')).toBe('text-danger');
            expect(finance.getForecastAmountClass('-$10.5')).toBe('text-danger');
        });

        it('should return text-text-main for positive forecast amounts', () => {
            expect(finance.getForecastAmountClass(10)).toBe('text-text-main');
            expect(finance.getForecastAmountClass('10')).toBe('text-text-main');
            expect(finance.getForecastAmountClass('+$10.5')).toBe('text-text-main');
            expect(finance.getForecastAmountClass(0)).toBe('text-text-main');
        });

        it('should return empty string for invalid forecast amounts', () => {
            expect(finance.getForecastAmountClass('invalid')).toBe('');
            expect(finance.getForecastAmountClass(NaN)).toBe('');
        });
    });
});
