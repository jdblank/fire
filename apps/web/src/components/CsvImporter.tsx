'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CsvImporterProps {
  title: string
  description: string
  onDownloadTemplate: () => void
  onImport: (file: File) => Promise<any>
  backPath: string
  backLabel: string
  viewResultsLabel: string
  viewResultsPath: string
  entityName: string
}

export function CsvImporter({
  title,
  description,
  onDownloadTemplate,
  onImport,
  backPath,
  backLabel,
  viewResultsLabel,
  viewResultsPath,
  entityName,
}: CsvImporterProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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
      const data = await onImport(file)
      setResult(data)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => router.push(backPath)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← {backLabel}
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        {/* Step 1: Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Step 1: Download Template</h3>
          <p className="text-sm text-blue-800 mb-3">
            Start with our CSV template to ensure correct formatting
          </p>
          <button
            onClick={onDownloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Download CSV Template
          </button>
        </div>

        {/* Step 2: File Upload */}
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
            {uploading ? 'Importing...' : `Import ${entityName}`}
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
            {result.summary && (
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
            )}

            {/* If simple success response */}
            {result.success && result.count !== undefined && (
              <div className="bg-white p-4 rounded border border-green-300">
                <p className="text-green-800 font-medium">
                  Successfully imported {result.count} {entityName.toLowerCase()}.
                </p>
              </div>
            )}

            {/* Created Entities */}
            {result.results?.created?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Created {entityName}:</h4>
                <div className="bg-white rounded border border-green-300 max-h-60 overflow-y-auto">
                  {result.results.created.map((item: any, i: number) => (
                    <div key={i} className="px-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-900">
                        {item.name || item.title || item.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped */}
            {result.results?.skipped?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Skipped:</h4>
                <div className="bg-white rounded border border-yellow-300 max-h-40 overflow-y-auto">
                  {result.results.skipped.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="px-3 py-2 border-b border-gray-100 last:border-0 text-sm"
                    >
                      <span className="text-gray-900">{item.email || item.title}</span>
                      <span className="text-yellow-700 ml-2">- {item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.results?.errors?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="bg-white rounded border border-red-300 max-h-40 overflow-y-auto">
                  {result.results.errors.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="px-3 py-2 border-b border-gray-100 last:border-0 text-sm"
                    >
                      <span className="text-gray-900">{item.email || item.title}</span>
                      <span className="text-red-700 ml-2">- {item.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => router.push(viewResultsPath)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {viewResultsLabel}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
