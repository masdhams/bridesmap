import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NAV_GROUPS } from '../../components/nav'
import { PageHeader } from '../../components/ui'

export default function More() {
  return (
    <div>
      <PageHeader title="Semua fitur" />
      <div className="space-y-5">
        {NAV_GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 px-1 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{g.title}</h2>
            <ul className="card divide-y divide-border/60">
              {g.items.filter((i) => i.to !== '/app').map((i) => (
                <li key={i.to}>
                  <Link to={i.to} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><i.icon className="size-5" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{i.label}</span>
                      {i.desc && <span className="block truncate text-xs text-muted-foreground">{i.desc}</span>}
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
