'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { saveGuestSession, saveLang } from '@/lib/storage'
import type { GuestSession } from '@/lib/types'
import Logo from './Logo'
import { Mail, ArrowRight, Users, ArrowLeft, Chrome } from 'lucide-react'

interface LoginScreenProps {
  onLogin: () => void
}

function randomGuestId(): string {
  const animals = ['Lion', 'Tiger', 'Bear', 'Wolf', 'Eagle', 'Shark', 'Panda', 'Fox', 'Hawk', 'Lynx', 'Orca', 'Stag']
  const emojis: Record<string, string> = { Lion: '🦁', Tiger: '🐯', Bear: '🐻', Wolf: '🐺', Eagle: '🦅', Shark: '🦈', Panda: '🐼', Fox: '🦊', Hawk: '🦅', Lynx: '🐱', Orca: '🐋', Stag: '🦌' }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let tag = ''
  for (let i = 0; i < 5; i++) tag += chars[Math.floor(Math.random() * chars.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${emojis[animal]} ${animal} #${tag}`
}

type Step = 'home' | 'email-input' | 'email-otp'

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const systemLang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh' : 'en'
  const [lang, setLang] = useState<'en' | 'zh'>(systemLang)
  const [step, setStep] = useState<Step>('home')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const copy = {
    en: {
      tagline: 'Your AI-powered daily nutrition coach',
      sub: 'Personalised meals based on your body data',
      google: 'Continue with Google',
      email: 'Continue with Email',
      phone: 'Continue with Phone',
      comingSoon: 'Coming Soon',
      divider: 'or',
      guest: 'Continue as Guest',
      guestNote: 'No account needed · Data saved on this device',
      emailPlaceholder: 'your@email.com',
      sendCode: 'Send Code',
      codeSent: 'Code sent to',
      enterCode: 'Enter the 6-digit code',
      verify: 'Verify',
      back: 'Back',
      wrongEmail: 'Wrong email?',
      errorInvalid: 'Invalid or expired code. Please try again.',
      errorSend: 'Failed to send code. Please try again.',
    },
    zh: {
      tagline: 'AI 每日飲食教練',
      sub: '根據你的身體數據，生成個人化三餐',
      google: '以 Google 繼續',
      email: '以 Email 繼續',
      phone: '以電話號碼繼續',
      comingSoon: '即將推出',
      divider: '或',
      guest: '以訪客身份繼續',
      guestNote: '不需要帳號・資料儲存在此裝置',
      emailPlaceholder: 'your@email.com',
      sendCode: '發送驗證碼',
      codeSent: '驗證碼已發送至',
      enterCode: '輸入 6 位數驗證碼',
      verify: '驗證',
      back: '返回',
      wrongEmail: '電郵有誤？',
      errorInvalid: '驗證碼無效或已過期，請重試',
      errorSend: '發送失敗，請重試',
    },
  }[lang]

  async function handleGuest() {
    setLoading(true)
    saveLang(lang)
    const session: GuestSession = {
      id: randomGuestId(),
      isGuest: true,
      createdAt: new Date().toISOString(),
    }
    saveGuestSession(session)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 600)
  }

  async function handleGoogle() {
    setLoading(true)
    saveLang(lang)
    await signIn('google', { callbackUrl: '/' })
  }

  async function handleSendOtp() {
    if (!email.includes('@')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { token?: string; error?: string }
      if (data.token) {
        setOtpToken(data.token)
        setStep('email-otp')
      } else {
        setError(copy.errorSend)
      }
    } catch {
      setError(copy.errorSend)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return
    setLoading(true)
    setError('')
    saveLang(lang)
    try {
      const result = await signIn('email-otp', {
        email, otp, token: otpToken,
        redirect: false,
      })
      if (result?.ok) {
        // AuthGate's session check will handle showing the app
        window.location.reload()
      } else {
        setError(copy.errorInvalid)
      }
    } catch {
      setError(copy.errorInvalid)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 py-10 overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #EDF9F4 0%, #F8FFFE 50%, #ffffff 100%)' }}
    >
      {/* Lang toggle */}
      <div className="w-full flex justify-end">
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-[#0F9E75] transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      {/* Logo + tagline */}
      <div className="flex flex-col items-center text-center gap-5 flex-1 justify-center py-8">
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0BD68A 0%, transparent 70%)' }}
        />
        <Logo lang={lang} size="lg" className="relative" />
        <div className="space-y-2">
          <p className="text-xl font-bold text-slate-800 leading-snug">{copy.tagline}</p>
          <p className="text-sm text-slate-500 max-w-xs">{copy.sub}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {(lang === 'zh'
            ? ['早午晚三餐', '身體數據追蹤', 'AI 個人化', '購物清單']
            : ['3 meals/day', 'Body tracking', 'AI personalised', 'Shopping list']
          ).map((f) => (
            <span key={f} className="text-xs font-semibold text-[#0F9E75] bg-[#E8F5F0] px-3 py-1 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Login options */}
      <div className="w-full max-w-sm space-y-3">

        {/* ── HOME STEP ─────────────────────────────── */}
        {step === 'home' && (
          <>
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-[#0F9E75] transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Chrome size={18} className="text-[#4285F4]" />
              <span>{copy.google}</span>
            </button>

            {/* Email */}
            <button
              onClick={() => setStep('email-input')}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-[#0F9E75] transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Mail size={18} className="text-slate-400" />
              <span>{copy.email}</span>
            </button>

            {/* Phone — coming soon */}
            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-400 cursor-not-allowed relative"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <span className="text-slate-300 text-base">📱</span>
              <span>{copy.phone}</span>
              <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                {copy.comingSoon}
              </span>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">{copy.divider}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Guest */}
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-70 transition-all active:scale-98"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.35)' }}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Users size={17} />{copy.guest}<ArrowRight size={15} className="ml-auto" /></>
              }
            </button>
            <p className="text-center text-[11px] text-slate-400">{copy.guestNote}</p>
          </>
        )}

        {/* ── EMAIL INPUT STEP ───────────────────────── */}
        {step === 'email-input' && (
          <>
            <div className="text-center mb-2">
              <p className="font-bold text-slate-800">{copy.email}</p>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              placeholder={copy.emailPlaceholder}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0F9E75] transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading || !email.includes('@')}
              className="w-full btn-primary py-4 disabled:opacity-50"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : copy.sendCode
              }
            </button>
            <button
              onClick={() => { setStep('home'); setError('') }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-400 py-2"
            >
              <ArrowLeft size={14} /> {copy.back}
            </button>
          </>
        )}

        {/* ── OTP STEP ──────────────────────────────── */}
        {step === 'email-otp' && (
          <>
            <div className="text-center mb-2 space-y-1">
              <p className="font-bold text-slate-800">{copy.enterCode}</p>
              <p className="text-xs text-slate-500">{copy.codeSent} <span className="font-semibold text-slate-700">{email}</span></p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              placeholder="123456"
              className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-white text-2xl font-bold text-center text-slate-800 placeholder-slate-300 tracking-[0.5em] focus:outline-none focus:border-[#0F9E75] transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full btn-primary py-4 disabled:opacity-50"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : copy.verify
              }
            </button>
            <button
              onClick={() => { setStep('email-input'); setOtp(''); setError('') }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-400 py-2"
            >
              <ArrowLeft size={14} /> {copy.wrongEmail}
            </button>
          </>
        )}

      </div>
    </div>
  )
}
