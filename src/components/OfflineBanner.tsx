function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="#6F613A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" stroke="#6F613A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Sticky offline banner shown at the top of any screen when the device has no network. */
export function OfflineBanner() {
  return (
    <div className="sticky top-0 z-50 w-full bg-[#F1DEAD] border-b border-[#D7C596]/40 px-4 py-3 flex items-start gap-2">
      <WarningIcon />
      <p className="font-['Lato',sans-serif] text-sm text-[#6F613A] leading-[1.5]">
        <span className="font-bold">You're offline.</span> Submissions are being queued and will sync automatically when connected.
      </p>
    </div>
  )
}
