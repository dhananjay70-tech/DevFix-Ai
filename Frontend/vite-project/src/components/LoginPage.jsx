import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { BotIcon, GithubIcon, SparklesIcon, CheckCircleIcon, AlertCircleIcon } from './Icons'

export default function LoginPage() {
  const { sendOtp, verifyOtp, loginWithGoogle } = useAuth()
  
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(60)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ]

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval = null
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      setIsTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timer])

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await sendOtp(email)
      setStep('otp')
      setSuccessMessage(`OTP sent to ${email}`)
      setTimer(60)
      setIsTimerActive(true)
      setTimeout(() => inputRefs[0].current?.focus(), 100)
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otpDigits]
    newOtp[index] = value.slice(-1)
    setOtpDigits(newOtp)

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const fullOtp = otpDigits.join('')
    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await verifyOtp(email, fullOtp)
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    if (isTimerActive) return
    setOtpDigits(['', '', '', '', '', ''])
    handleSendOtp()
  }

  return (
    <div className="login-page-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo" style={{ width: '42px', height: '42px' }}>
            <BotIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="login-title">DevFix AI</h1>
          <p className="login-subtitle">
            Autonomous software engineering & bug remediation platform
          </p>
        </div>

        {error && (
          <div className="auth-alert error-alert">
            <AlertCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success-alert">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <span className="spinner-dots">Sending OTP...</span>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>Send 6-Digit OTP</span>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={loginWithGoogle}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <div className="otp-header-meta">
                <label className="form-label">Enter 6-Digit OTP</label>
                <button
                  type="button"
                  className="btn-change-email"
                  onClick={() => setStep('email')}
                >
                  Change email
                </button>
              </div>
              <p className="otp-instruction">
                We've sent a 6-digit code to <strong style={{ color: '#ffffff' }}>{email}</strong>
              </p>

              <div className="otp-boxes-container">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Verify OTP & Log In</span>
                </>
              )}
            </button>

            <div className="otp-resend-row">
              {isTimerActive ? (
                <span className="timer-text">Resend code in {timer}s</span>
              ) : (
                <button
                  type="button"
                  className="btn-resend"
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
