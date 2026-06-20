import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only instantiated when both env vars are present. The app runs perfectly
// without these (local IndexedDB mode); Supabase is an optional sync backend.
export const isSupabaseConfigured = Boolean(url && anon)

export const supabase = isSupabaseConfigured ? createClient(url, anon) : null

export const STORAGE_BUCKET = 'media'
