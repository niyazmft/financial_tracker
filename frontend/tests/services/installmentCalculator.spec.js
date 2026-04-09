import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  calculateDueDate,
  generateSchedule,
  rebalanceSchedule,
  rebalanceAfterDeletion
} from '../../src/services/installmentCalculator';

describe('installmentCalculator', () => {
  describe('parseAmount', () => {
    it('parses valid numeric strings', () => {
      expect(parseAmount('100')).toBe(100);
      expect(parseAmount('100.5')).toBe(100.5);
      expect(parseAmount('100.55')).toBe(100.55);
    });

    it('rounds to 2 decimal places', () => {
      expect(parseAmount(100.555)).toBe(100.56);
      expect(parseAmount('100.554')).toBe(100.55);
    });

    it('handles non-numeric strings', () => {
      expect(parseAmount('abc')).toBe(0);
      expect(parseAmount('')).toBe(0);
      expect(parseAmount(null)).toBe(0);
      expect(parseAmount(undefined)).toBe(0);
    });
  });

  describe('calculateDueDate', () => {
    const startDateStr = '2023-10-15';

    it('calculates weekly frequency', () => {
      expect(calculateDueDate(startDateStr, 0, 'weekly')).toBe('2023-10-15');
      expect(calculateDueDate(startDateStr, 1, 'weekly')).toBe('2023-10-22');
      expect(calculateDueDate(startDateStr, 2, 'weekly')).toBe('2023-10-29');
    });

    it('calculates bi-weekly frequency', () => {
      expect(calculateDueDate(startDateStr, 0, 'bi-weekly')).toBe('2023-10-15');
      expect(calculateDueDate(startDateStr, 1, 'bi-weekly')).toBe('2023-10-29');
      expect(calculateDueDate(startDateStr, 2, 'bi-weekly')).toBe('2023-11-12');
    });

    it('calculates monthly frequency', () => {
      expect(calculateDueDate(startDateStr, 0, 'monthly')).toBe('2023-10-15');
      expect(calculateDueDate(startDateStr, 1, 'monthly')).toBe('2023-11-15');
      expect(calculateDueDate(startDateStr, 2, 'monthly')).toBe('2023-12-15');
    });

    it('defaults to monthly if frequency is unknown', () => {
      expect(calculateDueDate(startDateStr, 1, 'unknown')).toBe('2023-11-15');
    });
  });

  describe('generateSchedule', () => {
    it('throws error for missing parameters', () => {
      expect(() => generateSchedule({})).toThrow('Missing required parameters for schedule generation');
      expect(() => generateSchedule({ totalAmount: 100 })).toThrow();
      expect(() => generateSchedule({ totalAmount: 100, startDate: '2023-10-15' })).toThrow();
      expect(() => generateSchedule({ totalAmount: 100, startDate: '2023-10-15', installmentCount: 2 })).toThrow();
    });

    it('generates schedule correctly', () => {
      const schedule = generateSchedule({
        totalAmount: 100,
        startDate: '2023-10-15',
        installmentCount: 3,
        frequency: 'monthly'
      });

      expect(schedule).toHaveLength(3);

      // 100 / 3 = 33.33...
      // baseAmount = 33.33
      // remainder = 100 - (33.33 * 3) = 100 - 99.99 = 0.01

      expect(schedule[0]).toEqual({
        number: 1,
        dueDate: '2023-10-15',
        amount: 33.33,
        isEditable: true
      });

      expect(schedule[1]).toEqual({
        number: 2,
        dueDate: '2023-11-15',
        amount: 33.33,
        isEditable: true
      });

      // Last installment gets the remainder
      expect(schedule[2]).toEqual({
        number: 3,
        dueDate: '2023-12-15',
        amount: 33.34,
        isEditable: true
      });
    });

    it('handles string amount', () => {
      const schedule = generateSchedule({
        totalAmount: '100',
        startDate: '2023-10-15',
        installmentCount: 3,
        frequency: 'monthly'
      });
      expect(schedule[0].amount).toBe(33.33);
    });
  });

  describe('rebalanceSchedule', () => {
    const mockSchedule = [
      { number: 1, amount: 33.33 },
      { number: 2, amount: 33.33 },
      { number: 3, amount: 33.34 }
    ];

    it('returns new schedule directly if count is 1 (otherInstallmentsCount is 0)', () => {
      const result = rebalanceSchedule([{ number: 1, amount: 100 }], 0, 50, 100);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50);
    });

    it('handles reducing an installment', () => {
      // Edit index 0 to 10
      // target total = 100
      // remainingTotal = 100 - 10 = 90
      // otherInstallmentsCount = 2
      // baseAmount = 90 / 2 = 45.00
      // remainder = 0
      const result = rebalanceSchedule(mockSchedule, 0, 10, 100);

      expect(result[0].amount).toBe(10);
      expect(result[1].amount).toBe(45);
      expect(result[2].amount).toBe(45);
    });

    it('handles increasing an installment (negative remaining)', () => {
      // target total = 100
      // edit index 0 to 110
      // remainingTotal = 100 - 110 = -10
      // excessAmount = 10
      // otherInstallmentsCount = 2
      // reductionPerInstallment = 5
      const result = rebalanceSchedule(mockSchedule, 0, 110, 100);

      expect(result[0].amount).toBe(110);
      // original was 33.33, reduces by 5 -> 28.33
      expect(result[1].amount).toBe(28.33);
      // original was 33.34, reduces by 5 -> 28.34
      expect(result[2]).toMatchObject({ amount: 28.34 });
    });

    it('distributes remainder correctly when remaining is positive', () => {
      // target total = 100
      // edit index 0 to 10.01
      // remainingTotal = 100 - 10.01 = 89.99
      // otherInstallmentsCount = 2
      // baseAmount = 89.99 / 2 = 44.99 (floor)
      // remainder = 89.99 - (44.99 * 2) = 89.99 - 89.98 = 0.01
      const result = rebalanceSchedule(mockSchedule, 0, 10.01, 100);

      expect(result[0].amount).toBe(10.01);
      // gets base + remainder (0.01)
      expect(result[1].amount).toBe(45.00);
      // gets base
      expect(result[2].amount).toBe(44.99);
    });
  });

  describe('rebalanceAfterDeletion', () => {
    it('returns empty array if no remaining amounts', () => {
      expect(rebalanceAfterDeletion([], 100)).toEqual([]);
    });

    it('returns parsed amounts if no amount to distribute', () => {
      const result = rebalanceAfterDeletion([50, 50], 100);
      expect(result).toEqual([50, 50]);
    });

    it('adds to remaining amounts if amount to distribute is positive', () => {
      // [50, 20] -> sum = 70. Target = 100. To distribute = 30
      // count = 2. baseAddition = 15. remainder = 0
      const result = rebalanceAfterDeletion([50, 20], 100);
      expect(result).toEqual([65, 35]); // 50+15, 20+15
    });

    it('adds to remaining amounts with remainder (positive)', () => {
      // [50, 20] -> sum = 70. Target = 100.01. To distribute = 30.01
      // count = 2. baseAddition = 15.00. remainderCents = 1
      const result = rebalanceAfterDeletion([50, 20], 100.01);
      expect(result).toEqual([65.01, 35]);
    });

    it('subtracts from remaining amounts if amount to distribute is negative', () => {
      // [60, 60] -> sum = 120. Target = 100. To distribute = -20
      // count = 2. baseAddition = -10. remainder = 0
      const result = rebalanceAfterDeletion([60, 60], 100);
      expect(result).toEqual([50, 50]); // 60-10, 60-10
    });

    it('subtracts from remaining amounts with remainder (negative)', () => {
       // [60, 60] -> sum = 120. Target = 99.99. To distribute = -20.01
       // count = 2. baseAddition = -10.01 (floor of -20.01/2 is -10.01)
       const result = rebalanceAfterDeletion([60, 60], 99.99);

       // The sum must equal 99.99
       expect(result[0] + result[1]).toBeCloseTo(99.99, 2);
    });
  });
});
