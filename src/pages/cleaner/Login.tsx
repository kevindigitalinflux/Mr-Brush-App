import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getRoleFromId, getRouteForRole } from '../../lib/auth'

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

/** Mock auth — replace with Supabase call once DB is ready. Any password accepted for now. */
function mockAuth(displayId: string): boolean {
  return getRoleFromId(displayId) !== null
}

export function Login() {
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

    // Simulate network delay — remove when wiring real auth
    await new Promise((r) => setTimeout(r, 800))

    const role = getRoleFromId(cleanerId.trim())
    const valid = mockAuth(cleanerId.trim()) && password.length > 0

    if (!valid || !role) {
      setError(true)
      setLoading(false)
      return
    }

    setUser({
      id: crypto.randomUUID(),
      display_id: cleanerId.trim().toUpperCase(),
      role,
      name: cleanerId.trim().toUpperCase(),
      language,
    })

    navigate(getRouteForRole(role))
  }

  const passwordHasError = error && password.length > 0

  return (
    <div className="min-h-screen w-full bg-[#F4F4EE] flex items-center justify-center px-6 py-[103px]">
      <div className="flex flex-col gap-8 w-full max-w-[448px]">

        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white border border-[#C3C8C2] shadow-sm flex items-center justify-center">
            {/* Logo asset goes here */}
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-['Poppins',sans-serif] font-semibold text-[32px] leading-[38px] tracking-[-0.32px] text-[#1A1C19] text-center">
              Welcome back
            </h1>
            <p className="font-['Lato',sans-serif] text-base text-[#434844] text-center">
              Sign in with your Cleaner ID
            </p>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#C3C8C2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-[25px] flex flex-col gap-8"
        >
          <div className="flex flex-col gap-4">

            {/* Cleaner ID */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="cleanerId"
                className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] ml-2"
              >
                Cleaner ID
              </label>
              <input
                id="cleanerId"
                type="text"
                value={cleanerId}
                onChange={(e) => { setCleanerId(e.target.value); setError(false) }}
                placeholder="e.g. C002"
                autoComplete="username"
                className="h-[52px] w-full border border-[#C3C8C2] rounded-[4px] px-[17px] font-['Lato',sans-serif] text-base text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className={[
                  "font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] ml-2",
                  passwordHasError ? 'text-[#BA1A1A]' : 'text-[#434844]',
                ].join(' ')}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false) }}
                  autoComplete="current-password"
                  className={[
                    'h-[52px] w-full border rounded-[4px] pl-[17px] pr-[49px] font-[\'Lato\',sans-serif] text-base text-[#1A1C19] outline-none transition-colors',
                    passwordHasError
                      ? 'border-[#BA1A1A] focus:border-[#BA1A1A]'
                      : 'border-[#C3C8C2] focus:border-[#B8A77A]',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 pl-2 pt-1">
                  <ErrorIcon />
                  <p className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#BA1A1A] leading-[1.2]">
                    Incorrect ID or password. Please try again.
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-[#B8A77A] rounded-[4px] font-['Poppins',sans-serif] font-semibold text-base text-[#F8F8F2] text-center cursor-pointer hover:bg-[#a8976a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Footer helper */}
          <div className="flex flex-col items-center">
            <p className="font-['Lato',sans-serif] text-base text-[#1A1C19] text-center underline decoration-[#C3C8C2] leading-[1.6]">
              Forgotten your Cleaner ID?<br />Let your supervisor know
            </p>
          </div>
        </form>

      </div>
    </div>
  )
}
