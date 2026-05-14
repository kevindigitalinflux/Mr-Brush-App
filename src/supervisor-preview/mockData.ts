// ─── Mock supervisor user ─────────────────────────────────────────────────────

export const MOCK_SUPERVISOR = {
  id: 'mock-supervisor-s0001',
  display_id: 'S0001',
  role: 'supervisor' as const,
  name: 'Orfa Martinez',
  language: 'en' as const,
  company_id: '7682d14f-fd74-4aed-919e-361f26608c40',
}

// ─── Mock facilities ──────────────────────────────────────────────────────────

export const MOCK_FACILITIES = [
  { id: 'b1000000-0000-0000-0000-000000000001', name: 'Downtown Corporate Hub' },
  { id: 'b2000000-0000-0000-0000-000000000002', name: 'Westside Medical Centre' },
]

// ─── Mock profiles (cleaners & replacement) ───────────────────────────────────

export const MOCK_PROFILES = [
  { id: 'c0001-uuid', display_id: 'C0001', full_name: 'Miguel Torres',       role: 'cleaner'             },
  { id: 'c0002-uuid', display_id: 'C0002', full_name: 'Iker Rodriguez',      role: 'cleaner'             },
  { id: 'c0003-uuid', display_id: 'C0003', full_name: 'Milagros Santos',     role: 'cleaner'             },
  { id: 'c0004-uuid', display_id: 'C0004', full_name: 'Kevin Zamora-Saenz',  role: 'cleaner'             },
  { id: 'r001-uuid',  display_id: 'R001',  full_name: 'Ze Roberto Mejia',    role: 'replacement_cleaner' },
]

// ─── Mock today's job ─────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

export const MOCK_TODAY_JOBS = [
  {
    id: 'job-today-001',
    status: 'in_progress',
    scheduled_date: today,
    facilities: { name: 'Downtown Corporate Hub' },
    job_zones: [
      { id: 'zone-001', zone_name: 'Main Reception',       status: 'completed',        cleaner_id: 'c0004-uuid' },
      { id: 'zone-002', zone_name: 'Executive Kitchen',    status: 'completed',        cleaner_id: 'c0002-uuid' },
      { id: 'zone-003', zone_name: 'Meeting Room A',       status: 'in_progress',      cleaner_id: 'c0003-uuid' },
      { id: 'zone-004', zone_name: 'Server Room B2',       status: 'not_started',      cleaner_id: null         },
      { id: 'zone-005', zone_name: 'Ground Floor Toilets', status: 'flagged_no_photo', cleaner_id: 'c0004-uuid' },
    ],
    cleaning_logs: [
      { id: 'log-001', status: 'pending_review' },
      { id: 'log-002', status: 'pending_review' },
      { id: 'log-003', status: 'pending_review' },
    ],
    profiles: null,
  },
]

// ─── Mock job zones for Workers page (today's assignments) ────────────────────

export const MOCK_JOB_ZONES = [
  { id: 'zone-001', cleaner_id: 'c0004-uuid', zone_name: 'Main Reception',       status: 'completed',        jobs: { scheduled_date: today } },
  { id: 'zone-002', cleaner_id: 'c0002-uuid', zone_name: 'Executive Kitchen',    status: 'completed',        jobs: { scheduled_date: today } },
  { id: 'zone-003', cleaner_id: 'c0003-uuid', zone_name: 'Meeting Room A',       status: 'in_progress',      jobs: { scheduled_date: today } },
  { id: 'zone-005', cleaner_id: 'c0004-uuid', zone_name: 'Ground Floor Toilets', status: 'flagged_no_photo', jobs: { scheduled_date: today } },
]

// ─── Mock cleaning logs for Evidence ─────────────────────────────────────────

export const MOCK_CLEANING_LOGS = [
  {
    id: 'log-001',
    job_id: 'job-today-001',
    created_at: `${today}T09:28:00Z`,
    note: null,
    note_translated: null,
    no_photo_reason: false,
    status: 'pending_review',
    profiles:      { full_name: 'Kevin Zamora-Saenz', display_id: 'C0004' },
    job_zones:     { zone_name: 'Main Reception' },
    evidence_files: [
      { public_url: 'https://picsum.photos/seed/reception1/400/300' },
      { public_url: 'https://picsum.photos/seed/desk1/400/300' },
      { public_url: 'https://picsum.photos/seed/lobby1/400/300' },
    ],
    feedback_comments: [],
  },
  {
    id: 'log-002',
    job_id: 'job-today-001',
    created_at: `${today}T10:14:00Z`,
    note: 'Cocina muy sucia inicialmente, limpiada a fondo y desinfectada.',
    note_translated: 'Kitchen was very dirty initially — thoroughly cleaned and disinfected.',
    no_photo_reason: false,
    status: 'pending_review',
    profiles:      { full_name: 'Iker Rodriguez', display_id: 'C0002' },
    job_zones:     { zone_name: 'Executive Kitchen' },
    evidence_files: [
      { public_url: 'https://picsum.photos/seed/kitchen1/400/300' },
      { public_url: 'https://picsum.photos/seed/kitchen2/400/300' },
    ],
    feedback_comments: [],
  },
  {
    id: 'log-003',
    job_id: 'job-today-001',
    created_at: `${today}T11:03:00Z`,
    note: 'Unable to photograph — restricted access per client security policy.',
    note_translated: null,
    no_photo_reason: true,
    status: 'pending_review',
    profiles:      { full_name: 'Kevin Zamora-Saenz', display_id: 'C0004' },
    job_zones:     { zone_name: 'Ground Floor Toilets' },
    evidence_files: [],
    feedback_comments: [],
  },
]

// ─── Mock history jobs ────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const MOCK_HISTORY_JOBS = [
  {
    id: 'job-hist-001', status: 'completed', scheduled_date: daysAgo(1),
    facilities: { name: 'Downtown Corporate Hub' },
    job_zones: Array.from({ length: 5 }, (_, i) => ({ id: `hz-${i}`, status: 'completed' })),
    profiles: { full_name: 'Orfa Martinez' },
  },
  {
    id: 'job-hist-002', status: 'completed', scheduled_date: daysAgo(2),
    facilities: { name: 'Westside Medical Centre' },
    job_zones: Array.from({ length: 6 }, (_, i) => ({ id: `hm-${i}`, status: 'completed' })),
    profiles: { full_name: 'Orfa Martinez' },
  },
  {
    id: 'job-hist-003', status: 'completed', scheduled_date: daysAgo(3),
    facilities: { name: 'Downtown Corporate Hub' },
    job_zones: [
      ...Array.from({ length: 4 }, (_, i) => ({ id: `hc-${i}`, status: 'completed' })),
      { id: 'hc-4', status: 'flagged_no_photo' },
    ],
    profiles: { full_name: 'Orfa Martinez' },
  },
  {
    id: 'job-hist-004', status: 'completed', scheduled_date: daysAgo(7),
    facilities: { name: 'Downtown Corporate Hub' },
    job_zones: Array.from({ length: 5 }, (_, i) => ({ id: `hd-${i}`, status: 'completed' })),
    profiles: { full_name: 'Orfa Martinez' },
  },
  {
    id: 'job-hist-005', status: 'completed', scheduled_date: daysAgo(8),
    facilities: { name: 'Westside Medical Centre' },
    job_zones: Array.from({ length: 6 }, (_, i) => ({ id: `he-${i}`, status: 'completed' })),
    profiles: { full_name: 'Orfa Martinez' },
  },
]
