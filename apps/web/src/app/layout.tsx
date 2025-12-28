import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fire - Social Community Platform',
  description: 'A modern, lightweight social community platform with event management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <Providers>
          <div className="h-full flex flex-col bg-background">
            <div className="flex-1 overflow-auto">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
