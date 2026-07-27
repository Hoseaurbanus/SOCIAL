import { Link } from 'react-router'
import { Button } from '@/components/atoms/button'

export default function WelcomePage() {
  return (
    <div className="text-center space-y-8">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-2xl font-bold text-text-inverse">S</span>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">SMUGFLEX</h1>
        <p className="text-text-secondary">Where communities thrive and ideas connect</p>
      </div>
      <div className="space-y-4">
        <Link to="/signup"><Button fullWidth size="lg">Create Account</Button></Link>
        <Link to="/login"><Button variant="secondary" fullWidth size="lg">Sign In</Button></Link>
      </div>
      <p className="text-xs text-text-tertiary">
        By continuing, you agree to our <a href="#" className="text-accent">Terms of Service</a> and <a href="#" className="text-accent">Privacy Policy</a>
      </p>
    </div>
  )
}
