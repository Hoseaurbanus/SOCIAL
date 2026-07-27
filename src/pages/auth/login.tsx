import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useState } from 'react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const result = await login(data.email, data.password)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/home')
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
        <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
        <p className="text-text-secondary">Sign in to your account</p>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-error-light text-error text-sm" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="login-email" type="email" placeholder="you@example.com" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('email')} aria-describedby={errors.email ? 'login-email-error' : undefined} />
          </div>
          {errors.email && <p id="login-email-error" className="mt-1 text-sm text-error">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-text-primary mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input id="login-password" type="password" placeholder="Enter your password" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('password')} aria-describedby={errors.password ? 'login-password-error' : undefined} />
          </div>
          {errors.password && <p id="login-password-error" className="mt-1 text-sm text-error">{errors.password.message}</p>}
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-accent hover:text-accent-hover">Forgot password?</Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>Sign In</Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-sm"><span className="bg-bg-primary px-2 text-text-tertiary">or</span></div>
      </div>
      <div className="space-y-3">
        <Button variant="secondary" fullWidth>Continue with Google</Button>
        <Button variant="secondary" fullWidth>Continue with Apple</Button>
      </div>
      <p className="text-center text-sm text-text-secondary">
        Don't have an account? <Link to="/signup" className="text-accent hover:text-accent-hover font-medium">Create one</Link>
      </p>
    </div>
  )
}
