import { accessToken } from './auth'

export interface CalendarStatus {
  connected: boolean
  calendarName?: string
  connectedAt?: string
}

export interface SyncTask {
  id: string
  title: string
  dueDate: string // yyyy-MM-dd
  reminderDaysBefore: number
}

export interface SyncResult {
  created: number
  updated: number
  unchanged: number
  deleted: number
  failed: { id: string; status: number | null }[]
}

/** Server belum jalan atau tidak membalas JSON. */
export class ServerOffline extends Error {
  constructor() {
    super('Server belum berjalan')
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const token = await accessToken()
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...init?.headers },
    })
  } catch {
    throw new ServerOffline()
  }
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) throw new ServerOffline()
  return { status: res.status, body: (await res.json()) as T }
}

export const calendarStatus = async () => (await call<CalendarStatus>('/api/calendar/status')).body

/** Minta URL persetujuan Google untuk akun yang sedang login, lalu alihkan browser ke sana. */
export async function connectCalendar() {
  const { status, body } = await call<{ url?: string; error?: string }>('/api/calendar/connect')
  if (status !== 200 || !body.url) throw new ServerOffline()
  window.location.href = body.url
}

export async function syncCalendar(tasks: SyncTask[]): Promise<{ result?: SyncResult; reconnect?: boolean; error?: string }> {
  const { status, body } = await call<SyncResult & { error?: string }>('/api/calendar/sync', { method: 'POST', body: JSON.stringify({ tasks }) })
  if (status === 401 || status === 409) return { reconnect: true }
  if (status !== 200) return { error: body.error ?? 'gagal' }
  return { result: body }
}

export const disconnectCalendar = () => call<CalendarStatus>('/api/calendar/disconnect', { method: 'DELETE' })
