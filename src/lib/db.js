import localAdapter from './localAdapter'
import supabaseAdapter from './supabaseAdapter'
import { isSupabaseConfigured } from './supabaseClient'

// Single source of truth for which backend the app talks to. The runtime
// preference is stored in localStorage so Settings can flip it without env edits.
const PREF_KEY = 'ge_data_source'

export const getDataSource = () => {
  const fromEnv = import.meta.env.VITE_DATA_SOURCE
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(PREF_KEY) : null
  // Default to Supabase when it's configured; otherwise local. The user can
  // still override either way from Settings (persisted in localStorage).
  const pref = stored || fromEnv || (isSupabaseConfigured ? 'supabase' : 'local')
  // Fall back to local if supabase requested but not configured.
  return pref === 'supabase' && isSupabaseConfigured ? 'supabase' : 'local'
}

export const setDataSource = (src) => {
  localStorage.setItem(PREF_KEY, src)
}

export const supabaseAvailable = isSupabaseConfigured

// The active adapter — both implement the same interface.
export const db = getDataSource() === 'supabase' ? supabaseAdapter : localAdapter

export { localAdapter, supabaseAdapter }
