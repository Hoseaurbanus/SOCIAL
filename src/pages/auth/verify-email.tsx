import { Link } from 'react-router'
import { Mail } from 'lucide-react'
import { Button } from '@/components/atoms/button'

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-accent-light flex items-center justify-center">
          <Mail className="h-8 w-8 text-accent" />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-text-secondary mt-2">We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.</p>
      </div>
      <Button variant="secondary" fullWidth>Resend Email</Button>
      <p className="text-sm text-text-secondary">
        <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Back to Sign In</Link>
      </p>
    </div>
  )
}
