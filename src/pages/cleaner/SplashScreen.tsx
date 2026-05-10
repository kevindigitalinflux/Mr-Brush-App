import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

type Phase = 'loading' | 'washing' | 'splash'

// Staggered positions the ivory wash circles burst from (bottom-center → outward)
const WASH_POSITIONS = [
  { left: '50%', top: '78%', delay: 0 },
  { left: '18%', top: '62%', delay: 70 },
  { left: '82%', top: '62%', delay: 70 },
  { left: '35%', top: '28%', delay: 150 },
  { left: '65%', top: '28%', delay: 150 },
  { left: '50%', top:  '8%', delay: 230 },
]

// Glass soap-bubble appearance on the dark green background
const BUBBLE_CSS: CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  pointerEvents: 'none',
  willChange: 'transform, opacity',
  background: [
    'radial-gradient(circle at 32% 28%, rgba(255,255,255,.92) 0%, rgba(255,255,255,0) 26%)',
    'radial-gradient(circle at 68% 72%, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 44%)',
    'radial-gradient(circle at 50% 50%, rgba(245,240,220,.1) 0%, rgba(245,240,220,0) 60%)',
  ].join(','),
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28), 0 2px 8px rgba(0,0,0,.22)',
}

// ─── Cleaning bucket SVG ─────────────────────────────────────────────────────

function CleaningBucket() {
  return (
    <svg width="84" height="88" viewBox="0 0 84 88" fill="none" aria-label="Mr Brush cleaning bucket">
      {/* Handle */}
      <path d="M20 26 C20 7 64 7 64 26" stroke="#C4A95A" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* Body */}
      <path d="M14 26 L18 78 Q42 86 66 78 L70 26 Z" fill="url(#bucketGrad)"/>
      <defs>
        <linearGradient id="bucketGrad" x1="14" y1="26" x2="70" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#E8D9A0"/>
          <stop offset="45%"  stopColor="#F8F3E3"/>
          <stop offset="100%" stopColor="#E4D49C"/>
        </linearGradient>
      </defs>
      {/* Rim — outer */}
      <ellipse cx="42" cy="26" rx="28" ry="5.5" fill="#DDD0A0"/>
      {/* Rim — inner bright top */}
      <ellipse cx="42" cy="25" rx="27" ry="4.5" fill="#F5EFD5"/>
      {/* Soapy water surface */}
      <ellipse cx="42" cy="29" rx="23" ry="4" fill="#CBEAD8" opacity="0.88"/>
      {/* Foam dots */}
      <circle cx="33" cy="27.5" r="2.5" fill="white" opacity="0.78"/>
      <circle cx="42" cy="26"   r="3"   fill="white" opacity="0.68"/>
      <circle cx="51" cy="27.5" r="2"   fill="white" opacity="0.72"/>
      {/* Left-side body shine */}
      <rect x="18" y="34" width="5" height="30" rx="2.5" fill="white" opacity="0.22"/>
      {/* Logo emblem */}
      <circle cx="42" cy="55" r="14" fill="#2F4A3D" opacity="0.13"/>
      <circle cx="42" cy="55" r="13" stroke="#2F4A3D" strokeWidth="1" fill="none" opacity="0.3"/>
      <text x="42" y="59.5" textAnchor="middle" fontFamily="Poppins,sans-serif" fontWeight="700" fontSize="10" fill="#2F4A3D" opacity="0.6">MB</text>
    </svg>
  )
}

// ─── Stagger bubble loader ────────────────────────────────────────────────────

function BubbleLoader() {
  return (
    <div style={{ position: 'relative', width: 84, height: 185 }}>
      {/* Bubble A */}
      <div style={{
        ...BUBBLE_CSS, width: 22, height: 22,
        left: '50%', bottom: 90,
        animation: 'splash-bubble-a 2.8s ease-in-out infinite',
      }} />
      {/* Bubble B */}
      <div style={{
        ...BUBBLE_CSS, width: 16, height: 16,
        left: '50%', bottom: 90,
        animation: 'splash-bubble-b 2.8s ease-in-out infinite',
        animationDelay: '1.2s',
      }} />
      {/* Bucket at bottom-center */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <CleaningBucket />
      </div>
    </div>
  )
}

// ─── Phase content ────────────────────────────────────────────────────────────

function LoadingContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      <BubbleLoader />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 22, color: '#F5F0E3', letterSpacing: '-0.4px' }}>
          Mr Brush &amp; Co.
        </span>
        <span style={{ fontFamily: 'Lato,sans-serif', fontSize: 12, color: '#D7C596', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          Cleaning Operations
        </span>
      </div>
    </div>
  )
}

function SplashLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, animation: 'logo-rise 550ms ease-out forwards' }}>
      {/* Logo circle — replace inner content with <img src={logo} /> once asset is ready */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'white', border: '1px solid #D0CFCA',
        boxShadow: '0 4px 24px rgba(61,59,58,.09)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: 22, color: '#2F4A3D' }}>MB</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: 24, color: '#3D3B3A', letterSpacing: '-0.5px' }}>
          Mr Brush &amp; Co.
        </span>
        <span style={{ fontFamily: 'Lato,sans-serif', fontSize: 14, color: '#434B4D' }}>
          Cleaning Operations
        </span>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

/**
 * Three-phase splash sequence:
 * 1. Loading (0–3 s)  — dark green bg, stagger bubble loader
 * 2. Washing (3–3.95 s) — ivory circles burst across the screen
 * 3. Splash (3.95–5.2 s) — logo fades in, then navigates to /language
 */
export function SplashScreen() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('washing'), 3000)
    const t2 = setTimeout(() => setPhase('splash'),  3950)
    const t3 = setTimeout(() => navigate('/language'), 5200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [navigate])

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#FAFAF4' }}>

      {/* ① Green loading layer — fades out when washing begins */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: '#2F4A3D',
          opacity: phase === 'loading' ? 1 : 0,
          transition: 'opacity 380ms ease-out',
          zIndex: 10,
          pointerEvents: phase === 'loading' ? 'auto' : 'none',
        }}
      >
        <LoadingContent />
      </div>

      {/* ② Ivory wash circles burst across screen, covering the green layer */}
      {phase === 'washing' && WASH_POSITIONS.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: pos.left,
            top: pos.top,
            width: '180vmax',
            height: '180vmax',
            borderRadius: '50%',
            background: '#FAFAF4',
            animation: `wash-expand 660ms cubic-bezier(.2,.6,.38,1) ${pos.delay}ms forwards`,
            zIndex: 20,
          }}
        />
      ))}

      {/* ③ Logo reveal on ivory */}
      {phase === 'splash' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30 }}>
          <SplashLogo />
        </div>
      )}

    </div>
  )
}
