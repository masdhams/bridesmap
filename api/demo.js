import { createClient } from '@supabase/supabase-js'

/** Salinan rencana contoh untuk mode demo (lihat saja). Isinya diperbarui manual di tabel demo_snapshot. */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.from('demo_snapshot').select('data').eq('id', 'default').maybeSingle()
  if (error) {
    console.error('[demo]', error)
    return res.status(500).json({ error: 'server_error' })
  }
  if (!data) return res.status(404).json({ error: 'not_found' })

  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  return res.status(200).json(data.data)
}
