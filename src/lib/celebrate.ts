// Pita kecil yang memercik dari sebuah elemen, misalnya checkbox tugas yang baru dicentang.
// DOM biasa tanpa library: tiap pita satu <i> dengan arah acak, lalu dihapus setelah animasinya selesai.
const RIBBON_COLORS = ['#34432f', '#a9b59a', '#9a4e3b', '#e2a592', '#e5dccb', '#c9d0bc']

export function celebrate(from: Element | null, { big = false } = {}) {
  if (!from || typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const r = from.getBoundingClientRect()
  const layer = document.createElement('div')
  layer.className = 'ribbon-layer'
  layer.style.left = `${r.left + r.width / 2}px`
  layer.style.top = `${r.top + r.height / 2}px`
  const count = big ? 34 : 16
  const reach = big ? 150 : 70
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const d = reach * (0.55 + Math.random() * 0.6)
    const el = document.createElement('i')
    el.style.setProperty('--dx', `${Math.cos(a) * d}px`)
    el.style.setProperty('--dy', `${Math.sin(a) * d - reach * 0.35}px`)
    el.style.setProperty('--rot', `${Math.round(Math.random() * 540 - 270)}deg`)
    el.style.background = RIBBON_COLORS[i % RIBBON_COLORS.length]
    el.style.animationDelay = `${Math.random() * 60}ms`
    if (i % 3 === 0) el.style.borderRadius = '999px'
    layer.appendChild(el)
  }
  document.body.appendChild(layer)
  window.setTimeout(() => layer.remove(), big ? 1400 : 1000)
}
