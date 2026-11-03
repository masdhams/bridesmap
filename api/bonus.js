import { createClient } from '@supabase/supabase-js'

// Daftar file di bucket privat `bonus`. Nama harus sama persis dengan nama objek di Supabase Storage.
const FILES = new Set([
  'Vendor Negotiation Toolkit.pdf',
  'Vendor Negotiation Toolkit (Versi Cetak).pdf',
  'WhatsApp Vendor Templates.docx',
  'Vendor Comparison Worksheet.xlsx',
  'Final Vendor Checklist.pdf',
  'Wedding Budget Saving Playbook.pdf',
  'Wedding Budget Saving Playbook (Versi Cetak).pdf',
  'Wedding Budget Priority Worksheet.xlsx',
  '30 Wedding Saving Strategies.pdf',
  'Smart Budget Decision Worksheet.xlsx',
])

/** Mengembalikan link unduhan sementara (5 menit) untuk pembeli atau email di allowlist. */
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
  const { data: rows, error: queryError } = await admin.from('purchases').select('order_id').eq('email', email).limit(1)
  if (queryError) {
    console.error('[bonus]', queryError)
    return res.status(500).json({ error: 'server_error' })
  }
  let paid = (rows?.length ?? 0) > 0
  if (!paid) {
    const { data: allowed, error: allowError } = await admin.from('access_allowlist').select('email').eq('email', email).limit(1)
    if (allowError) {
      console.error('[bonus]', allowError)
      return res.status(500).json({ error: 'server_error' })
    }
    paid = (allowed?.length ?? 0) > 0
  }
  if (!paid) return res.status(403).json({ error: 'no_access' })

  const file = String(req.query?.file ?? '')
  if (!FILES.has(file)) return res.status(404).json({ error: 'not_found' })

  const { data: signed, error: signError } = await admin.storage.from('bonus').createSignedUrl(file, 300)
  if (signError || !signed?.signedUrl) {
    console.error('[bonus]', signError)
    return res.status(500).json({ error: 'server_error' })
  }
  return res.status(200).json({ url: signed.signedUrl })
}
