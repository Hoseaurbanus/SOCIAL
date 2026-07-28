import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/config/supabase'
import { cn } from '@/lib/utils'
import { SmugflexLogo } from '@/components/atoms/smugflex-logo'

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-error' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-warning' }
  if (score <= 4) return { score, label: 'Strong', color: 'bg-success' }
  return { score, label: 'Very strong', color: 'bg-success' }
}

const passwordTips = [
  'At least 8 characters',
  'Mix of uppercase and lowercase',
  'Include numbers',
  'Include special characters (!@#$%)',
]

export default function CreatePasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const passwordValue = watch('password', '')
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }
    checkSession()
  }, [])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/home'), 2000)
      return () => clearTimeout(timer)
    }
  }, [success, navigate])

  const onSubmit = async (data: PasswordForm) => {
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
    }
  }

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-error/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-error" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Invalid or expired link</h1>
            <p className="text-text-secondary">
              This verification link has expired or is invalid. Please sign up again.
            </p>
          </div>
          <Button fullWidth size="lg" onClick={() => navigate('/signup')} className="h-14 rounded-2xl font-semibold">
            Sign Up Again
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Password created!</h1>
            <p className="text-text-secondary">Welcome to SMUGFLEX. Redirecting to your feed...</p>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
        </div>
      </div>
    )
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
              Secure your <span className="text-secondary">account</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Create a strong password to protect your account and data.
            </p>

            <div className="space-y-4">
              {passwordTips.map((tip) => (
                <div key={tip} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-secondary" />
                  </div>
                  <p className="text-sm text-white/80">{tip}</p>
                </div>
              ))}
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

            <div className="flex justify-center lg:justify-start mb-6">
              <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-accent" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-text-primary mb-2">Create your password</h2>
            <p className="text-text-secondary">Choose a strong password to secure your account</p>
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
              <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full h-12 pl-11 pr-12 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                  {...register('password')}
                  aria-describedby={errors.password ? 'new-pw-error' : undefined}
                  autoFocus
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
              {errors.password && (
                <p id="new-pw-error" className="mt-2 text-sm text-error">{errors.password.message}</p>
              )}
              {passwordValue.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors duration-300',
                          i <= strength.score ? strength.color : 'bg-bg-tertiary'
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn('text-xs mt-2 font-medium', strength.score <= 1 ? 'text-error' : strength.score <= 2 ? 'text-warning' : 'text-success')}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-text-primary mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  id="confirm-new-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className="w-full h-12 pl-11 pr-12 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                  {...register('confirmPassword')}
                  aria-describedby={errors.confirmPassword ? 'confirm-pw-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-pw-error" className="mt-2 text-sm text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-accent-light/50">
              <Shield className="h-4 w-4 text-accent flex-shrink-0" />
              <p className="text-xs text-text-secondary">
                Your password is encrypted and stored securely
              </p>
            </div>

            <Button type="submit" fullWidth loading={isSubmitting} className="h-14 text-base font-semibold rounded-2xl shadow-lg shadow-accent/20">
              Set Password & Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
