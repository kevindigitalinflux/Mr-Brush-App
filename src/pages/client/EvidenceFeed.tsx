import { useRef } from 'react'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { gsap, useGSAP } from '../../lib/gsap'

/** Client portal — evidence feed screen. */
export function EvidenceFeed() {
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!pageRef.current) return
    gsap.from(pageRef.current, { opacity: 0, y: 18, duration: 0.45, ease: 'power2.out' })
  }, { dependencies: [] })

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <ClientSidebar active="evidence" />
      </div>

      {/* Page */}
      <div className="md:pl-60 min-h-screen bg-[#F5F4EF]">
        <div ref={pageRef} className="max-w-[900px] mx-auto px-6 py-8 pb-[88px] md:pb-8">

          <div className="mb-8">
            <p className="font-['Lato',sans-serif] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">
              Proof of Cleaning
            </p>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#3D3B3A] leading-tight">
              Evidence
            </h1>
          </div>

          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 text-center">
            <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#3D3B3A]">
              Evidence Feed — coming soon
            </p>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#434B4D] mt-1">
              Photo submissions from your cleaning team will appear here.
            </p>
          </div>

        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden">
        <ClientNav active="evidence" />
      </div>
    </>
  )
}
