import { describe, it, expect } from 'vitest';
import { capitalizeWords } from '../../src/services/utils';

describe('utils.js - capitalizeWords', () => {
    it('should capitalize basic English words correctly', () => {
        expect(capitalizeWords('hello world')).toBe('Hello World');
        expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle Turkish characters correctly', () => {
        expect(capitalizeWords('iğne')).toBe('İğne');
        expect(capitalizeWords('ıspanak')).toBe('Ispanak');
        expect(capitalizeWords('İSTANBUL')).toBe('İstanbul');
        expect(capitalizeWords('IŞIK')).toBe('Işık');
        expect(capitalizeWords('eğlence')).toBe('Eğlence');
    });

    it('should handle multiple words with Turkish characters', () => {
        expect(capitalizeWords('eğlence ve spor')).toBe('Eğlence Ve Spor');
    });

    it('should return the input if it is not a string or is empty', () => {
        expect(capitalizeWords('')).toBe('');
        expect(capitalizeWords(null)).toBe(null);
        expect(capitalizeWords(undefined)).toBe(undefined);
        expect(capitalizeWords(123)).toBe(123);
    });

    it('should handle multiple spaces correctly', () => {
        // Current implementation joins with single space, which is usually fine for these names
        expect(capitalizeWords('hello   world')).toBe('Hello World');
    });
});
