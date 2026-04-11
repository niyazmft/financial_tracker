import { describe, it, expect } from 'vitest';
import { processUpcomingPayments, processAllPlans } from '../../src/services/installmentProcessor';

describe('installmentProcessor', () => {
  const mockInstallments = [
    {
      id: 1,
      paid: false,
      start_date: '2023-10-15T00:00:00Z',
      installment_payment: 100,
      items: { item_name: 'Laptop' },
      categories: { category_name: 'Electronics' },
      items_id: 10,
      categories_id: 20
    },
    {
      id: 2,
      paid: true,
      start_date: '2023-09-15T00:00:00Z',
      installment_payment: 100,
      items: [{ item_name: 'Laptop' }],
      categories: [{ category_name: 'Electronics' }],
      items_id: 10,
      categories_id: 20
    },
    {
      id: 3,
      paid: false,
      start_date: '2023-11-15T00:00:00Z',
      installment_payment: 50,
      items: null,
      categories: null,
      items_id: null,
      categories_id: null
    },
    {
      id: 4,
      paid: false,
      start_date: '2023-10-20T00:00:00Z',
      installment_payment: 200,
      items: { },
      categories: { }
    }
  ];

  describe('processUpcomingPayments', () => {
    it('filters out paid installments and groups by month/year', () => {
      const result = processUpcomingPayments(mockInstallments);

      // Should have 2 groups: Oct 2023, Nov 2023
      expect(result).toHaveLength(2);

      // Oct 2023 group
      expect(result[0].year).toBe(2023);
      expect(result[0].month).toBe(10);
      expect(result[0].installments).toHaveLength(2); // Should have IDs 1 and 4

      // Nov 2023 group
      expect(result[1].year).toBe(2023);
      expect(result[1].month).toBe(11);
      expect(result[1].installments).toHaveLength(1); // ID 3
    });

    it('correctly extracts item and category names with different structures', () => {
      const result = processUpcomingPayments(mockInstallments);

      const octInstallments = result[0].installments;

      // Object format
      const laptopInst = octInstallments.find(i => i.id === 1);
      expect(laptopInst.planName).toBe('Laptop');
      expect(laptopInst.categoryName).toBe('Electronics');

      // Null format (fallback to unknown)
      const novInstallments = result[1].installments;
      const unknownInst = novInstallments.find(i => i.id === 3);
      expect(unknownInst.planName).toBe('Unknown Plan');
      expect(unknownInst.categoryName).toBe('Uncategorized');

      // Empty object format (fallback to unknown)
      const emptyInst = octInstallments.find(i => i.id === 4);
      expect(emptyInst.planName).toBe('Unknown Plan');
      expect(emptyInst.categoryName).toBe('Uncategorized');
    });

    it('sorts groups by year and then by month', () => {
      const mockUnsorted = [
        { paid: false, start_date: '2024-01-15T00:00:00Z', installment_payment: 100 },
        { paid: false, start_date: '2023-12-15T00:00:00Z', installment_payment: 100 },
        { paid: false, start_date: '2023-10-15T00:00:00Z', installment_payment: 100 },
        { paid: false, start_date: '2024-03-15T00:00:00Z', installment_payment: 100 }
      ];
      const result = processUpcomingPayments(mockUnsorted);

      expect(result).toHaveLength(4);
      expect(result[0].year).toBe(2023);
      expect(result[0].month).toBe(10);

      expect(result[1].year).toBe(2023);
      expect(result[1].month).toBe(12);

      expect(result[2].year).toBe(2024);
      expect(result[2].month).toBe(1);

      expect(result[3].year).toBe(2024);
      expect(result[3].month).toBe(3);
    });

    it('handles arrays with missing name properties', () => {
      const mockWithMissingNames = [
        {
          id: 99,
          paid: false,
          start_date: '2023-12-15T00:00:00Z',
          installment_payment: 100,
          items: [{}], // missing item_name
          categories: [{}] // missing category_name
        }
      ];

      const result = processUpcomingPayments(mockWithMissingNames);
      expect(result).toHaveLength(1);
      expect(result[0].installments[0].planName).toBe('Unknown Plan');
      expect(result[0].installments[0].categoryName).toBe('Uncategorized');
    });

    it('handles null/undefined installment payments correctly', () => {
      const mockWithMissingPayments = [
        {
          id: 100,
          paid: false,
          start_date: '2023-12-15T00:00:00Z',
          items: { item_name: 'Test' },
          // missing installment_payment entirely
        }
      ];

      const resultUpcoming = processUpcomingPayments(mockWithMissingPayments);
      expect(resultUpcoming[0].installments[0].amount).toBeUndefined();
    });

    it('handles empty installments array', () => {
      const result = processUpcomingPayments([]);
      expect(result).toEqual([]);
    });
  });

  describe('processAllPlans', () => {
    it('groups by plan name and calculates totals correctly', () => {
      const result = processAllPlans(mockInstallments);

      // Should have 2 plan groups: "Laptop" and "Unknown Plan"
      expect(result).toHaveLength(2);

      // Laptop plan (IDs 1 and 2)
      // Note: sort is descending by totalAmount
      // Laptop: 100 + 100 = 200 total, 100 paid -> progress 50%
      // Unknown Plan: 50 + 200 = 250 total, 0 paid -> progress 0%

      const unknownPlan = result[0]; // 250 total
      expect(unknownPlan.planName).toBe('Unknown Plan');
      expect(unknownPlan.totalAmount).toBe(250);
      expect(unknownPlan.amountPaid).toBe(0);
      expect(unknownPlan.progress).toBe(0);
      expect(unknownPlan.installmentCount).toBe(2);

      const laptopPlan = result[1]; // 200 total
      expect(laptopPlan).toMatchObject({
        planName: 'Laptop',
        totalAmount: 200,
        amountPaid: 100,
        progress: 50,
        installmentCount: 2,
        categoryId: 20,
        itemId: 10
      });
    });

    it('handles empty items/categories arrays in plan details', () => {
      const arrayMock = [
        {
          id: 5,
          paid: false,
          installment_payment: 50,
          items: [],
          categories: []
        }
      ];
      const result = processAllPlans(arrayMock);
      expect(result).toHaveLength(1);
      expect(result[0].planName).toBe('Unknown Plan');
      expect(result[0].categoryName).toBe('Uncategorized');
    });

    it('handles totalAmount 0 gracefully (0 progress)', () => {
      const zeroMock = [
        {
          id: 6,
          paid: true,
          installment_payment: 0,
          items: { item_name: 'Freebie' }
        }
      ];
      const result = processAllPlans(zeroMock);
      expect(result[0].totalAmount).toBe(0);
      expect(result[0].progress).toBe(0);
    });

    it('handles null/undefined installment payments correctly', () => {
      const mockWithMissingPayments = [
        {
          id: 100,
          paid: false,
          start_date: '2023-12-15T00:00:00Z',
          items: { item_name: 'Test' },
          // missing installment_payment entirely
        },
        {
          id: 101,
          paid: true,
          start_date: '2023-12-15T00:00:00Z',
          items: { item_name: 'Test' },
          // missing installment_payment entirely
        }
      ];

      const resultAll = processAllPlans(mockWithMissingPayments);
      expect(resultAll[0].totalAmount).toBe(0);
      expect(resultAll[0].amountPaid).toBe(0);
    });

    it('handles empty array', () => {
      expect(processAllPlans([])).toEqual([]);
    });
  });
});
