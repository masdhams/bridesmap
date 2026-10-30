import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Field, Logo } from '../components/ui'
import { supabase } from '../lib/supabase'

export default function LupaSandi() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/masuk` })
    setBusy(false)
    if (error) {
      setError(/rate limit/i.test(error.message) ? 'Tautan baru saja dikirim. Tunggu beberapa menit, lalu coba lagi.' : 'Sepertinya ada kendala. Coba lagi sebentar, ya.')
      return
    }
    setSent(true)
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-6 text-3xl" />
      <section className="w-full max-w-md">
        <div className="card space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Lupa atau belum punya kata sandi?</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru. Cara ini juga berlaku untuk akun yang belum pernah punya kata sandi.
            </p>
          </div>

          {sent ? (
            <p className="rounded-2xl bg-primary-soft px-4 py-3 text-sm text-on-primary-soft" role="status">
              Kalau email ini terdaftar, tautannya sudah kami kirim. Cek kotak masuk atau folder spam, lalu buka tautannya dari perangkat ini.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Email" htmlFor="lupa-email">
                <input id="lupa-email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              {error && (
                <p className="text-sm text-danger-ink" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Sedang mengirim…' : 'Kirim tautan'}
              </button>
            </form>
          )}

          <p className="text-center text-sm">
            <Link to="/masuk" className="font-semibold text-primary underline-offset-4 hover:underline">
              Kembali ke halaman masuk
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
