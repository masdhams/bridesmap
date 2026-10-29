// Pemilih kategori budget dua langkah: pilih acara dulu, lalu kategori di acara itu.
// Menggantikan satu daftar panjang "Venue · Lamaran, Venue · Akad, …" yang sulit dicari.
import { usePlan } from '../lib/store'
import { Field } from './ui'
import { Select } from './select'

const UMUM = '__umum'
const HIDDEN = '__hidden'

export function CategoryPicker({ value, onChange, idPrefix = 'cp' }: { value: string | undefined; onChange: (categoryId: string) => void; idPrefix?: string }) {
  const { events, categories } = usePlan()
  const groupOf = (c: { eventId?: string; hidden?: boolean }) => (c.hidden ? HIDDEN : c.eventId && events.some((e) => e.id === c.eventId) ? c.eventId : UMUM)
  const current = categories.find((c) => c.id === value)
  const group = current ? groupOf(current) : (events[0]?.id ?? UMUM)

  const groups = [
    ...events.map((e) => ({ value: e.id, label: e.name })),
    ...(categories.some((c) => groupOf(c) === UMUM) ? [{ value: UMUM, label: events.length ? 'Umum (tanpa acara)' : 'Semua kategori' }] : []),
    ...(categories.some((c) => c.hidden) ? [{ value: HIDDEN, label: 'Hidden cost' }] : []),
  ]
  const inGroup = categories.filter((c) => groupOf(c) === group)

  // Ganti acara: pertahankan jenis kategori yang sama (mis. Venue) kalau ada di acara baru.
  const pickGroup = (g: string) => {
    const list = categories.filter((c) => groupOf(c) === g)
    const same = list.find((c) => (current?.key && c.key === current.key) || c.name === current?.name)
    const next = same ?? list[0]
    if (next) onChange(next.id)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.length > 1 && (
        <Field label="Acara" htmlFor={`${idPrefix}-acara`}>
          <Select id={`${idPrefix}-acara`} value={group} onChange={pickGroup} options={groups} />
        </Field>
      )}
      <Field label="Kategori" htmlFor={`${idPrefix}-kat`}>
        <Select id={`${idPrefix}-kat`} value={current ? current.id : ''} onChange={onChange} placeholder="Pilih kategori" options={inGroup.map((c) => ({ value: c.id, label: c.name }))} />
      </Field>
    </div>
  )
}
