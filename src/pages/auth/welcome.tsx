import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'
import { Shield, Users, Zap, ArrowRight } from 'lucide-react'
import { SmugflexLogo } from '@/components/atoms/smugflex-logo'

const features = [
  {
    icon: Shield,
    title: 'Privacy by Default',
    description: 'Your data stays yours. No ads, no tracking, no compromises.',
  },
  {
    icon: Users,
    title: 'Meaningful Communities',
    description: 'Connect through shared interests, not algorithmic feeds.',
  },
  {
    icon: Zap,
    title: 'One Platform',
    description: 'Messaging, communities, knowledge sharing — all in one place.',
  },
]

export default function WelcomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Brand */}
      <div className="lg:w-1/2 bg-gradient-to-br from-accent via-accent-hover to-accent-dark flex flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-48 w-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-32 w-32 bg-secondary/10 rounded-full blur-2xl" />

        <div className="relative z-10 text-center lg:text-left max-w-md">
          <div className="flex justify-center lg:justify-start mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <SmugflexLogo size="lg" variant="icon" />
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            The digital ecosystem{' '}
            <span className="text-secondary">you deserve</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            A free platform built for people, not algorithms. Connect, collaborate, and share knowledge — safely.
          </p>

          <div className="hidden lg:block space-y-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 text-left">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-white/70">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - CTA */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6 lg:hidden">
              <SmugflexLogo size="md" variant="full" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Get started
            </h2>
            <p className="text-text-secondary">
              Join a platform designed for meaningful connections.
            </p>
          </div>

          <div className="space-y-4">
            <Link to="/signup">
              <Button fullWidth size="lg" className="h-14 text-base font-semibold rounded-2xl bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20">
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" fullWidth size="lg" className="h-14 text-base font-semibold rounded-2xl border-2">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent-light/50 border border-accent/10">
            <Shield className="h-5 w-5 text-accent flex-shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Your privacy is protected. We don't sell your data, show ads, or track you across the web.
            </p>
          </div>

          <p className="text-xs text-text-tertiary text-center">
            By continuing, you agree to our{' '}
            <a href="#" className="text-accent hover:text-accent-hover underline underline-offset-2">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-accent hover:text-accent-hover underline underline-offset-2">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
