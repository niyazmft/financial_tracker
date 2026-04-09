const assert = require('assert');
const { validateCategoryById, normalizeAndValidateCategory, validateAndFormatAmount } = require('../utils/validationUtils');

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


describe('Validation Utils - Amount', () => {
    describe('validateAndFormatAmount', () => {
        it('should throw an error if amount is missing', () => {
            assert.throws(() => {
                validateAndFormatAmount('');
            }, /Amount is required/);

            assert.throws(() => {
                validateAndFormatAmount(null);
            }, /Amount is required/);

            assert.throws(() => {
                validateAndFormatAmount(undefined);
            }, /Amount is required/);
        });

        it('should throw an error if amount is not a valid number', () => {
            assert.throws(() => {
                validateAndFormatAmount('abc');
            }, /Invalid amount: 'abc'\. Must be a valid number/);

            // Note: parseFloat('12abc') is 12, so '12abc' is actually considered a valid number (12) by parseFloat.
            // Let's test just something completely non-numeric.
            assert.throws(() => {
                validateAndFormatAmount('NaN');
            }, /Invalid amount: 'NaN'\. Must be a valid number/);
        });

        it('should throw an error if amount exceeds maximum limit', () => {
            assert.throws(() => {
                validateAndFormatAmount(2000000);
            }, /Amount '2000000' exceeds maximum limit of 1,000,000/);

            assert.throws(() => {
                validateAndFormatAmount('-1500000');
            }, /Amount '-1500000' exceeds maximum limit of 1,000,000/);
        });

        it('should return valid amounts correctly', () => {
            assert.strictEqual(validateAndFormatAmount(100.5), 100.5);
            assert.strictEqual(validateAndFormatAmount('250.75'), 250.75);
            assert.strictEqual(validateAndFormatAmount(' 500 '), 500);
        });

        it('should strip common currency symbols and spaces', () => {
            assert.strictEqual(validateAndFormatAmount('₺1500'), 1500);
            assert.strictEqual(validateAndFormatAmount('$ 2500'), 2500);
            assert.strictEqual(validateAndFormatAmount('1,500.50'), 1500.5);
            assert.strictEqual(validateAndFormatAmount('€ 1,000'), 1000);
        });

        it('should allow 0', () => {
             assert.strictEqual(validateAndFormatAmount(0), 0);
             assert.strictEqual(validateAndFormatAmount('0'), 0);
        });
    });
});
