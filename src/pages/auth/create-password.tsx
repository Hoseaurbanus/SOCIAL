import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/config/supabase'
import { cn } from '@/lib/utils'

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
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
  if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' }
  return { score, label: 'Very strong', color: 'bg-success' }
}

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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  if (isValidSession === false) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-error/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-error" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invalid or expired link</h1>
          <p className="text-text-secondary mt-2">
            This verification link has expired or is invalid. Please sign up again.
          </p>
        </div>
        <Button fullWidth size="lg" onClick={() => navigate('/signup')}>
          Sign Up Again
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Password created!</h1>
          <p className="text-text-secondary mt-2">Welcome to SMUGFLEX. Redirecting to your feed...</p>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Create your password</h1>
        <p className="text-text-secondary mt-1">Choose a strong password to secure your account</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-light text-error text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className="w-full h-12 pl-10 pr-12 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              {...register('password')}
              aria-describedby={errors.password ? 'new-pw-error' : undefined}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="new-pw-error" className="mt-1.5 text-sm text-error">{errors.password.message}</p>
          )}
          {passwordValue.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= strength.score ? strength.color : 'bg-bg-tertiary'
                    )}
                  />
                ))}
              </div>
              <p className={cn('text-xs mt-1', strength.score <= 1 ? 'text-error' : strength.score <= 2 ? 'text-orange-500' : 'text-text-secondary')}>
                {strength.label}
              </p>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-text-primary mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              id="confirm-new-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password"
              className="w-full h-12 pl-10 pr-12 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              {...register('confirmPassword')}
              aria-describedby={errors.confirmPassword ? 'confirm-pw-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-pw-error" className="mt-1.5 text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Set Password & Continue
        </Button>
      </form>
    </div>
  )
}
