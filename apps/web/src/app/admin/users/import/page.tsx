'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { downloadCSVTemplate } from '@/lib/csv-utils'
import Link from 'next/link'

export default function ImportUsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={session?.user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            Admin access required
          </div>
        </div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setFile(null)
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Import Users from CSV
          </h1>
          <p className="text-gray-600">
            Bulk import users and automatically generate invite tokens
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Step 1: Download Template</h3>
            <p className="text-sm text-blue-800 mb-3">
              Start with our CSV template to ensure correct formatting
            </p>
            <button
              onClick={downloadCSVTemplate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Download CSV Template
            </button>
          </div>

          {/* File Upload */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Step 2: Upload CSV File</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-gray-100 file:text-gray-700
                hover:file:bg-gray-200
                file:cursor-pointer cursor-pointer"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Import Button */}
          <div>
            <button
              onClick={handleImport}
              disabled={!file || uploading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? 'Importing...' : 'Import Users'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-green-900">Import Complete!</h3>
              
              {/* Summary */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded border border-green-300">
                  <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                  <div className="text-xs text-gray-600">Total Rows</div>
                </div>
                <div className="bg-white p-3 rounded border border-green-300">
                  <div className="text-2xl font-bold text-green-600">{result.summary.created}</div>
                  <div className="text-xs text-gray-600">Created</div>
                </div>
                <div className="bg-white p-3 rounded border border-yellow-300">
                  <div className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</div>
                  <div className="text-xs text-gray-600">Skipped</div>
                </div>
                <div className="bg-white p-3 rounded border border-red-300">
                  <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>

              {/* Created Users */}
              {result.results.created.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Created Users:</h4>
                  <div className="bg-white rounded border border-green-300 max-h-60 overflow-y-auto">
                    {result.results.created.map((user: any, i: number) => (
                      <div key={i} className="px-3 py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-900">{user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped */}
              {result.results.skipped.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skipped:</h4>
                  <div className="bg-white rounded border border-yellow-300 max-h-40 overflow-y-auto">
                    {result.results.skipped.map((item: any, i: number) => (
                      <div key={i} className="px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-gray-900">{item.email}</span>
                        <span className="text-yellow-700 ml-2">- {item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                  <div className="bg-white rounded border border-red-300 max-h-40 overflow-y-auto">
                    {result.results.errors.map((item: any, i: number) => (
                      <div key={i} className="px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-gray-900">{item.email}</span>
                        <span className="text-red-700 ml-2">- {item.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parse Errors */}
              {result.parseErrors && result.parseErrors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">CSV Format Errors:</h4>
                  <div className="bg-white rounded border border-red-300 max-h-40 overflow-y-auto">
                    {result.parseErrors.map((item: any, i: number) => (
                      <div key={i} className="px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-red-700">Row {item.row}: {item.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => router.push('/admin/users')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Users
              </button>
            </div>
          )}

          {/* Instructions */}
          {!result && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">CSV Format:</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p className="text-gray-700"><strong>Required columns:</strong></p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>firstName</li>
                  <li>lastName</li>
                  <li>email</li>
                </ul>
                <p className="text-gray-700 mt-3"><strong>Optional columns:</strong></p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>hometown</li>
                  <li>dateOfBirth (format: YYYY-MM-DD)</li>
                  <li>referredByEmail (must match existing user email)</li>
                  <li>mobilePhone</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


