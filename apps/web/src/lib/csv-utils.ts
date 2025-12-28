import Papa from 'papaparse'

export interface CSVUserRow {
  firstName: string
  lastName: string
  email: string
  hometown?: string
  dateOfBirth?: string
  referredByEmail?: string
  mobilePhone?: string
}

export interface ParsedCSVResult {
  valid: CSVUserRow[]
  errors: { row: number; data: any; error: string }[]
}

/**
 * Parse and validate CSV file
 */
export function parseUsersCSV(csvText: string): ParsedCSVResult {
  const result: ParsedCSVResult = {
    valid: [],
    errors: [],
  }

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  parsed.data.forEach((row: any, index) => {
    const rowNumber = index + 2 // Account for header row + 0-index

    // Validate required fields
    if (!row.firstName || !row.firstName.trim()) {
      result.errors.push({
        row: rowNumber,
        data: row,
        error: 'firstName is required',
      })
      return
    }

    if (!row.lastName || !row.lastName.trim()) {
      result.errors.push({
        row: rowNumber,
        data: row,
        error: 'lastName is required',
      })
      return
    }

    if (!row.email || !row.email.trim()) {
      result.errors.push({
        row: rowNumber,
        data: row,
        error: 'email is required',
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(row.email.trim())) {
      result.errors.push({
        row: rowNumber,
        data: row,
        error: 'Invalid email format',
      })
      return
    }

    // Validate dateOfBirth if provided
    if (row.dateOfBirth && row.dateOfBirth.trim()) {
      const date = new Date(row.dateOfBirth.trim())
      if (isNaN(date.getTime())) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: 'Invalid date format for dateOfBirth (use YYYY-MM-DD)',
        })
        return
      }
    }

    // Add valid row
    result.valid.push({
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      email: row.email.trim().toLowerCase(),
      hometown: row.hometown?.trim() || undefined,
      dateOfBirth: row.dateOfBirth?.trim() || undefined,
      referredByEmail: row.referredByEmail?.trim().toLowerCase() || undefined,
      mobilePhone: row.mobilePhone?.trim() || undefined,
    })
  })

  return result
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'hometown',
    'dateOfBirth',
    'referredByEmail',
    'mobilePhone',
  ]
  const exampleRow = [
    'John',
    'Doe',
    'john.doe@example.com',
    'Austin, TX',
    '1990-01-15',
    'referrer@example.com',
    '+1-555-123-4567',
  ]

  return Papa.unparse({
    fields: headers,
    data: [exampleRow],
  })
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate() {
  const csv = generateCSVTemplate()
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'user-import-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
