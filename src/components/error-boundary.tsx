import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/atoms/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="text-center max-w-[400px]">
            <div className="h-16 w-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-secondary mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Try again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
