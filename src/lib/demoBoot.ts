import type { Session } from '@supabase/supabase-js'
import { useAuth } from './auth'
import { exitDemo } from './demo'
import { usePlan } from './store'

/** Sesi palsu supaya halaman yang butuh login bisa dibuka di mode demo. Tidak dipakai untuk memanggil server. */
const DEMO_SESSION = { access_token: '', user: { id: 'demo', email: 'Mode demo' } } as unknown as Session

/** Memuat salinan rencana contoh ke memori, lalu membuka halaman aplikasi. */
export async function bootDemo() {
  useAuth.setState({ session: DEMO_SESSION, ready: true, planReady: false, access: 'granted' })
  if (window.location.pathname === '/demo') window.history.replaceState(null, '', '/app')
  try {
    const res = await fetch('/api/demo')
    if (!res.ok) throw new Error(String(res.status))
    // setState langsung: aksi di store sengaja dikunci di mode demo.
    usePlan.setState(await res.json())
    useAuth.setState({ planReady: true })
  } catch (e) {
    console.error('[demo]', e)
    alert('Demo belum bisa dibuka. Coba lagi sebentar, ya.')
    exitDemo()
  }
}
