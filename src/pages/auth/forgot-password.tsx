import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { Mail } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { supabase } from '@/config/supabase'
import { useState } from 'react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-accent-light flex items-center justify-center">
            <Mail className="h-8 w-8 text-accent" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
          <p className="text-text-secondary mt-2">We've sent a password reset link to your email. Please check your inbox.</p>
        </div>
        <p className="text-sm text-text-secondary">
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Back to Sign In</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Forgot password?</h1>
        <p className="text-text-secondary">Enter your email and we'll send you a reset link</p>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-error-light text-error text-sm" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="reset-email" type="email" placeholder="you@example.com" className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('email')} aria-describedby={errors.email ? 'reset-email-error' : undefined} />
          </div>
          {errors.email && <p id="reset-email-error" className="mt-1 text-sm text-error">{errors.email.message}</p>}
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>Send Reset Link</Button>
      </form>
      <p className="text-center text-sm text-text-secondary">
        Remember your password? <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
      </p>
    </div>
  )
}
