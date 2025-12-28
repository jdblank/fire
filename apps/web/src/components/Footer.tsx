import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
          <Link href="/terms" className="hover:text-gray-900 transition-colors">
            Terms
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">
            Privacy Policy
          </Link>
        </div>
        <div className="text-center text-xs text-gray-500 mt-3">
          © {new Date().getFullYear()} Fire. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
