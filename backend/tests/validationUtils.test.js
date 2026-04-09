const assert = require('assert');
const { validateCategoryById, normalizeAndValidateCategory, validateAndFormatDate } = require('../utils/validationUtils');


describe('Validation Utils - Dates', () => {
    describe('validateAndFormatDate', () => {
        it('should format YYYY-MM-DD correctly', () => {
            const result = validateAndFormatDate('2023-05-15');
            assert.strictEqual(result, '2023-05-15');
        });

        it('should format YYYY-M-D correctly with padding', () => {
            const result = validateAndFormatDate('2023-5-5');
            assert.strictEqual(result, '2023-05-05');
        });

        it('should format DD/MM/YYYY correctly', () => {
            const result = validateAndFormatDate('15/05/2023');
            assert.strictEqual(result, '2023-05-15');
        });

        it('should format DD-MM-YYYY correctly', () => {
            const result = validateAndFormatDate('15-05-2023');
            assert.strictEqual(result, '2023-05-15');
        });

        it('should handle unicode minus signs', () => {
            const result = validateAndFormatDate('2023—05—15'); // em dash
            assert.strictEqual(result, '2023-05-15');
        });

        it('should throw an error for missing date', () => {
            assert.throws(() => validateAndFormatDate(null), /Date is required/);
            assert.throws(() => validateAndFormatDate(''), /Date is required/);
        });

        it('should throw an error for non-string input', () => {
            assert.throws(() => validateAndFormatDate(20230515), /Date is required/);
        });

        it('should throw an error for invalid format', () => {
            assert.throws(() => validateAndFormatDate('05 Jan 2023'), /Invalid date format/);
        });

        it('should throw an error for invalid date components', () => {
            assert.throws(() => validateAndFormatDate('2023-13-15'), /Invalid date:/);
        });

        it('should throw an error for date outside acceptable past range', () => {
            const pastYear = new Date().getFullYear() - 11;
            assert.throws(() => validateAndFormatDate(`${pastYear}-01-01`), /is outside acceptable range/);
        });

        it('should throw an error for date outside acceptable future range', () => {
            const futureYear = new Date().getFullYear() + 2;
            assert.throws(() => validateAndFormatDate(`${futureYear}-01-01`), /is outside acceptable range/);
        });
    });
});

describe('Validation Utils - Categories', () => {
    const mockCategoryMapping = {
        '10': 'Groceries',
        '20': 'Salary',
        '30': 'Entertainment'
    };

    describe('validateCategoryById', () => {
        it('should return ID and Name for a valid ID', () => {
            const result = validateCategoryById(10, mockCategoryMapping);
            assert.deepStrictEqual(result, { id: 10, name: 'Groceries' });
        });

        it('should handle string IDs correctly', () => {
            const result = validateCategoryById('20', mockCategoryMapping);
            assert.deepStrictEqual(result, { id: 20, name: 'Salary' });
        });

        it('should throw an error for a non-existent ID', () => {
            assert.throws(() => {
                validateCategoryById(999, mockCategoryMapping);
            }, /Invalid or unauthorized Category ID: 999/);
        });

        it('should throw an error if categoryId is missing', () => {
            assert.throws(() => {
                validateCategoryById(null, mockCategoryMapping);
            }, /Category ID is required/);
        });
    });

    describe('normalizeAndValidateCategory (Legacy)', () => {
        it('should return ID and Name for a valid name match', () => {
            const result = normalizeAndValidateCategory('Salary', mockCategoryMapping);
            assert.deepStrictEqual(result, { id: 20, name: 'Salary' });
        });

        it('should be case-insensitive', () => {
            const result = normalizeAndValidateCategory('groceries', mockCategoryMapping);
            assert.deepStrictEqual(result, { id: 10, name: 'Groceries' });
        });

        it('should handle Turkish characters', () => {
            const mappingWithTurkish = { '40': 'Maaş' };
            const result = normalizeAndValidateCategory('maas', mappingWithTurkish);
            assert.deepStrictEqual(result, { id: 40, name: 'Maaş' });
        });

        it('should throw an error for unknown names', () => {
            assert.throws(() => {
                normalizeAndValidateCategory('Unknown', mockCategoryMapping);
            }, /Category 'Unknown' not found/);
        });
    });
});
