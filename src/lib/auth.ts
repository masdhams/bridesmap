import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  ready: boolean
  planReady: boolean
}

export const useAuth = create<AuthState>(() => ({ session: null, ready: false, planReady: false }))

supabase.auth.onAuthStateChange((_event, session) => {
  useAuth.setState({ session, ready: true })
})

export const accessToken = async () => (await supabase.auth.getSession()).data.session?.access_token ?? null
