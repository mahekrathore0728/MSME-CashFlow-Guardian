/**
 * Format date in Indian standard format: DD/MM/YYYY
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateString);
  }
}

/**
 * Format relative date (e.g. "In 5 days", "3 days overdue", "Today")
 */
export function formatRelativeDays(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days overdue`;
}

/**
 * Get current ISO date YYYY-MM-DD
 */
export function getCurrentISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
