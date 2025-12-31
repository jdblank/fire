import { describe, it, expect } from 'vitest'
import { parseEventImportRow } from '../import-utils'
import { CsvEventImport } from '@fire/types'

describe('parseEventImportRow', () => {
  it('should set isAllDay to true and normalize time to midnight for YYYY-MM-DD input', () => {
    const input: CsvEventImport = {
      title: 'Test Event',
      startDate: '2025-12-25',
    }
    const result = parseEventImportRow(input)
    expect(result.isAllDay).toBe(true)
    expect(result.startDate).toBe('2025-12-25T00:00:00.000Z')
  })

  it('should set isAllDay to false for input with time component', () => {
    const input: CsvEventImport = {
      title: 'Test Event',
      startDate: '2025-12-25 14:30',
    }
    const result = parseEventImportRow(input)
    expect(result.isAllDay).toBe(false)
    expect(new Date(result.startDate).toISOString()).toBe(
      new Date('2025-12-25 14:30').toISOString()
    )
  })
})
