import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

export function isCloudConfigured(): boolean {
  return SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== ''
}

export const supabase: SupabaseClient | null = isCloudConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
