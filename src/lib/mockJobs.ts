/** Shared job and zone data used across Home, ZoneList, ShiftCompleted, and ShiftHistory. */

export interface MockZone {
  id: string
  name: string
  description: string
}

export interface MockJob {
  id: string
  siteName: string
  clientName: string
  timeStart: string
  timeEnd: string
  zones: MockZone[]
}

export const MOCK_JOBS: MockJob[] = [
  {
    id: 'job-001',
    siteName: 'TechCorp HQ — Floor 3',
    clientName: 'TechCorp Industries',
    timeStart: '08:00 AM',
    timeEnd: '11:30 AM',
    zones: [
      { id: 'z1', name: 'Main Lobby',          description: 'High traffic area. Includes reception desk.' },
      { id: 'z2', name: 'Executive Washrooms',  description: 'Restock all supplies. Check mirrors.' },
      { id: 'z3', name: 'Conference Room A',    description: 'Wipe down large table, vacuum floors, empty bins.' },
      { id: 'z4', name: 'Open Plan Desks (N)',  description: 'Dust monitors, empty individual recycling.' },
      { id: 'z5', name: 'Break Room / Kitchen', description: 'Clean microwave interior, wipe counters, mop floor.' },
      { id: 'z6', name: 'Server Room',          description: 'Dust equipment surfaces, mop floor, empty bins.' },
    ],
  },
  {
    id: 'job-002',
    siteName: 'Midtown Financial — Lobby',
    clientName: 'Stirling & Co.',
    timeStart: '01:00 PM',
    timeEnd: '03:00 PM',
    zones: [
      { id: 'z7',  name: 'Main Entrance',      description: 'Sweep and mop entrance floor.' },
      { id: 'z8',  name: 'Reception Area',      description: 'Wipe desks, clean glass panels.' },
      { id: 'z9',  name: 'Lifts / Elevators',   description: 'Clean all lift interiors and buttons.' },
      { id: 'z10', name: 'Ground Floor WC',     description: 'Deep clean, restock supplies.' },
      { id: 'z11', name: 'Lobby Seating Area',  description: 'Vacuum sofas, wipe side tables.' },
      { id: 'z12', name: 'Security Desk Area',  description: 'Wipe surfaces, empty bins.' },
    ],
  },
]

/** Lookup zone name by ID across all jobs. */
export const ZONE_NAME_MAP: Record<string, string> = Object.fromEntries(
  MOCK_JOBS.flatMap(j => j.zones.map(z => [z.id, z.name]))
)
