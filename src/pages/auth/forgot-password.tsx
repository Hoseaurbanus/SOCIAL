import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { Mail } from 'lucide-react'
import { Button } from '@/components/atoms/button'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordForm) => { console.log('Forgot password:', data) }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Forgot password?</h1>
        <p className="text-text-secondary">Enter your email and we'll send you a reset link</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input type="email" placeholder="you@example.com" className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" {...register('email')} />
          </div>
          {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>Send Reset Link</Button>
      </form>
      <p className="text-center text-sm text-text-secondary">
        Remember your password? <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
      </p>
    </div>
  )
}
