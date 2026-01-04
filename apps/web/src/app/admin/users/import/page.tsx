'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import { CsvImporter } from '@/components/CsvImporter'
import { downloadCSVTemplate } from '@/lib/csv-utils'
import { hasRole } from '@/lib/utils'

export default function ImportUsersPage() {
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
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/users/import', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Import failed')
    }

    return data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session?.user} />
      <CsvImporter
        title="Import Users from CSV"
        description="Bulk import users and automatically generate invite tokens"
        entityName="Users"
        backLabel="Back to Users"
        backPath="/admin/users"
        viewResultsLabel="View All Users"
        viewResultsPath="/admin/users"
        onDownloadTemplate={downloadCSVTemplate}
        onImport={handleImport}
      />
    </div>
  )
}
