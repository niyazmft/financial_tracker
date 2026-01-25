/**
 * useFinance Composable
 * Encapsulates shared financial logic and formatting.
 */
import { formatCurrency as utilsFormatCurrency } from '../services/utils';
import { useSettingsStore } from '../stores/settings';

export function useFinance() {
  const settingsStore = useSettingsStore();

  /**
   * Formats a number as currency using project standards.
   */
  const formatCurrency = (amount, currency = null) => {
    return utilsFormatCurrency(amount, currency || settingsStore.currency, true);
  };

  /**
   * Returns the appropriate CSS class for an amount (green for positive, red for negative).
   * Handles both numbers and percentage strings.
   */
  const getAmountClass = (value) => {
    if (value === 'N/A' || value === null) return 'hidden';
    if (typeof value === 'string' && value.includes('%')) {
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      return num >= 0 ? 'text-success' : 'text-danger';
    }

    const num = parseFloat(value);
    if (isNaN(num)) return 'text-text-sub';
    
    if (num > 0) return 'text-success font-medium';
    if (num < 0) return 'text-danger font-medium';
    return 'text-text-sub font-medium';
  };

  /**
   * Returns the appropriate CSS class for expense trends (Red for positive, Green for negative).
   */
  const getExpenseTrendClass = (value) => {
    if (value === 'N/A' || value === null) return 'hidden';
    const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return '';
    if (num > 0) return 'text-danger'; // Increased spending is bad
    if (num < 0) return 'text-success'; // Decreased spending is good
    return 'text-text-sub';
  };

  /**
   * Returns the appropriate class for forecast amounts (Projected Balance).
   */
  const getForecastAmountClass = (value) => {
    const numValue = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    if (isNaN(numValue)) return '';
    return numValue < 0 ? 'text-danger' : 'text-text-main';
  };

  return {
    formatCurrency,
    getAmountClass,
    getExpenseTrendClass,
    getForecastAmountClass
  };
}