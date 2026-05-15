import {
  MOCK_ZONE_STORE,
  getMockTodayJobs,
  getMockJobZones,
  MOCK_HISTORY_JOBS,
  MOCK_FACILITIES,
  MOCK_PROFILES,
  MOCK_CLEANING_LOGS,
  MOCK_SUPERVISOR_NOTIFICATIONS,
  MOCK_ISSUES,
} from './mockData'

// ─── Mock realtime channel ────────────────────────────────────────────────────

class MockChannel {
  on(_event: string, _filter: unknown, _cb: unknown): this { return this }
  subscribe(_cb?: unknown): this { return this }
}

// ─── Mutation builder — applies changes to MOCK_ZONE_STORE ────────────────────

class MockMutationBuilder {
  private _table: string
  private _op: 'insert' | 'update' | 'delete'
  private _data: Record<string, unknown>
  private _eqId: string | null = null

  constructor(table: string, op: 'insert' | 'update' | 'delete', data?: Record<string, unknown>) {
    this._table = table
    this._op    = op
    this._data  = data ?? {}
  }

  eq(col: string, val: unknown): this {
    if (col === 'id') this._eqId = String(val)
    return this
  }
  select(_cols?: string): this { return this }
  single(): this { return this }

  then<T>(
    onfulfilled: (val: { data: null; error: null }) => T,
    _onrejected?: ((reason: unknown) => T) | null,
  ): Promise<T> {
    this._apply()
    return Promise.resolve({ data: null, error: null }).then(onfulfilled)
  }

  private _apply() {
    if (this._table !== 'job_zones') return

    if (this._op === 'update' && this._eqId) {
      const zone = MOCK_ZONE_STORE.find(z => z.id === this._eqId)
      if (zone) Object.assign(zone, this._data)
    }

    if (this._op === 'insert') {
      MOCK_ZONE_STORE.push({
        id:         `zone-new-${Date.now()}`,
        zone_name:  String(this._data.zone_name  ?? 'New Zone'),
        status:     String(this._data.status     ?? 'not_started'),
        cleaner_id: (this._data.cleaner_id as string | null) ?? null,
        notes:      (this._data.notes      as string | null) ?? null,
      })
    }

    if (this._op === 'delete' && this._eqId) {
      const idx = MOCK_ZONE_STORE.findIndex(z => z.id === this._eqId)
      if (idx >= 0) MOCK_ZONE_STORE.splice(idx, 1)
    }
  }
}

// ─── Query builder ────────────────────────────────────────────────────────────

class MockQueryBuilder {
  private _table: string
  private _isHistorical = false
  private _isSingle     = false

  constructor(table: string) { this._table = table }

  select(_cols?: string): this { return this }
  eq(_col: string, _val: unknown): this { return this }
  neq(_col: string, _val: unknown): this { return this }
  in(_col: string, _vals: unknown[]): this { return this }
  gt(_col: string, _val: unknown): this { return this }
  gte(_col: string, _val: unknown): this { return this }
  lte(_col: string, _val: unknown): this { return this }
  order(_col: string, _opts?: Record<string, unknown>): this { return this }
  limit(_n: number): this { return this }

  single(): this {
    this._isSingle = true
    return this
  }

  lt(_col: string, _val: unknown): this {
    this._isHistorical = true
    return this
  }

  insert(data: unknown): MockMutationBuilder {
    return new MockMutationBuilder(this._table, 'insert', data as Record<string, unknown>)
  }
  update(data: unknown): MockMutationBuilder {
    return new MockMutationBuilder(this._table, 'update', data as Record<string, unknown>)
  }
  delete(): MockMutationBuilder {
    return new MockMutationBuilder(this._table, 'delete')
  }

  then<T>(
    onfulfilled: (val: { data: unknown; error: null }) => T,
    _onrejected?: ((reason: unknown) => T) | null,
  ): Promise<T> {
    const raw  = this._resolve()
    const data = this._isSingle
      ? (Array.isArray(raw) ? (raw[0] ?? null) : raw)
      : raw
    return Promise.resolve({ data, error: null }).then(onfulfilled)
  }

  private _resolve(): unknown {
    switch (this._table) {
      case 'jobs':                       return this._isHistorical ? MOCK_HISTORY_JOBS : getMockTodayJobs()
      case 'job_zones':                  return getMockJobZones()
      case 'facilities':                 return MOCK_FACILITIES
      case 'profiles':                   return MOCK_PROFILES
      case 'cleaning_logs':              return MOCK_CLEANING_LOGS
      case 'supervisor_notifications':   return MOCK_SUPERVISOR_NOTIFICATIONS
      case 'issues':                     return MOCK_ISSUES
      default:                           return []
    }
  }
}

// ─── Mock supabase client ─────────────────────────────────────────────────────

export const supabase = {
  from: (table: string) => new MockQueryBuilder(table),
  channel: (_name: string) => new MockChannel(),
  removeChannel: (_channel: unknown) => Promise.resolve('ok' as const),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (_event: unknown, _cb: unknown) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
}
