import { Logo } from '../components/ui'
import { supabase } from '../lib/supabase'

export default function AksesBelumAktif() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-6 text-3xl" />
      <section className="w-full max-w-md">
        <div className="card space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Akses belum aktif</h1>
            <p className="text-sm text-muted-foreground">
              Akun ini belum punya akses Bridesmap. Kalau sudah membeli, masuk dengan email yang sama dengan saat checkout. Pembelian biasanya aktif dalam beberapa menit.
            </p>
          </div>
          <button className="btn-outline w-full" onClick={() => supabase.auth.signOut()}>
            Keluar
          </button>
        </div>
      </section>
    </main>
  )
}
