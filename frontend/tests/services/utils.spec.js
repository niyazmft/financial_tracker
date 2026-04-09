import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  createDateUTC,
  formatDateForInput,
  formatDateDisplay,
  formatDateRange,
  getDateRangeForType,
  calculateMonthsDifference,
  capitalizeWords,
  formatCategoryName,
  proxyImageUrl,
  debounce,
  validateDateRange,
  getCssVariableValue,
  generateCsvTemplate,
  downloadFile
} from '../../src/services/utils';

describe('utils.js', () => {
  describe('formatCurrency', () => {
    it('formats positive amounts correctly in TRY', () => {
      expect(formatCurrency(1234)).toBe('₺1.234');
    });

    it('formats negative amounts correctly in TRY', () => {
      expect(formatCurrency(-1234)).toBe('-₺1.234');
    });

    it('formats correctly in USD', () => {
      expect(formatCurrency(1234, 'USD')).toBe('$1.234');
    });

    it('uses K format when specified and amount >= 1000', () => {
      expect(formatCurrency(1500, 'TRY', true)).toBe('₺1.5K');
    });

    it('does not use K format if amount < 1000', () => {
      expect(formatCurrency(999, 'TRY', true)).toBe('₺999');
    });
  });

  describe('formatPercentage', () => {
    it('formats positive percentage with sign', () => {
      expect(formatPercentage(12.34)).toBe('+12.3%');
    });

    it('formats negative percentage with sign', () => {
      expect(formatPercentage(-12.34)).toBe('-12.3%');
    });

    it('formats percentage without sign', () => {
      expect(formatPercentage(12.34, false)).toBe('12.3%');
    });
  });

  describe('createDateUTC', () => {
    it('creates a UTC date correctly', () => {
      const date = createDateUTC(2023, 0, 1, 10);
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
      expect(date.getUTCHours()).toBe(10);
    });
  });

  describe('formatDateForInput', () => {
    it('formats Date object to YYYY-MM-DD', () => {
      const date = new Date('2023-10-15T10:00:00Z');
      expect(formatDateForInput(date)).toBe('2023-10-15');
    });

    it('formats ISO string to YYYY-MM-DD', () => {
      expect(formatDateForInput('2023-10-15T10:00:00Z')).toBe('2023-10-15');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
    });
  });

  describe('formatDateDisplay', () => {
    it('formats date string correctly', () => {
      const formatted = formatDateDisplay('2023-10-15T00:00:00Z');
      // Format will depend on the en-US locale
      expect(formatted).toMatch(/Oct 14|Oct 15/);
    });
  });

  describe('formatDateRange', () => {
    it('formats a date range correctly', () => {
      const start = '2023-10-01T00:00:00Z';
      const end = '2023-10-15T00:00:00Z';
      const formatted = formatDateRange(start, end);
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('2023');
      expect(formatted).toContain('-');
    });
  });

  describe('getDateRangeForType', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-10-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('returns correct range for ytd', () => {
      const range = getDateRangeForType('ytd');
      expect(range.startDate).toBe('2023-01-01');
      expect(range.endDate).toBe('2023-10-15');
    });

    it('returns correct range for last-year', () => {
      const range = getDateRangeForType('last-year');
      expect(range.startDate).toBe('2022-01-01');
      expect(range.endDate).toBe('2022-12-31');
    });

    it('returns correct range for last-6m', () => {
      const range = getDateRangeForType('last-6m');
      expect(range.startDate).toBe('2023-04-01');
      expect(range.endDate).toBe('2023-10-15');
    });

    it('returns correct range for last-3m', () => {
      const range = getDateRangeForType('last-3m');
      expect(range.startDate).toBe('2023-07-01');
      expect(range.endDate).toBe('2023-10-15');
    });

    it('returns correct range for this-year', () => {
      const range = getDateRangeForType('this-year');
      expect(range.startDate).toBe('2023-01-01');
      expect(range.endDate).toBe('2023-12-31');
    });

    it('returns null for unknown type', () => {
      expect(getDateRangeForType('unknown')).toBeNull();
    });
  });

  describe('calculateMonthsDifference', () => {
    it('calculates difference correctly', () => {
      expect(calculateMonthsDifference('2023-01-15', '2023-03-15')).toBe(3);
    });

    it('returns at least 1 month', () => {
      expect(calculateMonthsDifference('2023-01-15', '2023-01-20')).toBe(1);
    });

    it('handles invalid dates by returning 1', () => {
      expect(calculateMonthsDifference('invalid', 'dates')).toBe(1);
    });
  });

  describe('capitalizeWords', () => {
    it('capitalizes each word correctly', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });

    it('handles Turkish characters correctly', () => {
      expect(capitalizeWords('EĞLENCE')).toBe('Eğlence');
    });

    it('returns input if not a string', () => {
      expect(capitalizeWords(null)).toBeNull();
      expect(capitalizeWords(123)).toBe(123);
    });
  });

  describe('formatCategoryName', () => {
    it('capitalizes category names', () => {
      expect(formatCategoryName('home office')).toBe('Home Office');
    });
  });

  describe('proxyImageUrl', () => {
    it('returns original url for data URI', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
      expect(proxyImageUrl(dataUri)).toBe(dataUri);
    });

    it('proxies http urls', () => {
      const url = 'http://example.com/image.png';
      expect(proxyImageUrl(url)).toBe(`/api/proxy/image?url=${encodeURIComponent(url)}`);
    });

    it('proxies https urls', () => {
      const url = 'https://example.com/image.png';
      expect(proxyImageUrl(url)).toBe(`/api/proxy/image?url=${encodeURIComponent(url)}`);
    });

    it('returns original for non-string or falsy', () => {
      expect(proxyImageUrl(null)).toBeNull();
      expect(proxyImageUrl('/local/image.png')).toBe('/local/image.png');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces function calls', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      debounced();
      debounced();

      expect(func).not.toBeCalled();

      vi.advanceTimersByTime(50);
      expect(func).not.toBeCalled();

      vi.advanceTimersByTime(50);
      expect(func).toBeCalledTimes(1);
    });
  });

  describe('validateDateRange', () => {
    it('returns invalid if missing dates', () => {
      expect(validateDateRange(null, '2023-10-15')).toEqual({ valid: false, message: 'Please select both start and end dates' });
    });

    it('returns invalid if start date > end date', () => {
      expect(validateDateRange('2023-10-20', '2023-10-15')).toEqual({ valid: false, message: 'Start date must be before end date' });
    });

    it('returns valid for correct range', () => {
      expect(validateDateRange('2023-10-01', '2023-10-15')).toEqual({ valid: true });
    });
  });

  describe('getCssVariableValue', () => {
    it('returns mocked css variable value', () => {
      // Mock getComputedStyle
    it('returns mocked css variable value', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(' #ff0000 ')
      });

      expect(getCssVariableValue('--primary-color')).toBe('#ff0000');
    });
    });
  });

  describe('generateCsvTemplate', () => {
    it('generates csv template with headers only', () => {
      expect(generateCsvTemplate(['Name', 'Age'])).toBe('Name,Age');
    });

    it('generates csv template with headers and example row', () => {
      expect(generateCsvTemplate(['Name', 'Age'], ['John', '30'])).toBe('Name,Age\nJohn,30');
    });
  });

  describe('downloadFile', () => {
    it('creates object url and clicks link', () => {
      // Mock URL methods
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      // Mock DOM elements
      const linkClickMock = vi.fn();
      const linkSetAttributeMock = vi.fn();
      const mockLink = {
        href: '',
        setAttribute: linkSetAttributeMock,
        click: linkClickMock
      };

      const originalCreateElement = document.createElement;
      const createElementMock = vi.fn().mockReturnValue(mockLink);
      document.createElement = createElementMock;

      const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      downloadFile('content', 'test.csv');

      expect(createObjectURLMock).toBeCalled();
      expect(createElementMock).toBeCalledWith('a');
      expect(linkSetAttributeMock).toBeCalledWith('download', 'test.csv');
      expect(appendChildMock).toBeCalled();
      expect(linkClickMock).toBeCalled();
      expect(removeChildMock).toBeCalled();
      expect(revokeObjectURLMock).toBeCalled();

      // Restore
      document.createElement = originalCreateElement;
      appendChildMock.mockRestore();
      removeChildMock.mockRestore();
    });
  });
});
