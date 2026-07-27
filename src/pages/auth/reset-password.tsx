import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/config/supabase'

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }
    checkSession()
  }, [])

  const redirectTimer = useCallback(() => {
    const timeout = setTimeout(() => navigate('/home'), 2000)
    return () => clearTimeout(timeout)
  }, [navigate])

  useEffect(() => {
    if (success) {
      return redirectTimer()
    }
  }, [success, redirectTimer])

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
            This password reset link has expired or is invalid. Please request a new one.
          </p>
        </div>
        <Button fullWidth size="lg" onClick={() => navigate('/forgot-password')}>
          Request New Link
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
          <h1 className="text-2xl font-bold text-text-primary">Password updated!</h1>
          <p className="text-text-secondary mt-2">Your password has been changed. Redirecting to your feed...</p>
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
        <h1 className="text-2xl font-bold text-text-primary">Set new password</h1>
        <p className="text-text-secondary mt-1">Choose a strong password to secure your account</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm" role="alert">
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
              className="w-full h-12 pl-10 pr-12 rounded-xl border border-border bg-bg-primary text-text-primary text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
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
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p id="new-pw-error" className="mt-1.5 text-sm text-error">{errors.password.message}</p>
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
              className="w-full h-12 pl-10 pr-12 rounded-xl border border-border bg-bg-primary text-text-primary text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
              {...register('confirmPassword')}
              aria-describedby={errors.confirmPassword ? 'confirm-pw-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-pw-error" className="mt-1.5 text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Update Password
        </Button>
      </form>
    </div>
  )
}
