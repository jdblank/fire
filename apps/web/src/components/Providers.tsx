'use client'

import { SessionProvider } from 'next-auth/react'
import { LoadScript } from '@react-google-maps/api'

const libraries: 'places'[] = ['places']

export function Providers({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  return (
    <SessionProvider>
      {apiKey ? (
        <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
          {children}
        </LoadScript>
      ) : (
        children
      )}
    </SessionProvider>
  )
}
