import {
  MOCK_TODAY_JOBS,
  MOCK_HISTORY_JOBS,
  MOCK_FACILITIES,
  MOCK_PROFILES,
  MOCK_JOB_ZONES,
  MOCK_CLEANING_LOGS,
  MOCK_SUPERVISOR_NOTIFICATIONS,
  MOCK_ISSUES,
} from './mockData'

// ─── Mock realtime channel ────────────────────────────────────────────────────

class MockChannel {
  on(_event: string, _filter: unknown, _cb: unknown): this { return this }
  subscribe(_cb?: unknown): this { return this }
}

// ─── Mutation builder (insert / update / delete chains) ───────────────────────

class MockMutationBuilder {
  eq(_col: string, _val: unknown): this { return this }
  select(_cols?: string): this { return this }
  single(): this { return this }

  then<T>(
    onfulfilled: (val: { data: null; error: null }) => T,
    _onrejected?: ((reason: unknown) => T) | null,
  ): Promise<T> {
    return Promise.resolve({ data: null, error: null }).then(onfulfilled)
  }
}

// ─── Query builder ────────────────────────────────────────────────────────────

class MockQueryBuilder {
  private _table: string
  private _isHistorical = false
  private _isSingle = false

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

  insert(_data: unknown): MockMutationBuilder { return new MockMutationBuilder() }
  update(_data: unknown): MockMutationBuilder { return new MockMutationBuilder() }
  delete(): MockMutationBuilder { return new MockMutationBuilder() }

  then<T>(
    onfulfilled: (val: { data: unknown; error: null }) => T,
    _onrejected?: ((reason: unknown) => T) | null,
  ): Promise<T> {
    const data = this._resolveData()
    return Promise.resolve({ data, error: null }).then(onfulfilled)
  }

  private _resolveData(): unknown {
    const raw = this._getTableData()
    if (this._isSingle) {
      return Array.isArray(raw) ? (raw[0] ?? null) : raw
    }
    return raw
  }

  private _getTableData(): unknown {
    switch (this._table) {
      case 'jobs':                       return this._isHistorical ? MOCK_HISTORY_JOBS : MOCK_TODAY_JOBS
      case 'facilities':                 return MOCK_FACILITIES
      case 'profiles':                   return MOCK_PROFILES
      case 'job_zones':                  return MOCK_JOB_ZONES
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
