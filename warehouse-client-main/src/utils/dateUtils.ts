/**
 * Format date utilities
 */

/**
 * Format date to Vietnamese locale string
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date to Vietnamese locale date only (no time)
 */
export function formatDateOnly(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString("vi-VN");
}

/**
 * Check if date is in current month
 */
export function isInCurrentMonth(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

/**
 * Get last N days dates
 */
export function getLastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (n - 1 - i));
    return date.toISOString().split("T")[0];
  });
}

/**
 * Check if date string matches a specific date
 */
export function isDateMatch(dateString: string | undefined, targetDate: string): boolean {
  if (!dateString) return false;
  return dateString.split("T")[0] === targetDate;
}
