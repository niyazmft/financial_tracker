const assert = require('assert');
const { validateCategoryById, normalizeAndValidateCategory, normalizeTurkishChars } = require('../utils/validationUtils');

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

describe('Validation Utils - normalizeTurkishChars', () => {
    it('should normalize lowercase Turkish characters', () => {
        const input = 'ığüşöç';
        const expected = 'igusoc';
        assert.strictEqual(normalizeTurkishChars(input), expected);
    });

    it('should normalize uppercase Turkish characters', () => {
        const input = 'İĞÜŞÖÇ';
        const expected = 'IGUSOC';
        assert.strictEqual(normalizeTurkishChars(input), expected);
    });

    it('should handle mixed strings', () => {
        const input = 'Pijamalı hasta, yağız şoföre çabucak güvendi';
        const expected = 'Pijamali hasta, yagiz sofore cabucak guvendi';
        assert.strictEqual(normalizeTurkishChars(input), expected);
    });

    it('should return non-string inputs as-is', () => {
        assert.strictEqual(normalizeTurkishChars(null), null);
        assert.strictEqual(normalizeTurkishChars(undefined), undefined);
        assert.strictEqual(normalizeTurkishChars(123), 123);
        const obj = {};
        assert.strictEqual(normalizeTurkishChars(obj), obj);
    });

    it('should handle empty strings', () => {
        assert.strictEqual(normalizeTurkishChars(''), '');
    });
});
