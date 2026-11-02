import { accessToken, useAuth, type Access } from './auth'
import { supabase } from './supabase'
import { exportData, usePlan } from './store'

const SAVE_DELAY_MS = 800

let userId: string | null = null
let loaded = false
let applying = false
let timer: ReturnType<typeof setTimeout> | undefined

async function save() {
  clearTimeout(timer)
  timer = undefined
  if (!userId || !loaded) return
  const { error } = await supabase.from('plans').upsert({ user_id: userId, data: JSON.parse(exportData()), updated_at: new Date().toISOString() })
  if (error) console.error('[plan save]', error)
}

function schedule() {
  if (applying) return
  clearTimeout(timer)
  timer = setTimeout(save, SAVE_DELAY_MS)
}

async function load(uid: string) {
  const { data, error } = await supabase.from('plans').select('data').eq('user_id', uid).maybeSingle()
  if (error) {
    console.error('[plan load]', error)
    return
  }
  if (userId !== uid) return
  applying = true
  if (data) usePlan.getState().importData(JSON.stringify(data.data))
  applying = false
  loaded = true
  if (!data) await save()
}

async function checkAccess(): Promise<Access> {
  const token = await accessToken()
  if (!token) return 'denied'
  try {
    const res = await fetch('/api/access', { headers: { authorization: `Bearer ${token}` } })
    if (!res.ok) return 'denied'
    const body = (await res.json()) as { paid?: boolean }
    return body.paid ? 'granted' : 'denied'
  } catch {
    return 'denied'
  }
}

export function startPlanSync() {
  useAuth.subscribe(async ({ session, ready }) => {
    const uid = session?.user.id ?? null
    if (!ready || uid === userId) return
    userId = uid
    loaded = false
    useAuth.setState({ planReady: false, access: 'unknown' })
    clearTimeout(timer)
    if (uid) await load(uid)
    else usePlan.getState().reset()
    const access: Access = uid ? await checkAccess() : 'denied'
    if (userId === uid) useAuth.setState({ access, planReady: true })
  })
  usePlan.subscribe(schedule)
  window.addEventListener('pagehide', () => {
    if (timer) save()
  })
}
