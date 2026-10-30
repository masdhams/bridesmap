// Foto sampul untuk kartu berwarna gelap (hitung mundur Beranda, Honeymoon).
// Beranda: foto di bawah lapisan hijau tipis (tetap terlihat). Honeymoon (`full`): foto penuh warna.
// Potongan foto bisa diatur lewat titik fokus (PhotoPos) supaya wajah tidak terpotong.
import { Camera, Crop, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PhotoPos } from '../lib/types'
import { cn, compressImage } from '../lib/utils'
import { Modal } from './ui'

/** Titik fokus bawaan: sedikit di atas tengah, karena wajah biasanya ada di bagian atas foto. */
export const DEFAULT_POS: PhotoPos = { x: 50, y: 28 }
const objPos = (p?: PhotoPos) => `${(p ?? DEFAULT_POS).x}% ${(p ?? DEFAULT_POS).y}%`

/** Lapisan foto di belakang konten kartu. Letakkan sebagai anak pertama di kartu yang `relative overflow-hidden`. */
export function CoverLayer({ src, pos, full }: { src?: string; pos?: PhotoPos; full?: boolean }) {
  if (!src) return null
  const img = <img src={src} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover" style={{ objectPosition: objPos(pos) }} />
  // `full`: foto tampil penuh warna; hanya ada bayangan tipis di bawah agar teks tetap terbaca.
  if (full) {
    return (
      <>
        {img}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/60 to-transparent" />
      </>
    )
  }
  return (
    <>
      {img}
      {/* Hijau Sirih dibuat tipis: foto tetap terlihat, sedikit lebih pekat di bawah untuk teks. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/45 to-primary/25" />
    </>
  )
}

/** Tombol kecil di pojok kartu: unggah, ganti, atur posisi, atau hapus foto sampul. */
/** `menuUp`: menu terbuka ke atas, untuk tombol di bagian bawah wadah yang memotong isinya (overflow-hidden). */
export function CoverButton({ src, pos, onChange, onPos, label = 'foto sampul', className, menuUp }: { src?: string; pos?: PhotoPos; onChange: (src?: string) => void; onPos?: (p: PhotoPos) => void; label?: string; className?: string; menuUp?: boolean }) {
  const [menu, setMenu] = useState(false)
  const [adjust, setAdjust] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const p = pos ?? DEFAULT_POS

  useEffect(() => {
    if (!menu) return
    const off = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setMenu(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('pointerdown', off)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', off)
      document.removeEventListener('keydown', esc)
    }
  }, [menu])

  const pick = () => {
    setMenu(false)
    input.current?.click()
  }

  const item = 'flex min-h-10 w-full items-center gap-2 rounded-[10px] px-3 text-left text-sm hover:bg-muted'
  return (
    <div ref={wrap} className={cn('relative z-10', className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          if (src) setMenu((m) => !m)
          else pick()
        }}
        aria-label={src ? `Ubah ${label}` : `Tambah ${label}`}
        aria-expanded={src ? menu : undefined}
        className="grid size-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
      >
        {src ? <Camera className="size-4" strokeWidth={1.8} aria-hidden /> : <ImagePlus className="size-4" strokeWidth={1.8} aria-hidden />}
      </button>
      {menu && (
        <div role="menu" className={cn('absolute right-0 w-48 rounded-[14px] border border-border bg-card p-1 text-ink shadow-[var(--shadow-lift)]', menuUp ? 'bottom-11' : 'top-11')}>
          <button role="menuitem" type="button" className={item} onClick={pick}>
            <Camera className="size-4" aria-hidden /> Ganti foto
          </button>
          {onPos && (
            <button role="menuitem" type="button" className={item} onClick={() => { setMenu(false); setAdjust(true) }}>
              <Crop className="size-4" aria-hidden /> Atur posisi
            </button>
          )}
          <button role="menuitem" type="button" className={cn(item, 'text-destructive')} onClick={() => { setMenu(false); onChange(undefined) }}>
            <Trash2 className="size-4" aria-hidden /> Hapus foto
          </button>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Pilih ${label}`}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) {
            onChange(await compressImage(f, 1200, 0.7))
            onPos?.(DEFAULT_POS) // foto baru: kembali ke posisi bawaan
          }
          e.target.value = ''
        }}
      />
      {onPos && (
        <Modal open={adjust} onClose={() => setAdjust(false)} title="Atur posisi foto" footer={<button className="btn-primary" onClick={() => setAdjust(false)}>Selesai</button>}>
          <p className="text-sm text-body">Geser untuk memilih bagian foto yang tampil di kartu. Preview di bawah mengikuti bentuk kartu.</p>
          <div className="relative h-44 overflow-hidden rounded-[20px] bg-primary">
            {src && <img src={src} alt="" className="size-full object-cover" style={{ objectPosition: objPos(p) }} />}
          </div>
          <label className="block">
            <span className="label">Kiri – kanan</span>
            <input type="range" min={0} max={100} value={p.x} onChange={(e) => onPos({ ...p, x: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" />
          </label>
          <label className="block">
            <span className="label">Atas – bawah</span>
            <input type="range" min={0} max={100} value={p.y} onChange={(e) => onPos({ ...p, y: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" />
          </label>
        </Modal>
      )}
    </div>
  )
}
