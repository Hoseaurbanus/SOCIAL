import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { ShieldCheck, Mail, Phone, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'
import { SmugflexLogo } from '@/components/atoms/smugflex-logo'

export default function VerifyPage() {
  const navigate = useNavigate()
  const { pendingVerification, verifyOtp, resendOtp } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const identifier = pendingVerification?.identifier || ''
  const type = pendingVerification?.type || 'email'
  const isEmail = type === 'email'

  useEffect(() => {
    if (!pendingVerification) {
      navigate('/signup', { replace: true })
    }
  }, [pendingVerification, navigate])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError(null)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''))
      setCode(newCode)
      const nextEmpty = newCode.findIndex((c) => !c)
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    }
  }

  const handleVerify = useCallback(async () => {
    const otp = code.join('')
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsVerifying(true)
    setError(null)
    const result = await verifyOtp(identifier, otp, type)
    setIsVerifying(false)

    if (result.error) {
      setError(result.error)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } else {
      navigate('/create-password')
    }
  }, [code, identifier, type, verifyOtp, navigate])

  useEffect(() => {
    if (code.every((c) => c !== '')) {
      handleVerify()
    }
  }, [code, handleVerify])

  const handleResend = async () => {
    if (!canResend) return
    const result = await resendOtp(identifier, type)
    if (result.error) {
      setError(result.error)
    } else {
      setResendTimer(60)
      setCanResend(false)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const maskedIdentifier = isEmail
    ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : identifier.replace(/(\+\d{1,2})\d+(\d{4})/, '$1****$2')

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Brand */}
      <div className="lg:w-1/2 bg-gradient-to-br from-accent via-accent-hover to-accent-dark flex flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden">
        <div className="absolute top-20 left-10 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-48 w-48 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center lg:text-left max-w-md">
          <div className="hidden lg:block">
            <h1 className="text-4xl font-bold text-white mb-4">
              Almost <span className="text-secondary">there</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Verify your identity to secure your account and get started.
            </p>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-sm text-white/80">Two-factor verification keeps your account safe</p>
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
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign up
            </button>

            <div className="flex justify-center lg:justify-start mb-6">
              <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-accent" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Verify your {type}
            </h2>
            <p className="text-text-secondary">
              Enter the 6-digit code we sent to
            </p>
            <p className="text-text-primary font-semibold mt-1 flex items-center justify-center lg:justify-start gap-2">
              {isEmail ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              {maskedIdentifier}
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

          {/* OTP Input */}
          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-0 transition-all outline-none"
                aria-label={`Digit ${index + 1}`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <p className="text-sm text-text-secondary text-center">
            After verification, you'll create your password
          </p>

          <Button
            fullWidth
            size="lg"
            loading={isVerifying}
            onClick={handleVerify}
            disabled={code.some((c) => !c)}
            className="h-14 text-base font-semibold rounded-2xl shadow-lg shadow-accent/20"
          >
            Verify & Continue
          </Button>

          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Resend code
              </button>
            ) : (
              <p className="text-sm text-text-tertiary">
                Resend code in {resendTimer}s
              </p>
            )}
          </div>

          <p className="text-center text-sm text-text-secondary">
            <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
