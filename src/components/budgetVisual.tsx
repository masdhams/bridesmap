// Ikon dan warna per kategori budget (tampilan Ringkasan & Kategori di halaman Budget).
// Warna latar lembut + ikon berwarna gelap supaya kontrasnya cukup dan tetap senada dengan palet Melati/Sirih/Mawar.
import { IcAdmin, IcAttire, IcBudget, IcCatering, IcDecor, IcEntertainment, IcHiddenCost, IcHoneymoon, IcInvitation, IcPhoto, IcReserve, IcTransport, IcVenue, type AppIcon } from './icons'
import { cn } from '../lib/utils'

interface Visual {
  icon: AppIcon
  bg: string
  fg: string
}

const VISUALS: Record<string, Visual> = {
  venue: { icon: IcVenue, bg: '#F1DED7', fg: '#8A4433' },
  katering: { icon: IcCatering, bg: '#DFE6D6', fg: '#3F5236' },
  dekor: { icon: IcDecor, bg: '#F2E7CF', fg: '#7A5A1E' },
  mua: { icon: IcAttire, bg: '#EDDDE7', fg: '#74405F' },
  dokumentasi: { icon: IcPhoto, bg: '#DDE4E9', fg: '#3D5163' },
  undangan: { icon: IcInvitation, bg: '#E7E1EF', fg: '#56487A' },
  transport: { icon: IcTransport, bg: '#DCE8E5', fg: '#335A53' },
  admin: { icon: IcAdmin, bg: '#ECE5D8', fg: '#5F5238' },
  hiburan: { icon: IcEntertainment, bg: '#F4E0D6', fg: '#83432C' },
  cadangan: { icon: IcReserve, bg: '#E3E9D8', fg: '#4B5A35' },
  honeymoon: { icon: IcHoneymoon, bg: '#DCE7EE', fg: '#365B72' },
  hidden: { icon: IcHiddenCost, bg: 'var(--color-accent-soft)', fg: 'var(--color-accent)' },
  lainnya: { icon: IcBudget, bg: 'var(--color-muted)', fg: 'var(--color-body)' },
}

// Kategori lama/kustom tidak punya `key`; tebak dari namanya.
const BY_NAME: [RegExp, string][] = [
  [/venue|gedung/i, 'venue'],
  [/katering|catering/i, 'katering'],
  [/dekor|bunga/i, 'dekor'],
  [/mua|busana|rias|baju/i, 'mua'],
  [/dokumentasi|foto|video/i, 'dokumentasi'],
  [/undangan|cetak/i, 'undangan'],
  [/transport|akomodasi/i, 'transport'],
  [/administrasi|izin|kua/i, 'admin'],
  [/hiburan|musik|mc/i, 'hiburan'],
  [/cadangan/i, 'cadangan'],
  [/honeymoon|bulan madu/i, 'honeymoon'],
]

export function visualKey(c: { name: string; key?: string; hidden?: boolean }) {
  if (c.hidden) return 'hidden'
  if (c.key && VISUALS[c.key]) return c.key
  return BY_NAME.find(([re]) => re.test(c.name))?.[1] ?? 'lainnya'
}

export function CategoryIcon({ vkey, size = 44, className }: { vkey: string; size?: number; className?: string }) {
  const v = VISUALS[vkey] ?? VISUALS.lainnya
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-[14px]', className)} style={{ width: size, height: size, background: v.bg, color: v.fg }}>
      <v.icon style={{ width: size * 0.45, height: size * 0.45 }} strokeWidth={1.8} />
    </span>
  )
}
