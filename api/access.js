import { createClient } from '@supabase/supabase-js'

const allowlist = () =>
  (process.env.ACCESS_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })

  const token = req.headers.authorization?.replace(/^Bearer /, '')
  if (!token) return res.status(401).json({ error: 'unauthorized' })

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user?.email) return res.status(401).json({ error: 'unauthorized' })

  const email = data.user.email.toLowerCase()
  if (allowlist().includes(email)) return res.status(200).json({ paid: true })

  const { data: rows, error: queryError } = await admin.from('purchases').select('order_id').eq('email', email).limit(1)
  if (queryError) {
    console.error('[access]', queryError)
    return res.status(500).json({ error: 'server_error' })
  }
  return res.status(200).json({ paid: (rows?.length ?? 0) > 0 })
}
