import crypto from 'node:crypto'

const TTL_MS = 10 * 60 * 1000

const mac = (payload, key) => crypto.createHmac('sha256', key).update(payload).digest('base64url')

export function signState(userId, key) {
  const payload = Buffer.from(JSON.stringify({ u: userId, exp: Date.now() + TTL_MS, n: crypto.randomBytes(12).toString('hex') })).toString('base64url')
  return `${payload}.${mac(payload, key)}`
}

/** Mengembalikan id akun dari state yang ditandatangani, atau null kalau palsu atau kedaluwarsa. */
export function verifyState(state, key) {
  const [payload, sig] = String(state ?? '').split('.')
  if (!payload || !sig) return null
  const expected = mac(payload, key)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
  return exp >= Date.now() ? u : null
}
