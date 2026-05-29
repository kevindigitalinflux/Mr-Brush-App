import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

interface Props {
  triggerClassName: string
  popoverSide?: 'below' | 'above'
  popoverAlign?: 'right' | 'left'
  children: React.ReactNode
}

/** Drop-in replacement for any sign-out button — shows a confirmation popover before signing out. */
export function SignOutConfirmButton({
  triggerClassName,
  popoverSide = 'below',
  popoverAlign = 'right',
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const { setUser } = useApp()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const sideClass = popoverSide === 'below' ? 'top-full mt-1' : 'bottom-full mb-1'
  const alignClass = popoverAlign === 'right' ? 'right-0' : 'left-0'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
        aria-label="Sign out"
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <div
          className={`absolute ${sideClass} ${alignClass} z-50 bg-white border border-[#D0CFCA] rounded-[12px] shadow-lg p-4 w-48`}
        >
          <p className="font-['Lato'] text-[12px] text-[#434B4D] mb-3 leading-relaxed">
            Sign out of your account?
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setUser(null); navigate('/login') }}
              className="w-full h-9 rounded-[8px] bg-[#3D3B3A] text-white font-['Lato'] text-[13px] font-semibold"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-9 rounded-[8px] bg-[#F0EFEA] text-[#434B4D] font-['Lato'] text-[13px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
