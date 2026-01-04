'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import { CsvImporter } from '@/components/CsvImporter'
import { downloadEventCSVTemplate } from '@/lib/csv-utils'
import { hasRole } from '@/lib/utils'
import Papa from 'papaparse'

export default function ImportEventsPage() {
  const { data: session } = useSession()

  if (!hasRole(session?.user, 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={session?.user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">Admin access required</div>
        </div>
      </div>
    )
  }

  const handleImport = async (file: File) => {
    // 1. Parse CSV locally
    const text = await file.text()
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parsed.errors.length > 0) {
      throw new Error(`CSV Parsing error: ${parsed.errors[0].message}`)
    }

    // 2. Send to API
    const response = await fetch('/api/admin/events/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsed.data),
    })

    const data = await response.json()

    if (!response.ok) {
      // If there are validation details, format them for display
      if (data.details) {
        console.error('Import validation error details:', data.details)
        const detailedError = JSON.stringify(data.details, null, 2)
        throw new Error(`${data.error}: ${detailedError}`)
      }
      throw new Error(data.error || 'Import failed')
    }

    return data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session?.user} />
      <CsvImporter
        title="Import Events from CSV"
        description="Bulk import events into the system"
        entityName="Events"
        backLabel="Back to Events"
        backPath="/admin/events"
        viewResultsLabel="View All Events"
        viewResultsPath="/admin/events"
        onDownloadTemplate={downloadEventCSVTemplate}
        onImport={handleImport}
      />
    </div>
  )
}
