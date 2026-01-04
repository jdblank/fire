'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-red-600 mb-2">3D View Unavailable</div>
              <div className="text-sm text-gray-500">
                {this.state.error?.message || 'An error occurred loading the 3D visualization'}
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
