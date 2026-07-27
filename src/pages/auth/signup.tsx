import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, User, Phone, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useState } from 'react'

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})
const step2EmailSchema = z.object({
  email: z.string().email('Invalid email address'),
})
const step2PhoneSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
})

type Step1Form = z.infer<typeof step1Schema>
type Step2EmailForm = z.infer<typeof step2EmailSchema>
type Step2PhoneForm = z.infer<typeof step2PhoneSchema>

const steps = ['Name', 'Contact', 'Verify']

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
    const result = await signup(data.email, name)
    if (result.error) {
      setError(result.error)
    } else {
      setStep(3)
      setTimeout(() => navigate('/verify'), 2000)
    }
  }

  const onStep2Phone = async (data: Step2PhoneForm) => {
    setError(null)
    const result = await signupWithPhone(data.phone, name)
    if (result.error) {
      setError(result.error)
    } else {
      setStep(3)
      setTimeout(() => navigate('/verify'), 2000)
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
          {step === 2 && "How should we reach you?"}
          {step === 3 && "Check your inbox!"}
        </h1>
        <p className="text-text-secondary mt-1">
          {step === 1 && "This is how others will see you on SMUGFLEX"}
          {step === 2 && "We'll send you a verification link — no password needed yet"}
          {step === 3 && "We've sent you a link to verify and create your password"}
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

      {/* Step 2: Contact */}
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
              <p className="text-xs text-text-tertiary">
                We'll send a verification link. You'll create your password after verifying.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button type="submit" fullWidth size="lg" loading={step2Email.formState.isSubmitting} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  Send Verification Link
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
              <p className="text-xs text-text-tertiary">
                We'll send a verification link. You'll create your password after verifying.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button type="submit" fullWidth size="lg" loading={step2Phone.formState.isSubmitting} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  Send Verification Link
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Step 3: Check inbox */}
      {step === 3 && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-accent" />
            </div>
          </div>
          <p className="text-text-secondary">
            {method === 'email'
              ? "We've sent a verification link to your email. Click it to set your password and activate your account."
              : "We've sent a verification link via SMS. Click it to set your password and activate your account."}
          </p>
          <p className="text-sm text-text-tertiary">Redirecting to verification page...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
        </div>
      )}

      {/* Footer */}
      {step < 3 && (
        <p className="text-center text-sm text-text-secondary">
          Already have an account? <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Sign in</Link>
        </p>
      )}
    </div>
  )
}
