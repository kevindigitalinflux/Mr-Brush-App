import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  jobs_completed?: number
  evidence_photos?: number
}

interface WeeklyReportRow {
  id: string
  facility_id: string
  week_start: string
  week_end: string
  total_zones_completed: number
  total_zones_flagged: number
  avg_rating: number | null
  report_data: ReportData | null
  facility_name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  const e = new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${s} – ${e}`
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ value, label, accent = 'brass' }: {
  value: string | number
  label: string
  accent?: 'brass' | 'green' | 'red'
}) {
  const colour = accent === 'green' ? 'text-[#2F4A3D]' : accent === 'red' ? 'text-red-500' : 'text-[#B8A77A]'
  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[12px] px-5 py-5 flex flex-col gap-1">
      <span className={`font-['Poppins',sans-serif] font-bold text-[32px] leading-none ${colour}`}>
        {value}
      </span>
      <span className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">{label}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Weekly cleaning report detail view for a specific report ID. */
export function WeeklyReport() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<WeeklyReportRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) { setLoading(false); return }
    void (async () => {
      const { data } = await supabase
        .from('weekly_reports')
        .select('id, facility_id, week_start, week_end, total_zones_completed, total_zones_flagged, avg_rating, report_data')
        .eq('id', reportId)
        .single()

      if (!data) { setLoading(false); return }

      const raw = data as Record<string, unknown>
      const rdRaw = raw.report_data
      const report_data: ReportData | null = typeof rdRaw === 'string'
        ? JSON.parse(rdRaw) as ReportData
        : rdRaw as ReportData | null

      const { data: fac } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', raw.facility_id as string)
        .single()

      setReport({
        ...(raw as unknown as Omit<WeeklyReportRow, 'facility_name' | 'report_data'>),
        report_data,
        facility_name: (fac as { name: string } | null)?.name ?? 'Facility',
      })
      setLoading(false)
    })()
  }, [reportId])

  const content = (
    <div className="max-w-[640px] mx-auto px-6 pt-10 pb-[100px] md:pb-10">

      {/* Back + header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => navigate('/client/overview')}
          aria-label="Back to overview"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="#3D3B3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="font-['Lato',sans-serif] text-[12px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-0.5">
            Weekly Report
          </p>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#3D3B3A] leading-tight">
            {loading ? 'Loading…' : report?.facility_name ?? 'Report'}
          </h1>
          {report && (
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-0.5">
              {formatDateRange(report.week_start, report.week_end)}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : !report ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#3D3B3A]">Report not found</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
            This report may have been removed or the link is invalid.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatTile value={report.report_data?.jobs_completed ?? 0} label="Jobs completed" accent="brass" />
            <StatTile value={report.total_zones_completed} label="Zones cleaned" accent="green" />
            <StatTile value={report.total_zones_flagged} label="Zones flagged" accent={report.total_zones_flagged > 0 ? 'red' : 'brass'} />
            <StatTile value={report.report_data?.evidence_photos ?? 0} label="Evidence photos" accent="brass" />
          </div>

          {report.avg_rating !== null && (
            <div className="bg-white border border-[#D0CFCA] rounded-[12px] px-5 py-5 flex items-center justify-between">
              <span className="font-['Lato',sans-serif] text-[14px] text-[#3D3B3A]">Average cleaner rating</span>
              <span className="font-['Poppins',sans-serif] font-bold text-[20px] text-[#B8A77A]">
                {Number(report.avg_rating).toFixed(1)} / 5
              </span>
            </div>
          )}

          <div className="bg-[#F5F4EF] border border-[#D0CFCA] rounded-[12px] px-5 py-4">
            <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
              This report was automatically compiled from all cleaning activity at{' '}
              <span className="font-bold text-[#3D3B3A]">{report.facility_name}</span>{' '}
              during the week of {formatDateRange(report.week_start, report.week_end)}.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden md:block">
        <ClientSidebar active="overview" complaintsCount={0} />
      </div>
      <div className="md:pl-60 min-h-screen bg-[#F5F4EF]">
        {content}
      </div>
      <div className="md:hidden">
        <ClientNav active="overview" complaintsCount={0} />
      </div>
    </>
  )
}
