import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useState } from 'react'

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})
const step2EmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
const step2PhoneSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type Step1Form = z.infer<typeof step1Schema>
type Step2EmailForm = z.infer<typeof step2EmailSchema>
type Step2PhoneForm = z.infer<typeof step2PhoneSchema>

const steps = ['Name', 'Account', 'Done']

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, signupWithPhone } = useAuthStore()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [name, setName] = useState('')

  const step1 = useForm<Step1Form>({ resolver: zodResolver(step1Schema) })
  const step2Email = useForm<Step2EmailForm>({ resolver: zodResolver(step2EmailSchema) })
  const step2Phone = useForm<Step2PhoneForm>({ resolver: zodResolver(step2PhoneSchema) })

  const onStep1 = (data: Step1Form) => {
    setName(data.name)
    setStep(2)
  }

  const onStep2Email = async (data: Step2EmailForm) => {
    setError(null)
    const result = await signup(data.email, data.password, name)
    if (result.error) {
      setError(result.error)
    } else {
      setStep(3)
      if (result.needsVerification) {
        setTimeout(() => navigate('/verify'), 1500)
      } else {
        setTimeout(() => navigate('/onboarding'), 1500)
      }
    }
  }

  const onStep2Phone = async (data: Step2PhoneForm) => {
    setError(null)
    const result = await signupWithPhone(data.phone, data.password, name)
    if (result.error) {
      setError(result.error)
    } else {
      setStep(3)
      if (result.needsVerification) {
        setTimeout(() => navigate('/verify'), 1500)
      } else {
        setTimeout(() => navigate('/onboarding'), 1500)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
              step > i + 1 ? 'bg-accent text-text-inverse' :
              step === i + 1 ? 'bg-accent text-text-inverse' :
              'bg-bg-tertiary text-text-tertiary'
            }`}>
              {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-accent' : 'bg-bg-tertiary'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-xl font-bold text-text-inverse">S</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          {step === 1 && "What's your name?"}
          {step === 2 && `How do you want to sign up?`}
          {step === 3 && "You're in!"}
        </h1>
        <p className="text-text-secondary mt-1">
          {step === 1 && "This is how others will see you on SMUGFLEX"}
          {step === 2 && "Choose email or phone to create your account"}
          {step === 3 && "Welcome to the community"}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-light text-error text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Step 1: Name */}
      {step === 1 && (
        <form onSubmit={step1.handleSubmit(onStep1)} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-text-primary mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                {...step1.register('name')}
                aria-describedby={step1.formState.errors.name ? 'step1-name-error' : undefined}
                autoFocus
              />
            </div>
            {step1.formState.errors.name && (
              <p id="step1-name-error" className="mt-1.5 text-sm text-error">{step1.formState.errors.name.message}</p>
            )}
          </div>
          <Button type="submit" fullWidth size="lg" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
            Continue
          </Button>
        </form>
      )}

      {/* Step 2: Account details */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Method toggle */}
          <div className="flex rounded-xl bg-bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
                method === 'email'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
                method === 'phone'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>

          {/* Email form */}
          {method === 'email' && (
            <form onSubmit={step2Email.handleSubmit(onStep2Email)} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    {...step2Email.register('email')}
                    aria-describedby={step2Email.formState.errors.email ? 'step2-email-error' : undefined}
                    autoFocus
                  />
                </div>
                {step2Email.formState.errors.email && (
                  <p id="step2-email-error" className="mt-1.5 text-sm text-error">{step2Email.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-password-email" className="block text-sm font-medium text-text-primary mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-password-email"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    {...step2Email.register('password')}
                    aria-describedby={step2Email.formState.errors.password ? 'step2-pw-error' : undefined}
                  />
                </div>
                {step2Email.formState.errors.password && (
                  <p id="step2-pw-error" className="mt-1.5 text-sm text-error">{step2Email.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-confirm-email" className="block text-sm font-medium text-text-primary mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-confirm-email"
                    type="password"
                    placeholder="Re-enter password"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    {...step2Email.register('confirmPassword')}
                    aria-describedby={step2Email.formState.errors.confirmPassword ? 'step2-confirm-error' : undefined}
                  />
                </div>
                {step2Email.formState.errors.confirmPassword && (
                  <p id="step2-confirm-error" className="mt-1.5 text-sm text-error">{step2Email.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button type="submit" fullWidth size="lg" loading={step2Email.formState.isSubmitting} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  Create Account
                </Button>
              </div>
            </form>
          )}

          {/* Phone form */}
          {method === 'phone' && (
            <form onSubmit={step2Phone.handleSubmit(onStep2Phone)} className="space-y-4">
              <div>
                <label htmlFor="signup-phone" className="block text-sm font-medium text-text-primary mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    {...step2Phone.register('phone')}
                    aria-describedby={step2Phone.formState.errors.phone ? 'step2-phone-error' : undefined}
                    autoFocus
                  />
                </div>
                {step2Phone.formState.errors.phone && (
                  <p id="step2-phone-error" className="mt-1.5 text-sm text-error">{step2Phone.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-password-phone" className="block text-sm font-medium text-text-primary mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-password-phone"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    {...step2Phone.register('password')}
                    aria-describedby={step2Phone.formState.errors.password ? 'step2-pw-phone-error' : undefined}
                  />
                </div>
                {step2Phone.formState.errors.password && (
                  <p id="step2-pw-phone-error" className="mt-1.5 text-sm text-error">{step2Phone.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="signup-confirm-phone" className="block text-sm font-medium text-text-primary mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-confirm-phone"
                    type="password"
                    placeholder="Re-enter password"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-bg-primary text-text-primary text-base focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    {...step2Phone.register('confirmPassword')}
                    aria-describedby={step2Phone.formState.errors.confirmPassword ? 'step2-confirm-phone-error' : undefined}
                  />
                </div>
                {step2Phone.formState.errors.confirmPassword && (
                  <p id="step2-confirm-phone-error" className="mt-1.5 text-sm text-error">{step2Phone.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button type="submit" fullWidth size="lg" loading={step2Phone.formState.isSubmitting} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  Create Account
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <p className="text-text-secondary">
            {method === 'email'
              ? "We've sent a verification code to your email. Redirecting..."
              : "We've sent a verification code via SMS. Redirecting..."}
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
        </div>
      )}

      {/* Footer */}
      {step < 3 && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-bg-primary px-2 text-text-tertiary">or</span></div>
          </div>
          <Button variant="secondary" fullWidth onClick={async () => { await useAuthStore.getState().loginWithGoogle() }} icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          }>
            Continue with Google
          </Button>
          <p className="text-center text-sm text-text-secondary">
            Already have an account? <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
          </p>
        </div>
      )}
    </div>
  )
}
