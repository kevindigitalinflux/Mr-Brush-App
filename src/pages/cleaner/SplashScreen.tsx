import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Splash screen — static structure only. Animation sequence added separately. */
export function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    // ANIMATION HOOK — sequence goes here per design direction
    const timer = setTimeout(() => navigate('/language'), 2500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-[#FAFAF4]">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-white opacity-10 mix-blend-overlay pointer-events-none" />

      {/* Logo + brand — ANIMATION TARGET */}
      <div className="flex flex-col items-center gap-5 z-10">
        <div className="w-24 h-24 rounded-full bg-white border border-[#D0CFCA] shadow-sm flex items-center justify-center">
          {/* Logo asset — replace with <img src={logo} /> once asset is added */}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#3D3B3A] tracking-tight">
            Mr Brush &amp; Co.
          </span>
          <span className="font-['Lato',sans-serif] text-sm text-[#434B4D]">
            Cleaning Operations
          </span>
        </div>
      </div>

      {/* Three-dot loading indicator — ANIMATION TARGET */}
      <div className="absolute bottom-12 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#D7C596]" />
        <div className="w-3 h-3 rounded-full bg-[#D7C596] opacity-50" />
        <div className="w-3 h-3 rounded-full bg-[#D7C596] opacity-25" />
      </div>
    </div>
  )
}
