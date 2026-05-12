import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getRoleFromId, getRouteForRole } from '../../lib/auth'
import { gsap, useGSAP } from '../../lib/gsap'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import logoSrc from '../../assets/logo/logo.png'

// ─── Icons ───────────────────────────────────────────────────────────────────

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 1l22 22" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="#B8A77A" strokeWidth="2"/>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" stroke="#BA1A1A" strokeWidth="2"/>
      <path d="M12 8v4M12 16h.01" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const MOCK_NAMES: Record<string, string> = {
  C001: 'James Carter',
  C002: 'Maria Santos',
  C003: 'David Park',
  C004: 'Lena Webb',
  S001: 'Sarah Jenkins',
  S002: 'Tom Bradley',
  M001: 'Alistair Sterling',
}

/** Mock auth — replace with Supabase call once DB is ready. Any password accepted for now. */
function mockAuth(displayId: string): boolean {
  return getRoleFromId(displayId) !== null
}

// ─── Shared form logic (used by both mobile & desktop) ───────────────────────

function useLoginForm() {
  const { setUser, language } = useApp()
  const navigate = useNavigate()
  const [cleanerId, setCleanerId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const role = getRoleFromId(cleanerId.trim())
    const valid = mockAuth(cleanerId.trim()) && password.length > 0
    if (!valid || !role) { setError(true); setLoading(false); return }
    const displayId = cleanerId.trim().toUpperCase()
    setUser({ id: crypto.randomUUID(), display_id: displayId, role, name: MOCK_NAMES[displayId] ?? displayId, language })
    navigate(getRouteForRole(role))
  }

  return { cleanerId, setCleanerId, password, setPassword, showPassword, setShowPassword, error, setError, loading, handleSubmit }
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function LoginFields({ state }: { state: ReturnType<typeof useLoginForm> }) {
  const { cleanerId, setCleanerId, password, setPassword, showPassword, setShowPassword, error, setError, loading, handleSubmit } = state
  const passwordHasError = error && password.length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="cleanerId" className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] ml-1">
          Cleaner ID
        </label>
        <input
          id="cleanerId" type="text" value={cleanerId} placeholder="e.g. C002" autoComplete="username"
          onChange={(e) => { setCleanerId(e.target.value); setError(false) }}
          className="h-[52px] w-full border border-[#C3C8C2] rounded-[4px] px-[17px] font-['Lato',sans-serif] text-base text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={['font-[\'Lato\',sans-serif] font-bold text-[14px] tracking-[0.7px] ml-1', passwordHasError ? 'text-[#BA1A1A]' : 'text-[#434844]'].join(' ')}>
          Password
        </label>
        <div className="relative">
          <input
            id="password" type={showPassword ? 'text' : 'password'} value={password} autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            className={['h-[52px] w-full border rounded-[4px] pl-[17px] pr-[49px] font-[\'Lato\',sans-serif] text-base text-[#1A1C19] outline-none transition-colors', passwordHasError ? 'border-[#BA1A1A] focus:border-[#BA1A1A]' : 'border-[#C3C8C2] focus:border-[#B8A77A]'].join(' ')}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2">
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 pl-1 pt-0.5">
            <ErrorIcon />
            <p className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#BA1A1A] leading-[1.2]">
              Incorrect ID or password. Please try again.
            </p>
          </div>
        )}
      </div>
      <button type="submit" disabled={loading}
        className="w-full h-[56px] bg-[#B8A77A] rounded-[4px] font-['Poppins',sans-serif] font-semibold text-base text-[#F8F8F2] cursor-pointer hover:bg-[#a8976a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopLogin() {
  const state = useLoginForm()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dl-panel', { opacity: 0, x: -24, duration: 0.5 })
      .from('.dl-card',  { opacity: 0, y: 20, duration: 0.45, ease: 'back.out(1.2)' }, '-=0.25')
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden w-full">
      {/* Left: brand panel */}
      <div
        className="dl-panel hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1350&q=60)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark overlay — keeps image faint, maintains brand colour */}
        <div className="absolute inset-0 bg-[#111E17]/88" />
        <div className="relative z-10 flex items-center gap-3">
          <img src={logoSrc} alt="Mr Brush & Co." className="w-9 h-9 object-contain" />
          <span className="font-['Poppins',sans-serif] font-semibold text-[#D7C596] text-[15px]">Mr Brush & Co.</span>
        </div>
        <div className="relative z-10">
          <h2 className="font-['Poppins',sans-serif] font-bold text-[52px] xl:text-[60px] text-white leading-[1.08] tracking-[-1.5px]">
            Precision in<br />Every Detail.
          </h2>
          <p className="font-['Lato',sans-serif] text-white/50 text-lg mt-5 leading-[1.7] max-w-sm">
            Access your cleaner portal to manage shifts, submit zone evidence, and track your work in real time.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-[480px] xl:w-[520px] shrink-0 bg-[#F4F4EE] flex items-start justify-center px-10 pt-14 pb-12 overflow-y-auto">
        <div className="dl-card w-full max-w-[420px] flex flex-col gap-8">
          <div className="flex flex-col items-center gap-3">
            <img src={logoSrc} alt="Mr Brush & Co." className="w-16 h-16 object-contain" />
            <div className="text-center">
              <h1 className="font-['Poppins',sans-serif] font-semibold text-[32px] text-[#1A1C19] tracking-[-0.3px]">Welcome back</h1>
              <p className="font-['Lato',sans-serif] text-[#737874] text-base mt-1">Sign in to your Cleaner Portal</p>
            </div>
          </div>
          <div className="bg-white border border-[#C3C8C2] rounded-[12px] shadow-sm p-8">
            <LoginFields state={state} />
            <p className="font-['Lato',sans-serif] text-sm text-[#1A1C19] text-center underline decoration-[#C3C8C2] leading-[1.6] mt-6">
              Forgotten your Cleaner ID?<br />Let your supervisor know
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileLogin() {
  const state = useLoginForm()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.login-logo',  { scale: 0.8, opacity: 0, duration: 0.45, ease: 'back.out(1.4)' })
      .from('.login-title', { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      .from('.login-card',  { opacity: 0, y: 16, duration: 0.4 }, '-=0.2')
  }, { scope: containerRef })

  return (
    <div className="min-h-screen w-full bg-[#F4F4EE] flex items-start justify-center px-6 pt-16 pb-12">
      <div ref={containerRef} className="flex flex-col gap-8 w-full max-w-[448px]">
        <div className="login-logo flex flex-col items-center gap-4">
          <img src={logoSrc} alt="Mr Brush & Co." className="w-28 h-28 object-contain" />
          <div className="login-title flex flex-col items-center gap-2">
            <h1 className="font-['Poppins',sans-serif] font-semibold text-[32px] leading-[38px] tracking-[-0.32px] text-[#1A1C19] text-center">Welcome back</h1>
            <p className="font-['Lato',sans-serif] text-base text-[#434844] text-center">Sign in with your Cleaner ID</p>
          </div>
        </div>
        <div className="login-card bg-white border border-[#C3C8C2] rounded-[12px] shadow-sm p-[25px] flex flex-col gap-6">
          <LoginFields state={state} />
          <div className="flex flex-col items-center">
            <p className="font-['Lato',sans-serif] text-base text-[#1A1C19] text-center underline decoration-[#C3C8C2] leading-[1.6]">
              Forgotten your Cleaner ID?<br />Let your supervisor know
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function Login() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopLogin /> : <MobileLogin />
}
