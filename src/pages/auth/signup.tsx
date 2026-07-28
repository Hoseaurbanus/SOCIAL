import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, User, Phone, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { useState, useEffect } from 'react'
import { SmugflexLogo } from '@/components/atoms/smugflex-logo'

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

const steps = [
  { label: 'Name', description: 'Your display name' },
  { label: 'Contact', description: 'Email or phone' },
  { label: 'Verify', description: 'Check your inbox' },
]

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

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => navigate('/verify'), 2000)
      return () => clearTimeout(timer)
    }
  }, [step, navigate])

  const onStep2Email = async (data: Step2EmailForm) => {
    setError(null)
    const result = await signup(data.email, name)
    if (result.error) {
      setError(result.error)
    } else {
      setStep(3)
    }
  }

  const onStep2Phone = async (data: Step2PhoneForm) => {
    setError(null)
    const result = await signupWithPhone(data.phone, name)
    if (result.error) {
      setError(result.error)
    } else {
      setStep(3)
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
              Join <span className="text-secondary">S.S</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Create your account and start connecting with communities that matter.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-sm text-white/80">Free forever — no credit card needed</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-sm text-white/80">Join communities or create your own</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-sm text-white/80">Your data stays private and secure</p>
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

            {/* Step progress */}
            <div className="flex items-center gap-3 mb-8">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        step > i + 1
                          ? 'bg-accent text-white'
                          : step === i + 1
                            ? 'bg-accent text-white ring-4 ring-accent/20'
                            : 'bg-bg-tertiary text-text-tertiary'
                      }`}>
                        {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${step >= i + 1 ? 'text-accent' : 'text-text-tertiary'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                      step > i + 1 ? 'bg-accent' : 'bg-bg-tertiary'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {step === 1 && "What's your name?"}
              {step === 2 && "How should we reach you?"}
              {step === 3 && "Check your inbox!"}
            </h2>
            <p className="text-text-secondary">
              {step === 1 && "This is how others will see you on S.S"}
              {step === 2 && "We'll send you a verification link — no password needed yet"}
              {step === 3 && "We've sent you a link to verify and create your password"}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-error-light border border-error/20 flex items-start gap-3" role="alert">
              <div className="h-5 w-5 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-error">!</span>
              </div>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <form onSubmit={step1.handleSubmit(onStep1)} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                    {...step1.register('name')}
                    aria-describedby={step1.formState.errors.name ? 'step1-name-error' : undefined}
                    autoFocus
                  />
                </div>
                {step1.formState.errors.name && (
                  <p id="step1-name-error" className="mt-2 text-sm text-error">{step1.formState.errors.name.message}</p>
                )}
              </div>
              <Button type="submit" fullWidth size="lg" icon={<ArrowRight className="h-5 w-5" />} iconPosition="right" className="h-14 text-base font-semibold rounded-2xl shadow-lg shadow-accent/20">
                Continue
              </Button>
            </form>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Method toggle */}
              <div className="flex rounded-2xl bg-bg-tertiary p-1">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
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
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
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
                    <label htmlFor="signup-email" className="block text-sm font-medium text-text-primary mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                        {...step2Email.register('email')}
                        aria-describedby={step2Email.formState.errors.email ? 'step2-email-error' : undefined}
                        autoFocus
                      />
                    </div>
                    {step2Email.formState.errors.email && (
                      <p id="step2-email-error" className="mt-2 text-sm text-error">{step2Email.formState.errors.email.message}</p>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary">
                    We'll send a verification link. You'll create your password after verifying.
                  </p>
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />} className="h-14 rounded-2xl font-semibold">
                      Back
                    </Button>
                    <Button type="submit" fullWidth size="lg" loading={step2Email.formState.isSubmitting} icon={<ArrowRight className="h-5 w-5" />} iconPosition="right" className="h-14 text-base font-semibold rounded-2xl shadow-lg shadow-accent/20">
                      Send Verification
                    </Button>
                  </div>
                </form>
              )}

              {/* Phone form */}
              {method === 'phone' && (
                <form onSubmit={step2Phone.handleSubmit(onStep2Phone)} className="space-y-4">
                  <div>
                    <label htmlFor="signup-phone" className="block text-sm font-medium text-text-primary mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <input
                        id="signup-phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-border bg-bg-primary text-text-primary text-base placeholder:text-text-tertiary focus:border-accent focus:ring-0 transition-colors"
                        {...step2Phone.register('phone')}
                        aria-describedby={step2Phone.formState.errors.phone ? 'step2-phone-error' : undefined}
                        autoFocus
                      />
                    </div>
                    {step2Phone.formState.errors.phone && (
                      <p id="step2-phone-error" className="mt-2 text-sm text-error">{step2Phone.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary">
                    We'll send a verification link. You'll create your password after verifying.
                  </p>
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />} className="h-14 rounded-2xl font-semibold">
                      Back
                    </Button>
                    <Button type="submit" fullWidth size="lg" loading={step2Phone.formState.isSubmitting} icon={<ArrowRight className="h-5 w-5" />} iconPosition="right" className="h-14 text-base font-semibold rounded-2xl shadow-lg shadow-accent/20">
                      Send Verification
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
                <div className="h-20 w-20 rounded-3xl bg-accent/10 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-accent" />
                </div>
              </div>
              <p className="text-text-secondary leading-relaxed">
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
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
