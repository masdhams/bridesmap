import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  ready: boolean
  planReady: boolean
  /** True setelah user membuka tautan "buat kata sandi baru" dari email, sampai kata sandinya disimpan. */
  recovery: boolean
}

export const useAuth = create<AuthState>(() => ({ session: null, ready: false, planReady: false, recovery: false }))

supabase.auth.onAuthStateChange((event, session) => {
  useAuth.setState({ session, ready: true, ...(event === 'PASSWORD_RECOVERY' ? { recovery: true } : {}) })
})

export const accessToken = async () => (await supabase.auth.getSession()).data.session?.access_token ?? null
