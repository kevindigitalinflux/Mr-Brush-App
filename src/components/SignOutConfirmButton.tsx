import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

interface Props {
  triggerClassName: string
  popoverSide?: 'below' | 'above'
  popoverAlign?: 'right' | 'left'
  children: React.ReactNode
}

/** Sign-out button that shows a confirmation popover before signing out.
 *  Uses a portal so the popover always renders above navbars and stacking contexts. */
export function SignOutConfirmButton({
  triggerClassName,
  popoverSide = 'below',
  popoverAlign = 'right',
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const { setUser } = useApp()
  const navigate = useNavigate()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  function handleClick() {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect())
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const popoverStyle: React.CSSProperties = rect ? {
    position: 'fixed',
    zIndex: 9999,
    width: '192px',
    ...(popoverSide === 'below'
      ? { top: rect.bottom + 4 }
      : { bottom: window.innerHeight - rect.top + 4 }),
    ...(popoverAlign === 'right'
      ? { right: window.innerWidth - rect.right }
      : { left: rect.left }),
  } : {}

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        className={triggerClassName}
        aria-label="Sign out"
        aria-expanded={open}
      >
        {children}
      </button>
      {open && rect && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="bg-white border border-[#D0CFCA] rounded-[12px] shadow-lg p-4"
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
        </div>,
        document.body
      )}
    </>
  )
}
