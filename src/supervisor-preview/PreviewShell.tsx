import { useEffect, useState, type ReactNode } from 'react'

function useIsWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const h = () => setWide(window.innerWidth >= 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return wide
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function StatusBar() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
      10_000,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      height: 50,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 26px',
      background: '#F4F4EE',
      position: 'relative',
    }}>
      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#1A1C19' }}>
        {time}
      </span>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 34, background: '#1A1C19', borderRadius: 20,
      }} />
      {/* Battery + signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0"   y="7.5" width="2.5" height="3.5" rx="0.8" fill="#1A1C19" />
          <rect x="4"   y="5"   width="2.5" height="6"   rx="0.8" fill="#1A1C19" />
          <rect x="8"   y="2"   width="2.5" height="9"   rx="0.8" fill="#1A1C19" />
          <rect x="12"  y="0"   width="2.5" height="11"  rx="0.8" fill="#1A1C19" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#1A1C19" strokeOpacity="0.35"/>
          <rect x="2"   y="2"   width="17" height="8"  rx="2" fill="#1A1C19"/>
          <path d="M23 4v4a2 2 0 0 0 0-4z" fill="#1A1C19" fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Home indicator ───────────────────────────────────────────────────────────

function HomeBar() {
  return (
    <div style={{
      height: 28,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F4EE',
    }}>
      <div style={{ width: 134, height: 5, background: '#1A1C19', borderRadius: 3, opacity: 0.18 }} />
    </div>
  )
}

// ─── Phone frame ──────────────────────────────────────────────────────────────

/**
 * On desktop: wraps children in a phone-shaped frame.
 * The inner screen div uses CSS transform so that `position: fixed` descendants
 * are contained within the frame instead of the real viewport.
 * On mobile: passes children through unchanged.
 */
export function PreviewShell({ children }: { children: ReactNode }) {
  const isWide = useIsWide()

  if (!isWide) return <>{children}</>

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      gap: 14,
      background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #2e2b22 0%, #111110 100%)',
    }}>
      {/* Label */}
      <p style={{
        fontFamily: 'Lato, sans-serif',
        fontSize: 11,
        letterSpacing: '2.5px',
        color: '#4a4a44',
        textTransform: 'uppercase',
        userSelect: 'none',
        margin: 0,
      }}>
        Supervisor Portal · Mobile Preview
      </p>

      {/* Phone shell */}
      <div style={{
        width: 393,
        height: 852,
        borderRadius: 52,
        background: '#0D0D0B',
        padding: 10,
        flexShrink: 0,
        display: 'flex',
        boxShadow: [
          '0 0 0 1px #1c1c1a',
          'inset 0 0 0 1px #000',
          '0 0 0 0.5px rgba(255,255,255,0.04)',
          '0 60px 150px rgba(0,0,0,0.9)',
          '0 20px 50px rgba(0,0,0,0.6)',
        ].join(', '),
      }}>
        {/* Inner screen wrapper — flex column so status bar + content + home bar stack neatly */}
        <div style={{
          flex: 1,
          borderRadius: 44,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: '#F4F4EE',
        }}>
          <StatusBar />

          {/*
           * Content container — the CSS transform here makes this the containing block
           * for any `position: fixed` descendants, so fixed children are clipped to
           * this element rather than escaping to the real viewport.
           */}
          <div style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            overflow: 'hidden',
          }}>
            {children}
          </div>

          <HomeBar />
        </div>
      </div>
    </div>
  )
}
