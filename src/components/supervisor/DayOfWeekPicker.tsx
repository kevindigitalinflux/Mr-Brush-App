import { useTranslation } from '../../lib/useTranslation'

// Displayed Monday-first (more natural for a work schedule), even though
// the stored/emitted values use JS Date.getDay() convention (0=Sun..6=Sat).
const DISPLAY_ORDER: { day: number; labelKey: string }[] = [
  { day: 1, labelKey: 'sv_day_mon' },
  { day: 2, labelKey: 'sv_day_tue' },
  { day: 3, labelKey: 'sv_day_wed' },
  { day: 4, labelKey: 'sv_day_thu' },
  { day: 5, labelKey: 'sv_day_fri' },
  { day: 6, labelKey: 'sv_day_sat' },
  { day: 0, labelKey: 'sv_day_sun' },
]

interface DayOfWeekPickerProps {
  value: number[]
  onChange: (days: number[]) => void
}

/** Mon-first multi-select of weekdays. Emits/accepts JS Date.getDay() values (0=Sun..6=Sat). */
export function DayOfWeekPicker({ value, onChange }: DayOfWeekPickerProps) {
  const t = useTranslation()

  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort())
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DISPLAY_ORDER.map(({ day, labelKey }) => {
        const selected = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={[
              "w-11 h-11 rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[13px] border-2 transition-colors",
              selected
                ? 'bg-[#1A1C19] border-[#1A1C19] text-white'
                : 'border-[#C3C8C2] text-[#434844] bg-white hover:border-[#B8A77A]',
            ].join(' ')}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}
