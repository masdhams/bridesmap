// Bahan bersama fitur "Surat untuk Nanti": amplop beranimasi, label tanggal, dan hitung mundur.
import { addYears, format, parseISO } from 'date-fns'
import { Heart, Lock } from 'lucide-react'
import type { TimeCapsule } from '../lib/types'
import { cn, daysUntil } from '../lib/utils'

export const letterPhotos = (c: TimeCapsule) => c.photos ?? (c.photo ? [c.photo] : [])
export const isReady = (c: TimeCapsule) => daysUntil(c.unlockDate) <= 0

/** Nama momen bila tanggalnya istimewa (hari-H, malam sebelum akad, anniversary); selain itu null. */
export function namedMoment(date: string, wedding: string): string | null {
  if (!wedding) return null
  if (date === wedding) return 'Hari-H'
  const w = parseISO(wedding)
  const prev = format(new Date(w.getTime() - 864e5), 'yyyy-MM-dd')
  if (date === prev) return 'Malam sebelum akad'
  for (let y = 1; y <= 25; y++) if (format(addYears(w, y), 'yyyy-MM-dd') === date) return `Ulang tahun pernikahan ke-${y}`
  return null
}

/** Label kecil di atas judul kartu: nama momen, atau "Surat untuk nanti" untuk tanggal biasa. */
export const momentTag = (date: string, wedding: string) => namedMoment(date, wedding) ?? 'Surat untuk nanti'

/** Hitung mundur dalam kata-kata: angka besar + keterangan kasar (bulan/minggu). */
export function countdown(date: string) {
  const days = Math.max(0, daysUntil(date))
  return {
    days,
    big: days === 0 ? 'Hari ini' : days === 1 ? 'Besok' : `${days} hari`,
    unit: days > 1 ? 'lagi' : '',
    rough: days >= 60 ? `± ${Math.round(days / 30)} bulan lagi` : days >= 14 ? `± ${Math.round(days / 7)} minggu lagi` : '',
  }
}

/** "Dari Rani untuk Dimas" / "untuk kita berdua" / "untuk diri sendiri". */
export function fromTo(c: TimeCapsule, name: (p: 'A' | 'B') => string) {
  const to = c.to ?? 'both'
  const target = to === 'both' ? 'kita berdua' : to === c.from ? 'diri sendiri' : name(to)
  return `Dari ${name(c.from)} untuk ${target}`
}

const PAPER_LINES = 'repeating-linear-gradient(transparent 0 9px, rgb(154 78 59 / 0.11) 9px 10px)'

/**
 * Amplop dari CSS. `open` mengatur urutan animasi lewat transisi:
 * membuka = segel lepas → tutup amplop terangkat → surat naik; menutup = kebalikannya.
 * `headroom` memberi ruang di atas supaya tutup amplop yang terbuka tidak terpotong.
 */
export function Envelope({ open = false, lock, headroom, className }: { open?: boolean; lock?: boolean; headroom?: boolean; className?: string }) {
  const ease = 'cubic-bezier(.4,0,.2,1)'
  return (
    <div aria-hidden className={cn('relative w-full', headroom && 'pt-[34%]', className)}>
      <div className="relative aspect-[3/2]" style={{ perspective: 1000 }}>
        {/* belakang amplop */}
        <div className="absolute inset-0" style={{ background: '#E4D6BB', borderRadius: '6% / 9%' }} />

        {/* surat di dalamnya */}
        <div
          className="absolute inset-x-[8%] bottom-[8%] top-[9%] rounded-[4px] bg-card shadow-[0_1px_3px_rgb(34_38_31/0.18)]"
          style={{
            zIndex: 10,
            backgroundImage: PAPER_LINES,
            backgroundPosition: '0 14px',
            transform: open ? 'translateY(-64%)' : 'translateY(0)',
            transition: `transform 900ms ${ease}`,
            transitionDelay: open ? '600ms' : '0ms',
          }}
        />

        {/* saku depan */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 20,
            background: 'linear-gradient(180deg, #F3EADA, #EADBC0)',
            clipPath: 'polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)',
            borderRadius: '0 0 6% 6% / 0 0 9% 9%',
          }}
        />

        {/* tutup amplop */}
        <div
          className="absolute inset-x-0 top-0 h-[56%]"
          style={{
            zIndex: open ? 5 : 30,
            transformOrigin: 'top',
            transform: open ? 'rotateX(180deg)' : 'rotateX(0)',
            background: open ? '#D8C7A6' : 'linear-gradient(180deg, #EADCC2, #E2D1B2)',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            transition: `transform 650ms ${ease}, background-color 300ms, z-index 0s linear`,
            transitionDelay: open ? '150ms, 150ms, 450ms' : '450ms, 450ms, 750ms',
          }}
        />

        {/* segel lilin */}
        <div className="absolute left-1/2 top-[54%] w-[17%] -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 40 }}>
          <div
            className="grid aspect-square w-full place-items-center rounded-full bg-accent text-white shadow-[0_2px_6px_rgb(122_59_43/0.45),inset_0_0_0_3px_rgb(255_255_255/0.14)]"
            style={{
              transform: open ? 'scale(0)' : 'scale(1)',
              opacity: open ? 0 : 1,
              transition: 'transform 350ms cubic-bezier(.34,1.56,.64,1), opacity 250ms',
              transitionDelay: open ? '0ms' : '1000ms',
            }}
          >
            {lock ? <Lock className="size-1/2" strokeWidth={2} /> : <Heart className="size-1/2 fill-white/90" strokeWidth={1.5} />}
          </div>
        </div>
      </div>
    </div>
  )
}
