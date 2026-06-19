import { supabase } from '../db/supabase'

export interface AuthUser { id: string; email: string }

function toUser(u: { id: string; email?: string } | null | undefined): AuthUser | null {
  return u ? { id: u.id, email: u.email ?? '' } : null
}

export async function signUp(email: string, password: string) {
  if (!supabase) return { user: null, error: 'Облако не настроено' }
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: toUser(data?.user), error: error?.message ?? null }
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { user: null, error: 'Облако не настроено' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: toUser(data?.user), error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return toUser(data?.user)
}

export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
  return () => data.subscription.unsubscribe()
}
