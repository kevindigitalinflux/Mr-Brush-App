import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { ImageViewer } from '../../components/ImageViewer'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueStatus = 'received' | 'acknowledged' | 'in_progress' | 'resolved'

interface ClientIssue {
  id: string
  created_at: string
  client_name: string
  facility_name: string
  title: string
  description: string
  note: string | null
  status: IssueStatus
  photo_urls: string[]
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<IssueStatus, string> = {
  received:     'bg-[#FDECEA] text-[#BA1A1A]',
  acknowledged: 'bg-[#FFF3D1] text-[#6F613A]',
  in_progress:  'bg-blue-50 text-blue-700',
  resolved:     'bg-[#D7E6DB] text-[#2F4A3D]',
}

const STATUS_LABELS: Record<IssueStatus, string> = {
  received:     'New',
  acknowledged: 'Acknowledged',
  in_progress:  'In Progress',
  resolved:     'Resolved',
}

function StatusPill({ status }: { status: IssueStatus }) {
  return (
    <span className={`font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ─── Issue ticket ─────────────────────────────────────────────────────────────

function IssueTicket({ issue }: { issue: ClientIssue }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<IssueStatus>(issue.status)
  const [localNote, setLocalNote] = useState<string>(issue.note ?? '')
  const [noteText, setNoteText] = useState<string>(issue.note ?? '')
  const [submitting, setSubmitting] = useState(false)

  const timeStr = new Date(issue.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(issue.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  async function handleAction(next: IssueStatus) {
    setSubmitting(true)
    const updates: Record<string, unknown> = { status: next }
    if (noteText.trim() && noteText.trim() !== localNote) updates.supervisor_note = noteText.trim()
    await supabase.from('complaints').update(updates).eq('id', issue.id)
    setLocalStatus(next)
    if (noteText.trim() && noteText.trim() !== localNote) setLocalNote(noteText.trim())
    setSubmitting(false)
  }

  async function handleSendNote() {
    const trimmed = noteText.trim()
    if (!trimmed || trimmed === localNote) return
    setSubmitting(true)
    await supabase.from('complaints').update({ supervisor_note: trimmed }).eq('id', issue.id)
    setLocalNote(trimmed)
    setSubmitting(false)
  }

  return (
    <div className="issue-ticket bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E3E3DD]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19] flex-1 min-w-0 pr-3 truncate">
            {issue.title}
          </h3>
          <StatusPill status={localStatus} />
        </div>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
          {issue.client_name} · {dateStr} at {timeStr}
        </p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#9E9E9E] mt-0.5">{issue.facility_name}</p>
      </div>

      {/* Photos */}
      {issue.photo_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-0">
          {issue.photo_urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="shrink-0 w-[120px] h-[90px] rounded-[8px] overflow-hidden bg-[#E3E3DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A]"
            >
              <img src={url} alt={`Issue photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="px-5 pt-4 pb-4">
        <p className="font-['Lato',sans-serif] text-[14px] text-[#434844] leading-relaxed">{issue.description}</p>
      </div>

      {/* Supervisor response */}
      <div className="px-5 pb-4">
        <label className="block font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] text-[#737874] uppercase mb-2">
          Response to client
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          placeholder="Add a note or update for the client…"
          className="w-full rounded-[10px] border border-[#D0CFCA] bg-[#F9F9F5] px-4 py-3 font-['Lato',sans-serif] text-[14px] text-[#3D3B3A] placeholder:text-[#B0AFA9] focus:outline-none focus:ring-2 focus:ring-[#B8A77A] resize-none"
        />
        {noteText.trim() && noteText.trim() !== localNote && (
          <button
            onClick={handleSendNote}
            disabled={submitting}
            className="mt-2 h-9 px-4 rounded-[8px] bg-[#F5F4EF] border border-[#D0CFCA] font-['Poppins',sans-serif] font-semibold text-[12px] text-[#3D3B3A] hover:bg-[#E8E7E2] transition-colors disabled:opacity-40"
          >
            {submitting ? 'Sending…' : 'Send Response'}
          </button>
        )}
      </div>

      {/* Action buttons */}
      {localStatus !== 'resolved' && (
        <div className="px-5 pb-5 pt-1 border-t border-[#E3E3DD] flex gap-2">
          {localStatus === 'received' && (
            <button
              onClick={() => handleAction('acknowledged')}
              disabled={submitting}
              className="flex-1 h-10 border-2 border-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#B8A77A] hover:bg-[#B8A77A] hover:text-white transition-colors disabled:opacity-40"
            >
              Acknowledge
            </button>
          )}
          {localStatus === 'acknowledged' && (
            <button
              onClick={() => handleAction('in_progress')}
              disabled={submitting}
              className="flex-1 h-10 border-2 border-blue-400 rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
            >
              Mark In Progress
            </button>
          )}
          <button
            onClick={() => handleAction('resolved')}
            disabled={submitting}
            className="flex-1 h-10 bg-[#2F4A3D] border-2 border-[#2F4A3D] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#253d31] transition-colors disabled:opacity-40"
          >
            Mark Resolved
          </button>
        </div>
      )}

      {lightbox && <ImageViewer src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Issues page ──────────────────────────────────────────────────────────────

/** Client complaint tickets — read, respond to, and resolve client complaints in real time. */
export function Issues() {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [issues, setIssues] = useState<ClientIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)

      // Get unique facility_ids for this supervisor via their jobs
      const { data: jobRows } = await supabase
        .from('jobs')
        .select('facility_id')
        .eq('supervisor_id', user!.id)

      const facilityIds = [...new Set((jobRows ?? []).map((j) => (j as { facility_id: string }).facility_id))]
      if (facilityIds.length === 0) { setIssues([]); setLoading(false); return }

      // Facility names
      const { data: facilityRows } = await supabase
        .from('facilities')
        .select('id, name')
        .in('id', facilityIds)

      const facilityMap: Record<string, string> = Object.fromEntries(
        (facilityRows ?? []).map((f) => {
          const row = f as { id: string; name: string }
          return [row.id, row.name]
        })
      )

      // Complaints for those facilities
      const { data: rows } = await supabase
        .from('complaints')
        .select('id, submitted_at, filed_by, facility_id, title, description, status, supervisor_note, photo_urls')
        .in('facility_id', facilityIds)
        .order('submitted_at', { ascending: false })

      if (!rows || rows.length === 0) { setIssues([]); setLoading(false); return }

      // Client names from profiles
      const filedByIds = [...new Set(rows.map((r) => (r as { filed_by: string }).filed_by))]
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', filedByIds)

      const profileMap: Record<string, string> = Object.fromEntries(
        (profileRows ?? []).map((p) => {
          const row = p as { id: string; name: string }
          return [row.id, row.name]
        })
      )

      setIssues(rows.map((r) => {
        const row = r as {
          id: string; submitted_at: string; filed_by: string; facility_id: string
          title: string; description: string; status: string
          supervisor_note: string | null; photo_urls: string[]
        }
        return {
          id: row.id,
          created_at: row.submitted_at,
          client_name: profileMap[row.filed_by] ?? 'Client',
          facility_name: facilityMap[row.facility_id] ?? 'Site',
          title: row.title,
          description: row.description,
          note: row.supervisor_note,
          status: row.status as IssueStatus,
          photo_urls: row.photo_urls ?? [],
        }
      }))
      setLoading(false)
    }

    void load()

    // Realtime — refresh list when any complaint changes
    const channel = supabase
      .channel('sv-issues-complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => { void load() })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.from('.issue-ticket', { opacity: 0, y: 16, duration: 0.4, stagger: 0.08, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
              {t('sv_issues_title')}
            </h1>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
              {t('sv_issues_subtitle')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-[280px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#B8A77A" strokeWidth="2" strokeLinejoin="round" />
                <path d="M12 9v4M12 17h.01" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_issues')}</p>
            <p className="font-['Lato',sans-serif] text-sm text-[#737874]">{t('sv_no_issues_body')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {issues.map((issue) => <IssueTicket key={issue.id} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  )
}
