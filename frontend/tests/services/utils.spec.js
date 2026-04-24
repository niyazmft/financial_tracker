import { describe, it, expect } from 'vitest';
import { capitalizeWords } from '../../src/services/utils';

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
});
