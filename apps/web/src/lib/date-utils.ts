/**
 * Date Formatting Utilities
 * Consistent international date formatting across the app
 */

/**
 * Format date in international style: "Sunday 30 August 2026"
 */
export function formatDateInternational(date: Date | string, timezone?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timezone && { timeZone: timezone }),
  })
}

/**
 * Format date short: "30 Aug 2026"
 */
export function formatDateShort(date: Date | string, timezone?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(timezone && { timeZone: timezone }),
  })
}

/**
 * Format date with time: "Sunday 30 August 2026 at 14:30"
 */
export function formatDateTimeInternational(date: Date | string, timezone?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const dateStr = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timezone && { timeZone: timezone }),
  })

  const timeStr = dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(timezone && { timeZone: timezone }),
  })

  return `${dateStr} at ${timeStr}`
}

/**
 * Format time only: "14:30"
 */
export function formatTime(date: Date | string, timezone?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(timezone && { timeZone: timezone }),
  })
}
