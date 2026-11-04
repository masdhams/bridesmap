// Mode demo: menampilkan salinan rencana contoh tanpa login, hanya untuk dilihat.
// Aktif per tab (sessionStorage), jadi tab lain dan data asli pengunjung tidak tersentuh.
import { create } from 'zustand'

const KEY = 'bridesmap-demo'

function readFlag() {
  if (typeof window === 'undefined') return false
  try {
    if (window.location.pathname === '/demo') sessionStorage.setItem(KEY, '1')
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Dibaca sekali saat aplikasi dimuat. Masuk lewat /demo, keluar lewat exitDemo(). */
export const DEMO = readFlag()

export function exitDemo() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
  window.location.href = '/app/panduan'
}

/** Waktu terakhir pengunjung mencoba mengubah data; dipakai untuk menampilkan pesan singkat. */
export const useDemoNotice = create<{ at: number }>(() => ({ at: 0 }))
export const notifyDemo = () => useDemoNotice.setState({ at: Date.now() })
