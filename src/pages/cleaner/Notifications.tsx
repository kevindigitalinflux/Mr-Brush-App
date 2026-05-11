import { BottomNav } from '../../components/BottomNav'

function BellLargeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#C3C8C2" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#C3C8C2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Notifications screen — shows system and job alerts for the cleaner. */
export function Notifications() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-[100px]">

        {/* Header */}
        <div className="w-full px-6 pt-8 pb-4">
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19] leading-[38px]">
            Notifications
          </h2>
        </div>

        {/* Empty state */}
        <div className="w-full px-6 pt-16 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white border border-[#D0CFCA] flex items-center justify-center">
            <BellLargeIcon />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="font-['Poppins',sans-serif] font-semibold text-lg text-[#1A1C19] text-center">
              No notifications yet
            </p>
            <p className="font-['Lato',sans-serif] text-base text-[#6B5D36] text-center leading-[1.6] max-w-[280px]">
              Job updates and alerts from your supervisor will appear here.
            </p>
          </div>
        </div>

      </div>

      <BottomNav active="notifications" />
    </div>
  )
}
