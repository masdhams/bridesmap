import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { DEMO } from './demo'
import { supabase } from './supabase'

export type Access = 'unknown' | 'granted' | 'denied'

interface AuthState {
  session: Session | null
  ready: boolean
  planReady: boolean
  /** True setelah user membuka tautan "buat kata sandi baru" dari email, sampai kata sandinya disimpan. */
  recovery: boolean
  /** Hasil cek pembelian (tabel purchases) untuk akun yang sedang login. */
  access: Access
}

export const useAuth = create<AuthState>(() => ({ session: null, ready: false, planReady: false, recovery: false, access: 'unknown' }))

// Mode demo memakai sesi palsu dari demoBoot; sesi login asli tidak dibaca supaya tidak menimpanya.
if (!DEMO) {
  supabase.auth.onAuthStateChange((event, session) => {
    useAuth.setState({ session, ready: true, ...(event === 'PASSWORD_RECOVERY' ? { recovery: true } : {}) })
  })
}

// Di mode demo tidak ada token: permintaan ke server tidak boleh memakai akun asli pengunjung.
export const accessToken = async () => (DEMO ? null : ((await supabase.auth.getSession()).data.session?.access_token ?? null))
