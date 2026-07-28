import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useState, useEffect } from 'react'
import { SmugflexLogo } from '@/components/atoms/smugflex-logo'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const result = await login(data.email, data.password)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/home')
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    const result = await loginWithGoogle()
    if (result.error) {
      setError(result.error)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Brand */}
      <div className="lg:w-1/2 bg-gradient-to-br from-accent via-accent-hover to-accent-dark flex flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden">
        <div className="absolute top-20 left-10 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-48 w-48 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center lg:text-left max-w-md">
          <div className="hidden lg:block">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome back to <span className="text-secondary">SMUGFLEX</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Your digital ecosystem for meaningful connections and knowledge sharing.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-sm text-white/80">End-to-end encrypted messaging</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-sm text-white/80">Your data is never sold or shared</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6 lg:hidden">
              <SmugflexLogo size="md" variant="full" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-error-light border border-error/20 flex items-start gap-3" role="alert">
              <div className="h-5 w-5 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-error">!</span>
              </div>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-text-primary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                  {...register('email')}
                  autoComplete="email"
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
              </div>
              {errors.email && <p id="login-email-error" className="mt-2 text-sm text-error">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-text-primary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-11 pr-12 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                  {...register('password')}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p id="login-password-error" className="mt-2 text-sm text-error">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={isSubmitting} className="h-14 text-base font-semibold rounded-2xl shadow-lg shadow-accent/20">
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-bg-primary text-text-tertiary">or continue with</span>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={handleGoogle} loading={googleLoading} icon={<GoogleIcon />} className="h-12 rounded-2xl border-2 font-medium">
            Continue with Google
          </Button>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-accent-light/50">
            <Shield className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-xs text-text-secondary">
              Your connection is encrypted and secure
            </p>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
