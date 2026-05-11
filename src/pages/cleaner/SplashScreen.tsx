import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../../assets/logo/logo.png'

type Phase = 'loading' | 'washing' | 'splash'

// ─── Bubble data ─────────────────────────────────────────────────────────────

// 45 deterministic wash bubbles — spread across the screen width
const WASH_BUBBLES = Array.from({ length: 45 }, (_, i) => ({
  left:    `${4 + ((i * 41) % 90)}%`,
  size:    16 + ((i * 7)   % 24),
  dur:     1700 + ((i * 133) % 800),
  delay:   (i * 97) % 1800,
  swayDur: 600  + ((i * 89)  % 400),
}))

// 8 sparkle positions around the logo (angle in degrees, radius in px from 300px container center)
const SPARKLE_RING = [
  { angle: 0,   r: 92, delay: 0   },
  { angle: 45,  r: 87, delay: 130 },
  { angle: 90,  r: 94, delay: 260 },
  { angle: 135, r: 85, delay: 80  },
  { angle: 180, r: 92, delay: 210 },
  { angle: 225, r: 88, delay: 170 },
  { angle: 270, r: 94, delay: 320 },
  { angle: 315, r: 86, delay: 100 },
]

// ─── Shared bubble appearance (exact values from design file) ────────────────

const SOAP_BUBBLE: CSSProperties = {
  borderRadius: '50%',
  willChange: 'transform, opacity',
  background: [
    'radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 26%)',
    'radial-gradient(circle at 68% 72%, rgba(127,182,224,.35) 0%, rgba(127,182,224,0) 44%)',
    'radial-gradient(circle at 50% 50%, rgba(207,233,251,.85) 0%, rgba(207,233,251,.55) 60%, rgba(207,233,251,0) 100%)',
  ].join(','),
  boxShadow: 'inset 0 0 0 1px rgba(127,182,224,.45), 0 2px 6px rgba(60,120,170,.15)',
}

// ─── Cleaning bucket (scaled up, logo on body) ───────────────────────────────

function CleaningBucket() {
  return (
    <svg width="110" height="115" viewBox="0 0 84 88" fill="none" aria-label="Mr Brush cleaning bucket">
      <path d="M20 26 C20 7 64 7 64 26" stroke="#C4A95A" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M14 26 L18 78 Q42 86 66 78 L70 26 Z" fill="url(#bg)"/>
      <defs>
        <linearGradient id="bg" x1="14" y1="26" x2="70" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#E8D9A0"/>
          <stop offset="45%" stopColor="#F8F3E3"/>
          <stop offset="100%" stopColor="#E4D49C"/>
        </linearGradient>
      </defs>
      <ellipse cx="42" cy="26" rx="28" ry="5.5" fill="#DDD0A0"/>
      <ellipse cx="42" cy="25" rx="27" ry="4.5" fill="#F5EFD5"/>
      <ellipse cx="42" cy="29" rx="23" ry="4"   fill="#CBEAD8" opacity="0.88"/>
      <circle cx="33" cy="27.5" r="2.5" fill="white" opacity="0.78"/>
      <circle cx="42" cy="26"   r="3"   fill="white" opacity="0.68"/>
      <circle cx="51" cy="27.5" r="2"   fill="white" opacity="0.72"/>
      <rect x="18" y="34" width="5" height="30" rx="2.5" fill="white" opacity="0.22"/>
      {/* Logo on bucket body */}
      <image href={logoSrc} x="26" y="40" width="32" height="32" opacity="0.72"/>
    </svg>
  )
}

// ─── Loading phase: stagger bubble loader ────────────────────────────────────

function BubbleLoader() {
  const sharedStyle: CSSProperties = { ...SOAP_BUBBLE, position: 'absolute', left: '50%', bottom: 116 }
  return (
    <div style={{ position: 'relative', width: 110, height: 230 }}>
      <div style={{ ...sharedStyle, width: 28, height: 28, animation: 'splash-bubble-a 2.8s ease-in-out infinite' }} />
      <div style={{ ...sharedStyle, width: 20, height: 20, animation: 'splash-bubble-b 2.8s ease-in-out infinite', animationDelay: '1.2s' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <CleaningBucket />
      </div>
    </div>
  )
}

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

// ─── Washing phase: loads of light blue bubbles floating up ──────────────────

function WashBubbles() {
  return (
    <>
      {WASH_BUBBLES.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: b.left, bottom: -40,
            animation: `bubble-rise ${b.dur}ms ease-in ${b.delay}ms forwards`,
            zIndex: 20,
          }}
        >
          <div style={{ ...SOAP_BUBBLE, width: b.size, height: b.size, animation: `bubble-sway ${b.swayDur}ms ease-in-out infinite alternate` }} />
        </div>
      ))}
    </>
  )
}

// ─── Splash phase: logo with sparkle ─────────────────────────────────────────

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M5 0 L6.2 4 L10 5 L6.2 6 L5 10 L3.8 6 L0 5 L3.8 4 Z" fill="#D7C596"/>
    </svg>
  )
}

function SplashLogo() {
  return (
    <div style={{ animation: 'logo-rise 1250ms ease-out forwards' }}>
      {/* Logo + sparkle ring */}
      <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Sparkle container: 340×340 centered on logo */}
        <div style={{ position: 'absolute', width: 340, height: 340, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
          {SPARKLE_RING.map((s, i) => {
            const x = 170 + Math.cos((s.angle * Math.PI) / 180) * s.r
            const y = 170 + Math.sin((s.angle * Math.PI) / 180) * s.r
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: y, animation: `sparkle 900ms ease-in-out ${s.delay}ms infinite` }}>
                <StarIcon />
              </div>
            )
          })}
        </div>
        {/* Logo — no frame, no background */}
        <img src={logoSrc} alt="Mr Brush & Co." style={{ width: 160, height: 160, objectFit: 'contain' }} />
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

/**
 * Three-phase splash:
 * loading (0–3 s) → washing (3–5 s, loads of light blue bubbles rise) → splash (5–6.5 s, logo + sparkle)
 */
export function SplashScreen() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('washing'), 3000)
    const t2 = setTimeout(() => setPhase('splash'),  5500)
    const t3 = setTimeout(() => navigate('/language'), 7200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [navigate])

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#FAFAF4' }}>

      {/* ① Green loading layer */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: '#2F4A3D',
          opacity: phase === 'loading' ? 1 : 0,
          transition: 'opacity 1200ms ease-out',
          zIndex: 10,
          pointerEvents: phase === 'loading' ? 'auto' : 'none',
        }}
      >
        <LoadingContent />
      </div>

      {/* ② Light blue bubbles float up, washing the screen */}
      {phase === 'washing' && <WashBubbles />}

      {/* ③ Logo + sparkle */}
      {phase === 'splash' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30 }}>
          <SplashLogo />
        </div>
      )}

    </div>
  )
}
