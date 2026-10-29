import { ArrowRight, Calculator, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicPage } from '../../components/PublicLayout'

const TOOLS = [
  { to: '/alat/kalkulator-budget', icon: Calculator, title: 'Kalkulator budget nikah', text: 'Bagi total budget ke kategori standar dan lihat 15 hidden cost yang sering terlupa.' },
  { to: '/alat/checklist', icon: ListChecks, title: 'Checklist persiapan', text: 'Daftar tugas H-12 bulan sampai hari-H, tanggalnya otomatis dari hari-H kalian.' },
]

export default function ToolsIndex() {
  return (
    <PublicPage>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Gratis · tanpa akun</p>
        <h1 className="mt-2 text-5xl font-semibold">Alat perencanaan gratis</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Langsung pakai tanpa daftar. Kalau cocok, simpan hasilnya ke rencana gratis kalian.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.to} to={t.to} className="card group flex flex-col p-6 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><t.icon className="size-6" aria-hidden /></div>
              <h2 className="mt-4 text-2xl font-semibold">{t.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Buka <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>
    </PublicPage>
  )
}
