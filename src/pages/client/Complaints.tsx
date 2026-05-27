import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

type ComplaintStatus = 'received' | 'acknowledged' | 'in_progress' | 'resolved'

interface Complaint {
  id: string
  facilityId: string
  facilityName: string
  title: string
  description: string
  severity: number
  status: ComplaintStatus
  photoUrls: string[]
  submittedAt: string
  acknowledgedAt: string | null
  inProgressAt: string | null
  resolvedAt: string | null
  supervisorNote: string | null
}

interface FacilityOption { id: string; name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: ComplaintStatus[] = ['received', 'acknowledged', 'in_progress', 'resolved']

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  received: 'Received',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  received: 'bg-gray-100 text-[#434B4D]',
  acknowledged: 'bg-[#FDF6E3] text-[#B8A77A]',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-[#EEF6F1] text-[#2F4A3D]',
}

const SEVERITY_LABELS = ['', 'Minor', 'Low', 'Medium', 'High', 'Critical']

function severityBg(n: number): string {
  const map: Record<number, string> = {
    1: 'bg-[#EEF6F1] text-[#2F4A3D]',
    2: 'bg-[#F0F7EE] text-[#3A6B52]',
    3: 'bg-[#FDF6E3] text-[#B8A77A]',
    4: 'bg-[#FEF3C7] text-[#D97706]',
    5: 'bg-[#FEE2E2] text-[#DC2626]',
  }
  return map[n] ?? 'bg-gray-100 text-[#434B4D]'
}

// ─── Data hook ────────────────────────────────────────────────────────────────

interface ComplaintsState {
  loading: boolean
  complaints: Complaint[]
  facilities: FacilityOption[]
}

function useComplaintsData(): ComplaintsState & { reload: () => void } {
  const { user } = useApp()
  const [state, setState] = useState<ComplaintsState>({ loading: true, complaints: [], facilities: [] })

  const load = useCallback(async () => {
    if (!user) return

    const { data: memberships } = await supabase
      .from('client_org_members')
      .select('client_organisations ( facilities ( id, name ) )')
      .eq('profile_id', user.id)

    const facilities: FacilityOption[] = (memberships ?? []).flatMap((m) => {
      const orgs = (m as unknown as { client_organisations: { facilities: { id: string; name: string }[] } | null }).client_organisations
      return (orgs?.facilities ?? []).map((f) => ({ id: f.id, name: f.name }))
    })

    const facilityIds = facilities.map((f) => f.id)
    if (facilityIds.length === 0) { setState({ loading: false, complaints: [], facilities }); return }

    const facilityMap = Object.fromEntries(facilities.map((f) => [f.id, f.name]))

    const { data: rows } = await supabase
      .from('complaints')
      .select('id, facility_id, title, description, severity, status, photo_urls, submitted_at, acknowledged_at, in_progress_at, resolved_at, supervisor_note')
      .in('facility_id', facilityIds)
      .order('submitted_at', { ascending: false })

    const complaints: Complaint[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      facilityId: r.facility_id as string,
      facilityName: (facilityMap[r.facility_id as string]) ?? 'Site',
      title: (r.title as string) ?? '',
      description: (r.description as string) ?? '',
      severity: (r.severity as number) ?? 3,
      status: (r.status as ComplaintStatus),
      photoUrls: (r.photo_urls as string[]) ?? [],
      submittedAt: r.submitted_at as string,
      acknowledgedAt: r.acknowledged_at as string | null,
      inProgressAt: r.in_progress_at as string | null,
      resolvedAt: r.resolved_at as string | null,
      supervisorNote: r.supervisor_note as string | null,
    }))

    setState({ loading: false, complaints, facilities })
  }, [user])

  useEffect(() => { if (user) void load() }, [load, user])
  return { ...state, reload: load }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compressToDataUri(file: File, maxPx = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = blobUrl
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTs(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ n }: { n: number }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-['Lato'] font-bold tracking-[0.8px] uppercase px-2.5 py-1 rounded-full ${severityBg(n)}`}>
      {n} — {SEVERITY_LABELS[n]}
    </span>
  )
}

function StatusTimeline({ complaint }: { complaint: Complaint }) {
  const currentIdx = STATUS_ORDER.indexOf(complaint.status)
  const timestamps: Record<ComplaintStatus, string | null> = {
    received: complaint.submittedAt,
    acknowledged: complaint.acknowledgedAt,
    in_progress: complaint.inProgressAt,
    resolved: complaint.resolvedAt,
  }

  return (
    <div className="flex mt-4">
      {STATUS_ORDER.map((step, i) => {
        const reached = i <= currentIdx
        return (
          <div key={step} className="flex-1 flex flex-col items-center relative">
            {/* Left half of connector */}
            {i > 0 && (
              <div className={`absolute top-[8px] left-0 right-1/2 h-[2px] ${reached ? 'bg-[#B8A77A]' : 'bg-[#D0CFCA]'}`} />
            )}
            {/* Right half of connector */}
            {i < STATUS_ORDER.length - 1 && (
              <div className={`absolute top-[8px] left-1/2 right-0 h-[2px] ${i + 1 <= currentIdx ? 'bg-[#B8A77A]' : 'bg-[#D0CFCA]'}`} />
            )}
            {/* Dot */}
            <div className={`relative z-10 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${reached ? 'border-[#B8A77A] bg-[#B8A77A]' : 'border-[#D0CFCA] bg-white'}`}>
              {reached && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M1.5 5l3 3 4-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Label + time */}
            <div className="mt-1.5 text-center px-0.5">
              <p className={`font-['Lato'] text-[9px] font-bold tracking-[0.5px] uppercase leading-tight ${reached ? 'text-[#3D3B3A]' : 'text-[#D0CFCA]'}`}>
                {STATUS_LABELS[step]}
              </p>
              {timestamps[step] && (
                <p className="font-['Lato'] text-[9px] text-[#434B4D] mt-0.5 leading-tight">
                  {formatTs(timestamps[step])}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ComplaintCard({ complaint, onDelete }: { complaint: Complaint; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    void supabase.rpc('notify_complaint_event', {
      p_facility_id: complaint.facilityId,
      p_event: 'deleted',
      p_title: complaint.title,
    })
    await supabase.from('complaints').delete().eq('id', complaint.id)
    onDelete()
  }

  return (
    <div className="cl-cmp-card bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
      <div className="px-5 pt-5 pb-5 space-y-4">
        {/* Badges row + trash icon */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <SeverityBadge n={complaint.severity} />
              <span className={`text-[11px] font-['Lato'] font-bold uppercase tracking-[0.8px] px-2 py-0.5 rounded-full ${STATUS_COLORS[complaint.status]}`}>
                {STATUS_LABELS[complaint.status]}
              </span>
            </div>
            <p className="font-['Poppins'] font-semibold text-[14px] text-[#3D3B3A] leading-snug">
              {complaint.title}
            </p>
            <p className="font-['Lato'] text-[12px] text-[#434B4D] mt-0.5">
              {complaint.facilityName} · {formatDate(complaint.submittedAt)}
            </p>
          </div>
          <button
            onClick={() => setConfirmDelete((v) => !v)}
            aria-label="Delete complaint"
            className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              confirmDelete
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Timeline */}
        <StatusTimeline complaint={complaint} />

        {/* Divider */}
        <div className="border-t border-[#F0EFEA]" />

        {/* Description */}
        <p className="font-['Lato'] text-[13px] text-[#434B4D] leading-relaxed">{complaint.description}</p>

        {/* Photos */}
        {complaint.photoUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {complaint.photoUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-[8px] border border-[#D0CFCA]" />
            ))}
          </div>
        )}

        {/* Supervisor response */}
        {complaint.supervisorNote && (
          <div className="bg-[#F5F4EF] rounded-[8px] p-3">
            <p className="font-['Lato'] text-[11px] font-bold text-[#B8A77A] uppercase tracking-[0.8px] mb-1">
              Supervisor Response
            </p>
            <p className="font-['Lato'] text-[13px] text-[#3D3B3A] leading-relaxed">
              {complaint.supervisorNote}
            </p>
          </div>
        )}
      </div>

      {/* Inline delete confirmation */}
      {confirmDelete && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#F0EFEA] bg-[#FEF2F2]">
          <p className="font-['Lato'] text-[12px] text-[#DC2626]">Remove this complaint?</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-['Lato'] text-[12px] font-bold text-[#434B4D]"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="font-['Lato'] text-[12px] font-bold text-white bg-[#DC2626] px-3 py-1.5 rounded-[8px] disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── New Complaint Modal ───────────────────────────────────────────────────────

interface ModalForm {
  facilityId: string
  title: string
  description: string
  severity: number
  photos: File[]
  previews: string[]
  submitting: boolean
  error: string | null
  success: boolean
}

function NewComplaintModal({
  facilities, userId, companyId, onClose, onSubmitted,
}: {
  facilities: FacilityOption[]
  userId: string
  companyId: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const [form, setForm] = useState<ModalForm>({
    facilityId: facilities[0]?.id ?? '',
    title: '', description: '', severity: 3,
    photos: [], previews: [], submitting: false, error: null, success: false,
  })
  const fileRef = useRef<HTMLInputElement>(null)

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - form.photos.length)
    const previews = files.map((f) => URL.createObjectURL(f))
    setForm((s) => ({
      ...s,
      photos: [...s.photos, ...files].slice(0, 3),
      previews: [...s.previews, ...previews].slice(0, 3),
    }))
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setForm((s) => ({
      ...s,
      photos: s.photos.filter((_, idx) => idx !== i),
      previews: s.previews.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setForm((s) => ({ ...s, error: 'Please enter a title.' })); return }
    if (!form.description.trim()) { setForm((s) => ({ ...s, error: 'Please describe the issue.' })); return }
    if (!form.facilityId) { setForm((s) => ({ ...s, error: 'Please select a facility.' })); return }

    setForm((s) => ({ ...s, submitting: true, error: null }))
    try {
      const uploadedUrls = await Promise.all(form.photos.map((f) => compressToDataUri(f)))

      const { error: insertErr } = await supabase.from('complaints').insert({
        facility_id: form.facilityId,
        filed_by: userId,
        company_id: companyId,
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        status: 'received',
        photo_urls: uploadedUrls,
      })
      if (insertErr) throw insertErr

      void supabase.rpc('notify_complaint_event', {
        p_facility_id: form.facilityId,
        p_event: 'filed',
        p_title: form.title.trim(),
      })

      setForm((s) => ({ ...s, submitting: false, success: true }))
      setTimeout(() => { onSubmitted(); onClose() }, 1800)
    } catch {
      setForm((s) => ({ ...s, submitting: false, error: 'Could not submit complaint. Try again.' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-8 bg-black/40">
      <div className="w-full max-w-[520px] bg-[#F5F4EF] rounded-t-[20px] md:rounded-[16px] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#D0CFCA]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="#3D3B3A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="font-['Lato'] text-[11px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase">
              Issues & Resolutions
            </p>
            <h2 className="font-['Poppins'] font-bold text-[20px] text-[#3D3B3A] leading-tight">
              File a Complaint
            </h2>
          </div>
        </div>

        {/* Success */}
        {form.success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-[#EEF6F1] flex items-center justify-center text-[#2F4A3D]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-['Poppins'] font-semibold text-[16px] text-[#3D3B3A]">Complaint Submitted</p>
              <p className="font-['Lato'] text-[13px] text-[#434B4D] mt-1">
                Your complaint has been received and will be reviewed shortly.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5">
            {/* Facility */}
            {facilities.length > 1 && (
              <div>
                <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                  Facility
                </label>
                <select
                  value={form.facilityId}
                  onChange={(e) => setForm((s) => ({ ...s, facilityId: e.target.value }))}
                  className="w-full h-[52px] rounded-[12px] border border-[#D0CFCA] bg-white px-4 font-['Lato'] text-[14px] text-[#3D3B3A] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Severity */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                Severity
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, severity: n }))}
                    className={`flex-1 h-11 rounded-[10px] border-2 font-['Poppins'] font-bold text-[15px] transition-colors ${
                      form.severity === n
                        ? n >= 4
                          ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]'
                          : n === 3
                            ? 'border-[#B8A77A] bg-[#FDF6E3] text-[#B8A77A]'
                            : 'border-[#2F4A3D] bg-[#EEF6F1] text-[#2F4A3D]'
                        : 'border-[#D0CFCA] bg-white text-[#434B4D]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="font-['Lato'] text-[12px] text-[#434B4D] mt-1.5 text-center">
                {SEVERITY_LABELS[form.severity]}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full h-[52px] rounded-[12px] border border-[#D0CFCA] bg-white px-4 font-['Lato'] text-[14px] text-[#3D3B3A] placeholder:text-[#D0CFCA] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={4}
                placeholder="Please describe the issue in detail…"
                className="w-full rounded-[12px] border border-[#D0CFCA] bg-white px-4 py-3 font-['Lato'] text-[14px] text-[#3D3B3A] placeholder:text-[#D0CFCA] focus:outline-none focus:ring-2 focus:ring-[#B8A77A] resize-none"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                Supporting Photos{' '}
                <span className="normal-case tracking-normal font-normal text-[#B8A77A]">(optional, up to 3)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {form.previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-[8px] border border-[#D0CFCA]" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#3D3B3A] flex items-center justify-center"
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1 1l8 8M9 1L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {form.photos.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-[8px] border-2 border-dashed border-[#D0CFCA] flex flex-col items-center justify-center gap-1 text-[#B8A77A] hover:border-[#B8A77A] transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="font-['Lato'] text-[9px] font-bold uppercase tracking-[0.5px]">Photo</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickPhoto} />
              </div>
            </div>

            {/* Error */}
            {form.error && (
              <p className="font-['Lato'] text-[13px] text-red-600">{form.error}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={form.submitting}
              className="w-full h-[56px] rounded-[12px] bg-[#3D3B3A] text-white font-['Poppins'] font-semibold text-[15px] disabled:opacity-50 transition-opacity"
            >
              {form.submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Client portal — complaint filing and status tracking screen. */
export function Complaints() {
  const { user } = useApp()
  const { loading, complaints, facilities, reload } = useComplaintsData()
  const [showModal, setShowModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const progressCount = complaints.filter((c) => c.status !== 'received').length

  useGSAP(() => {
    if (!containerRef.current || loading || complaints.length === 0) return
    gsap.from('.cl-cmp-card', { opacity: 0, y: 16, duration: 0.4, stagger: 0.07, ease: 'power2.out', clearProps: 'all' })
  }, { scope: containerRef, dependencies: [loading] })

  const content = (
    <div ref={containerRef} className="max-w-[900px] mx-auto px-6 py-8 pb-[88px] md:pb-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-['Lato'] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">
            Issues & Resolutions
          </p>
          <h1 className="font-['Poppins'] font-bold text-[26px] text-[#3D3B3A] leading-tight">Complaints</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 rounded-[10px] bg-[#3D3B3A] text-white font-['Poppins'] font-semibold text-[13px] shrink-0 hover:bg-[#2a2928] transition-colors"
        >
          + File Complaint
        </button>
      </div>

      {/* Summary pill */}
      {!loading && progressCount > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="font-['Lato'] text-[12px] text-[#434B4D]">
            {progressCount} complaint{progressCount > 1 ? 's' : ''} with updates from your supervisor
          </span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-[12px] bg-white border border-[#D0CFCA] animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins'] font-semibold text-[15px] text-[#3D3B3A]">No complaints filed</p>
          <p className="font-['Lato'] text-[13px] text-[#434B4D] mt-1">
            Use the button above to report an issue with your cleaning service.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => <ComplaintCard key={c.id} complaint={c} onDelete={() => void reload()} />)}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden md:block">
        <ClientSidebar active="complaints" complaintsCount={progressCount} />
      </div>

      <div className="md:pl-60 min-h-screen bg-[#F5F4EF]">
        {content}
      </div>

      <div className="md:hidden">
        <ClientNav active="complaints" complaintsCount={progressCount} />
      </div>

      {showModal && user && (
        <NewComplaintModal
          facilities={facilities}
          userId={user.id}
          companyId={user.company_id}
          onClose={() => setShowModal(false)}
          onSubmitted={() => void reload()}
        />
      )}
    </>
  )
}
