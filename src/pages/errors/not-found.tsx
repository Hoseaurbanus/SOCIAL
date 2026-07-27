import { Link } from 'react-router'
import { Button } from '@/components/atoms/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-accent">404</div>
        <h1 className="text-2xl font-bold text-text-primary">Page Not Found</h1>
        <p className="text-text-secondary">The page you are looking for does not exist or has been moved.</p>
        <Link to="/home">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
