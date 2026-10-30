import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Field, Logo } from '../components/ui'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { usePlan } from '../lib/store'

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email atau kata sandi belum sesuai. Coba periksa lagi, ya.',
  'User already registered': 'Email ini sudah terdaftar. Yuk, masuk menggunakan akunmu.',
  'Password should be at least 6 characters.': 'Kata sandi harus terdiri dari minimal 6 karakter.',
  'New password should be different from the old password.': 'Kata sandi baru harus berbeda dari yang lama.',
}

const FALLBACK_ERROR = 'Sepertinya ada kendala. Coba lagi sebentar, ya.'

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-6 text-3xl" />
      <section className="w-full max-w-md">
        <div className="card space-y-5 p-6">{children}</div>
      </section>
    </main>
  )
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        minLength={6}
        autoComplete={autoComplete}
        className="input pr-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        aria-pressed={show}
        className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-ink"
      >
        {show ? <EyeOff className="size-[18px]" strokeWidth={1.8} aria-hidden /> : <Eye className="size-[18px]" strokeWidth={1.8} aria-hidden />}
      </button>
    </div>
  )
}

/** Tampil setelah user membuka tautan "buat kata sandi baru" dari email. */
function NewPassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(ERRORS[error.message] ?? FALLBACK_ERROR)
      return
    }
    useAuth.setState({ recovery: false })
  }

  return (
    <AuthShell>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Buat kata sandi baru</h1>
        <p className="text-sm text-muted-foreground">Setelah disimpan, kamu bisa masuk dengan email dan kata sandi ini dari perangkat mana saja.</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Kata sandi baru" htmlFor="sandi-baru" hint="Gunakan minimal 6 karakter.">
          <PasswordInput id="sandi-baru" value={password} onChange={setPassword} autoComplete="new-password" />
        </Field>
        {error && (
          <p className="text-sm text-danger-ink" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Sedang menyimpan…' : 'Simpan dan lanjutkan'}
        </button>
      </form>
    </AuthShell>
  )
}

export default function Masuk() {
  const session = useAuth((s) => s.session)
  const ready = useAuth((s) => s.ready)
  const planReady = useAuth((s) => s.planReady)
  const recovery = useAuth((s) => s.recovery)
  const onboarded = usePlan((s) => s.profile.onboarded)
  const [params] = useSearchParams()
  const next = params.get('next')
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  if (recovery && session) return <NewPassword />

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
    <AuthShell>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">{mode === 'masuk' ? 'Lanjutkan rencana pernikahan kalian' : 'Mulai siapkan hari istimewa kalian'}</h1>
        <p className="text-sm text-muted-foreground">Simpan semua persiapan pernikahan kalian di satu tempat. Bisa dibuka kapan saja, dari perangkat mana saja.</p>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email" htmlFor="masuk-email">
          <input id="masuk-email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="space-y-2">
          <Field label="Kata sandi" htmlFor="masuk-password" hint={mode === 'daftar' ? 'Gunakan minimal 6 karakter.' : undefined}>
            <PasswordInput id="masuk-password" value={password} onChange={setPassword} autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} />
          </Field>
          {mode === 'masuk' && (
            <p className="text-right text-sm">
              <Link to="/lupa-sandi" className="font-semibold text-primary underline-offset-4 hover:underline">
                Lupa / belum punya kata sandi?
              </Link>
            </p>
          )}
        </div>
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

      <p className="border-t border-divider pt-4 text-center text-xs leading-relaxed text-muted-foreground">
        Dengan masuk, kalian menyetujui penyimpanan data rencana pernikahan di akun kalian.{' '}
        <Link to="/tentang#privasi" className="underline underline-offset-2 hover:text-ink">
          Baca kebijakan privasi
        </Link>
        .
      </p>
    </AuthShell>
  )
}
