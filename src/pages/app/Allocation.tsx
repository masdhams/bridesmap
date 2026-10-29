import { Link } from 'react-router-dom'
import { AllocationEditor } from '../../components/allocation'
import { PageHeader } from '../../components/ui'
import { usePlan } from '../../lib/store'

/** Halaman "Alokasi budget" (PRD #39): atur budget per acara dan per kategori, dalam persen atau Rupiah. */
export default function Allocation() {
  const s = usePlan()
  const reserved = s.categories.filter((c) => c.hidden).reduce((a, c) => a + c.allocated, 0)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader back="/app/budget" title="Alokasi budget" subtitle="Bagi total budget ke tiap acara, lalu ke tiap kategori. Angka awal hanyalah estimasi, bukan standar baku." />

      {s.events.length === 0 ? (
        <div className="card flex flex-col gap-3 p-6 text-sm text-body">
          <p>Rencana ini dibuat sebelum alokasi per acara tersedia, jadi belum ada daftar acara.</p>
          <Link to="/mulai" className="btn-primary self-start">
            Buat rencana baru dengan acara
          </Link>
        </div>
      ) : (
        <AllocationEditor
          total={s.profile.totalBudget}
          onTotal={s.setTotalBudget}
          reserved={reserved}
          events={s.events}
          categories={s.categories}
          onEventBudget={s.setEventBudget}
          onCategory={s.setCategoryAllocation}
          onReset={s.resetEventAllocation}
          onRemove={s.removeEvent}
          onAdd={(kind, name) => s.addEvent(kind, name)}
        />
      )}
    </div>
  )
}
