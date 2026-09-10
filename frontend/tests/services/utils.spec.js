import { describe, it, expect } from 'vitest';
import { capitalizeWords, parseCsv } from '../../src/services/utils';

describe('utils.js', () => {
    describe('capitalizeWords', () => {
        it('capitalizes standard english words correctly', () => {
            expect(capitalizeWords('hello world')).toBe('Hello World');
        });

        it('handles turkish specific characters properly', () => {
            expect(capitalizeWords('eğlence')).toBe('Eğlence');
            expect(capitalizeWords('EĞLENCE')).toBe('Eğlence');
            expect(capitalizeWords('işlem')).toBe('İşlem');
            expect(capitalizeWords('IŞIK')).toBe('Işık');
            expect(capitalizeWords('özel ÇÖZÜM')).toBe('Özel Çözüm');
        });

        it('returns original input if not a string', () => {
            expect(capitalizeWords(null)).toBe(null);
            expect(capitalizeWords(undefined)).toBe(undefined);
            expect(capitalizeWords(123)).toBe(123);
        });
    });

    describe('parseCsv', () => {
        it('parses a simple CSV with headers and rows', () => {
            const csv = 'date,amount,bank\n2026-01-01,-10.00,My Bank\n2026-01-02,-20.00,Other Bank';
            expect(parseCsv(csv)).toEqual([
                ['date', 'amount', 'bank'],
                ['2026-01-01', '-10.00', 'My Bank'],
                ['2026-01-02', '-20.00', 'Other Bank']
            ]);
        });

        it('handles commas inside quoted fields', () => {
            const csv = 'date,description\n2026-01-01,"Dining with friends, family"';
            expect(parseCsv(csv)).toEqual([
                ['date', 'description'],
                ['2026-01-01', 'Dining with friends, family']
            ]);
        });

        it('handles escaped quotes inside quoted fields', () => {
            const csv = 'description\n"He said ""hello"" to me"';
            expect(parseCsv(csv)).toEqual([
                ['description'],
                ['He said "hello" to me']
            ]);
        });

        it('handles CRLF line endings', () => {
            const csv = 'date,amount\r\n2026-01-01,-10.00\r\n';
            expect(parseCsv(csv)).toEqual([
                ['date', 'amount'],
                ['2026-01-01', '-10.00']
            ]);
        });

        it('returns null on unbalanced quotes', () => {
            expect(parseCsv('date,description\n2026-01-01,"unclosed')).toBe(null);
        });

        it('returns empty array for empty input', () => {
            expect(parseCsv('')).toEqual([]);
            expect(parseCsv('   ')).toEqual([]);
        });
    });
});
