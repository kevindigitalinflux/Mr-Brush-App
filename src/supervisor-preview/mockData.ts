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

// ─── Mutable zone store (single source of truth for preview mutations) ────────

export const MOCK_ZONE_STORE: {
  id: string
  zone_name: string
  status: string
  cleaner_id: string | null
  notes: string | null
}[] = [
  { id: 'zone-001', zone_name: 'Main Reception',       status: 'completed',        cleaner_id: 'c0004-uuid', notes: null },
  { id: 'zone-002', zone_name: 'Executive Kitchen',    status: 'completed',        cleaner_id: 'c0002-uuid', notes: null },
  { id: 'zone-003', zone_name: 'Meeting Room A',       status: 'in_progress',      cleaner_id: 'c0003-uuid', notes: null },
  { id: 'zone-004', zone_name: 'Server Room B2',       status: 'not_started',      cleaner_id: null,         notes: null },
  { id: 'zone-005', zone_name: 'Ground Floor Toilets', status: 'flagged_no_photo', cleaner_id: 'c0004-uuid', notes: null },
]

// Returns today's jobs with the current zone store — called fresh on every query
export function getMockTodayJobs() {
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      id: 'job-today-001',
      facility_id: 'b1000000-0000-0000-0000-000000000001',
      status: 'in_progress',
      scheduled_date: today,
      facilities: { id: 'b1000000-0000-0000-0000-000000000001', name: 'Downtown Corporate Hub' },
      job_zones: MOCK_ZONE_STORE,
      cleaning_logs: [
        { id: 'log-001', status: 'pending_review' },
        { id: 'log-002', status: 'pending_review' },
        { id: 'log-003', status: 'pending_review' },
      ],
      profiles: null,
    },
  ]
}

// Returns zone list with the jobs join shape (for Workers page)
export function getMockJobZones() {
  const today = new Date().toISOString().slice(0, 10)
  return MOCK_ZONE_STORE
    .filter(z => z.cleaner_id !== null)
    .map(z => ({ ...z, jobs: { scheduled_date: today } }))
}

// Static snapshots kept for any direct imports that still exist
export const MOCK_TODAY_JOBS = getMockTodayJobs()
export const MOCK_JOB_ZONES  = getMockJobZones()

// ─── Mock cleaning logs for Evidence ─────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

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

// ─── Mock supervisor notifications ───────────────────────────────────────────

export const MOCK_SUPERVISOR_NOTIFICATIONS = [
  {
    id: 'sv-notif-001',
    created_at: `${today}T08:15:00Z`,
    client_name: 'Victoria Chan',
    client_company: 'Downtown Corporate Hub',
    message: 'Could you please confirm the executive bathroom is included in this week\'s deep clean? We have board members visiting Friday.',
    is_urgent: true,
    read: false,
  },
  {
    id: 'sv-notif-002',
    created_at: `${today}T07:02:00Z`,
    client_name: 'James Okafor',
    client_company: 'Downtown Corporate Hub',
    message: 'Great service yesterday — the lobby looked spotless. Please pass on our thanks to the team.',
    is_urgent: false,
    read: false,
  },
  {
    id: 'sv-notif-003',
    created_at: new Date(Date.now() - 86400000).toISOString().slice(0, 10) + 'T16:44:00Z',
    client_name: 'Dr. Sara Patel',
    client_company: 'Westside Medical Centre',
    message: 'Reminder: clinical zones require hospital-grade disinfectant only. Please ensure your team is briefed before next week\'s shift.',
    is_urgent: true,
    read: true,
  },
]

// ─── Mock client issues ───────────────────────────────────────────────────────

export const MOCK_ISSUES = [
  {
    id: 'issue-001',
    created_at: `${today}T07:30:00Z`,
    client_name: 'Victoria Chan',
    facility_name: 'Downtown Corporate Hub',
    title: 'Missed area in Meeting Room B',
    note: 'The whiteboard and conference table were not wiped down. Please ensure this is included going forward.',
    status: 'open' as const,
    photo_urls: ['https://picsum.photos/seed/issue-conf/400/300'],
  },
  {
    id: 'issue-002',
    created_at: new Date(Date.now() - 86400000).toISOString().slice(0, 10) + 'T14:20:00Z',
    client_name: 'James Okafor',
    facility_name: 'Downtown Corporate Hub',
    title: 'Residue left on kitchen countertops',
    note: 'There was visible residue on the kitchen surfaces after cleaning yesterday morning.',
    status: 'acknowledged' as const,
    photo_urls: [
      'https://picsum.photos/seed/issue-kitchen1/400/300',
      'https://picsum.photos/seed/issue-kitchen2/400/300',
    ],
  },
  {
    id: 'issue-003',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) + 'T09:10:00Z',
    client_name: 'Dr. Sara Patel',
    facility_name: 'Westside Medical Centre',
    title: 'Cleaning protocol not followed in Ward 3',
    note: 'Please confirm hospital-grade disinfectant was used in Ward 3. We noticed the wrong product in the cleaning log.',
    status: 'resolved' as const,
    photo_urls: [],
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
