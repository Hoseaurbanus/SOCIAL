import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { ShieldCheck, Mail, Phone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useAuthStore } from '@/stores/auth-store'

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
      navigate('/onboarding')
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
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign up
        </button>
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary text-center">Verify your {type}</h1>
        <p className="text-text-secondary text-center mt-2">
          Enter the 6-digit code we sent to
        </p>
        <p className="text-text-primary font-medium text-center mt-1 flex items-center justify-center gap-2">
          {isEmail ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          {maskedIdentifier}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-light text-error text-sm text-center" role="alert">
          {error}
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
            className="w-12 h-14 text-center text-xl font-bold rounded-xl border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
            aria-label={`Digit ${index + 1}`}
            autoFocus={index === 0}
          />
        ))}
      </div>

      <Button
        fullWidth
        size="lg"
        loading={isVerifying}
        onClick={handleVerify}
        disabled={code.some((c) => !c)}
      >
        Verify
      </Button>

      <div className="text-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-accent hover:text-accent-hover font-medium"
          >
            Resend code
          </button>
        ) : (
          <p className="text-sm text-text-tertiary">
            Resend code in {resendTimer}s
          </p>
        )}
      </div>

      <p className="text-center text-sm text-text-secondary">
        <Link to="/login" className="text-accent hover:text-accent-hover font-medium">Back to Sign In</Link>
      </p>
    </div>
  )
}
