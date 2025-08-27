/**
 * Currency utility functions for EGP formatting
 */

export const CURRENCY_CODE = "EGP";
export const CURRENCY_SYMBOL = "EGP";

/**
 * Format a number as EGP currency
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  decimals: number = 2
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY_SYMBOL} 0.00`;
  }

  return `${CURRENCY_SYMBOL} ${amount.toFixed(decimals)}`;
};

/**
 * Format a number as EGP currency with thousands separator
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with thousands separator
 */
export const formatCurrencyWithSeparator = (
  amount: number,
  decimals: number = 2
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY_SYMBOL} 0.00`;
  }

  const formattedNumber = new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${CURRENCY_SYMBOL} ${formattedNumber}`;
};

/**
 * Parse a currency string back to a number
 * @param currencyString - The currency string to parse
 * @returns The parsed number or 0 if invalid
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;

  // Remove currency symbol and spaces, then parse
  const cleanString = currencyString.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleanString);

  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get currency display options for different contexts
 */
export const getCurrencyDisplayOptions = () => ({
  code: CURRENCY_CODE,
  symbol: CURRENCY_SYMBOL,
  name: "Egyptian Pound",
  locale: "en-EG",
});
