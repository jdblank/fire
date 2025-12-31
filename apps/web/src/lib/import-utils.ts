import { CsvEventImport } from '@fire/types'

/**
 * Parses a single row from a CSV import and prepares it for the database.
 * 
 * Rule 1: If startDate is "Date Only" (YYYY-MM-DD, length 10), 
 * set isAllDay: true and normalize time to midnight.
 * 
 * Rule 2: If it has a time component (e.g., ISO string or YYYY-MM-DD HH:mm),
 * set isAllDay: false.
 */
export function parseEventImportRow(row: CsvEventImport) {
  const { startDate, endDate, ...rest } = row
  
  const isDateOnly = startDate.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(startDate)
  
  let normalizedStartDate: string
  let isAllDay: boolean

  if (isDateOnly) {
    // Rule 1: Date only
    normalizedStartDate = new Date(`${startDate}T00:00:00Z`).toISOString()
    isAllDay = true
  } else {
    // Rule 2: Has time component
    normalizedStartDate = new Date(startDate).toISOString()
    isAllDay = false
  }

  let normalizedEndDate: string | undefined = undefined
  if (endDate) {
    normalizedEndDate = new Date(endDate).toISOString()
  }

  return {
    ...rest,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    isAllDay,
  }
}
