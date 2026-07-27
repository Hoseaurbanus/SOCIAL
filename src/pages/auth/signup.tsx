import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useState } from 'react'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((s) => s.signup)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (data: SignupForm) => {
    setError(null)
    const result = await signup(data.email, data.password, data.name)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-xl font-bold text-text-inverse">S</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
        <p className="text-text-secondary">Join the community</p>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-error-light text-error text-sm" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-text-primary mb-1">Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="signup-name" type="text" placeholder="Your name" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('name')} aria-describedby={errors.name ? 'signup-name-error' : undefined} />
          </div>
          {errors.name && <p id="signup-name-error" className="mt-1 text-sm text-error">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="signup-email" type="email" placeholder="you@example.com" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('email')} aria-describedby={errors.email ? 'signup-email-error' : undefined} />
          </div>
          {errors.email && <p id="signup-email-error" className="mt-1 text-sm text-error">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-text-primary mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="signup-password" type="password" placeholder="Create a password" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('password')} aria-describedby={errors.password ? 'signup-password-error' : undefined} />
          </div>
          {errors.password && <p id="signup-password-error" className="mt-1 text-sm text-error">{errors.password.message}</p>}
        </div>
        <div>
          <label htmlFor="signup-confirm" className="block text-sm font-medium text-text-primary mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="signup-confirm" type="password" placeholder="Confirm your password" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('confirmPassword')} aria-describedby={errors.confirmPassword ? 'signup-confirm-error' : undefined} />
          </div>
          {errors.confirmPassword && <p id="signup-confirm-error" className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>Create Account</Button>
      </form>
      <p className="text-center text-sm text-text-secondary">
        Already have an account? <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
      </p>
    </div>
  )
}
