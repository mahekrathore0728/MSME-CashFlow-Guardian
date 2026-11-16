/**
 * Format number in Indian Rupee format (e.g. ₹ 1,23,456.78)
 * Using standard Indian numbering format (Lakhs and Crores).
 */
export function formatINR(amount, options = {}) {
  const { showSymbol = true, decimalPlaces = 2 } = options;
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹ 0.00' : '0.00';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Format with Intl.NumberFormat in en-IN
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(absNum);

  const sign = isNegative ? '-' : '';
  const prefix = showSymbol ? '₹ ' : '';

  return `${sign}${prefix}${formatted}`;
}

/**
 * Format compact Indian amount (e.g. ₹ 4.5L, ₹ 1.2Cr)
 */
export function formatINRCompact(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹ 0';
  }
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const sign = isNegative ? '-' : '';

  if (absNum >= 10000000) {
    return `${sign}₹ ${(absNum / 10000000).toFixed(2)} Cr`;
  }
  if (absNum >= 100000) {
    return `${sign}₹ ${(absNum / 100000).toFixed(2)} L`;
  }
  if (absNum >= 1000) {
    return `${sign}₹ ${(absNum / 1000).toFixed(1)} k`;
  }
  return `${sign}₹ ${absNum.toFixed(0)}`;
}
