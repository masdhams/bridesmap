import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const MAX_AGE_SEC = 300

const readRaw = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

const verify = (raw, headers, secret) => {
  const sig = headers['x-webhook-signature'] || ''
  const ts = headers['x-webhook-timestamp'] || ''
  const m = /t=(\d+),v1=([0-9a-f]+)/.exec(sig)
  if (!m || m[1] !== ts) return false
  if (Math.abs(Date.now() / 1000 - Number(ts)) > MAX_AGE_SEC) return false
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex')
  const a = Buffer.from(m[2], 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const secret = process.env.ORDERHERO_WEBHOOK_SECRET
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const siteUrl = process.env.FRONTEND_URL || 'https://bridesmap.vercel.app'
  if (!secret || !url || !serviceKey || !anonKey) return res.status(500).json({ error: 'server_not_configured' })

  const raw = await readRaw(req)
  if (!verify(raw, req.headers, secret)) return res.status(401).json({ error: 'invalid_signature' })

  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return res.status(400).json({ error: 'invalid_json' })
  }

  if (event.test || event.data?.test) return res.status(200).json({ ok: true, test: true })
  if (event.event !== 'order_paid' || event.data?.payment_status !== 'paid') return res.status(200).json({ ignored: true })

  const orderId = event.data.order_id
  const email = String(event.data.customer_email || '').trim().toLowerCase()
  if (!orderId || !email.includes('@')) return res.status(400).json({ error: 'missing_order_or_email' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

  // Sengaja tanpa kata sandi: pembeli membuatnya sendiri lewat tautan di email.
  const { error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (createError && !/already|registered|exists/i.test(createError.message)) {
    console.error('[orderhero] createUser', createError)
    return res.status(500).json({ error: 'create_user_failed' })
  }

  const { error: mailError } = await anon.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/masuk` })
  if (mailError) {
    console.error('[orderhero] reset email', mailError)
    return res.status(500).json({ error: 'email_failed' })
  }

  // Dicatat terakhir supaya percobaan ulang (retry) dari OrderHero tetap aman untuk langkah di atas.
  const { error: insertError } = await admin.from('purchases').upsert(
    { order_id: orderId, email, amount: event.data.total_amount ?? null, paid_at: event.data.paid_at ?? new Date().toISOString() },
    { onConflict: 'order_id', ignoreDuplicates: true },
  )
  if (insertError) {
    console.error('[orderhero] purchases', insertError)
    return res.status(500).json({ error: 'record_failed' })
  }

  return res.status(200).json({ ok: true })
}
