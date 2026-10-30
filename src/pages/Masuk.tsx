import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Field, Logo } from '../components/ui'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { usePlan } from '../lib/store'

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email atau kata sandi belum sesuai. Coba periksa lagi, ya.',
  'User already registered': 'Email ini sudah terdaftar. Yuk, masuk menggunakan akunmu.',
  'Password should be at least 6 characters.': 'Kata sandi harus terdiri dari minimal 6 karakter.',
}

const FALLBACK_ERROR = 'Sepertinya ada kendala. Coba lagi sebentar, ya.'

export default function Masuk() {
  const session = useAuth((s) => s.session)
  const ready = useAuth((s) => s.ready)
  const planReady = useAuth((s) => s.planReady)
  const onboarded = usePlan((s) => s.profile.onboarded)
  const [params] = useSearchParams()
  const next = params.get('next')
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  if (ready && session && planReady) {
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
    return <Navigate to={safeNext ?? (onboarded ? '/app' : '/mulai')} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const result =
      mode === 'masuk'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${location.origin}/masuk` } })
    setBusy(false)
    if (result.error) {
      setMsg({ text: ERRORS[result.error.message] ?? FALLBACK_ERROR, ok: false })
      return
    }
    if (mode === 'daftar' && !result.data.session) setMsg({ text: 'Kami sudah mengirim email konfirmasi. Buka emailmu untuk mengonfirmasi akun, lalu kembali ke sini untuk masuk.', ok: true })
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-6 text-3xl" />
      <section className="w-full max-w-md">
        <div className="card p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">{mode === 'masuk' ? 'Lanjutkan rencana pernikahan kalian' : 'Mulai siapkan hari istimewa kalian'}</h1>
            <p className="text-sm text-muted-foreground">Simpan semua persiapan pernikahan kalian di satu tempat. Bisa dibuka kapan saja, dari perangkat mana saja.</p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <Field label="Email" htmlFor="masuk-email">
              <input id="masuk-email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Kata sandi" htmlFor="masuk-password" hint={mode === 'daftar' ? 'Gunakan minimal 6 karakter.' : undefined}>
              <input
                id="masuk-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {msg && (
              <p className={msg.ok ? 'text-sm text-success' : 'text-sm text-danger-ink'} role="status">
                {msg.text}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sedang menyiapkan…' : mode === 'masuk' ? 'Masuk' : 'Buat akun'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'masuk' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === 'masuk' ? 'daftar' : 'masuk')}>
              {mode === 'masuk' ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
