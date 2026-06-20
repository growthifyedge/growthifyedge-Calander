import { supabase, STORAGE_BUCKET } from './supabaseClient'
import { COLLECTIONS } from './constants'

// Mirrors the localAdapter interface against Supabase (Postgres + Storage).
// Records use snake_cased columns in Postgres but the app speaks camelCase, so
// we translate at the boundary. RLS scopes every query to the signed-in user.

const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
const toRow = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [snake(k), v]))
const fromRow = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v]))

const uid = async () => (await supabase.auth.getUser()).data.user?.id ?? null

const supabaseAdapter = {
  kind: 'supabase',

  async ready() {
    if (!supabase) throw new Error('Supabase not configured')
    return true
  },

  async getAll(collection) {
    const { data, error } = await supabase.from(collection).select('*')
    if (error) throw error
    return (data || []).map(fromRow)
  },

  async setAll(collection, records) {
    if (!records.length) return records
    const { error } = await supabase.from(collection).upsert(records.map(toRow))
    if (error) throw error
    return records
  },

  async put(collection, record) {
    const { data, error } = await supabase.from(collection).upsert(toRow(record)).select().single()
    if (error) throw error
    return fromRow(data)
  },

  async remove(collection, id) {
    const { error } = await supabase.from(collection).delete().eq('id', id)
    if (error) throw error
  },

  // ── File blobs → Storage (keyed by storage_path, e.g. "{uid}/{fileId}") ─────
  async saveBlob(key, blob) {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(key, blob, { upsert: true, contentType: blob.type })
    if (error) throw error
  },
  async getBlob(key) {
    const { data } = await supabase.storage.from(STORAGE_BUCKET).download(key)
    return data || null
  },
  async removeBlob(key) {
    await supabase.storage.from(STORAGE_BUCKET).remove([key])
  },
  async getFileUrl(file) {
    if (!file.storagePath) return null
    const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(file.storagePath, 3600)
    return data?.signedUrl || null
  },

  // ── Settings live on the user's profiles row ────────────────────────────────
  async getSettings() {
    const id = await uid()
    if (!id) return null
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (!data) return null
    return { profile: { name: data.full_name, role: data.role, email: data.email, company: data.company } }
  },
  async saveSettings(settings) {
    const id = await uid()
    if (!id) return settings
    const p = settings.profile || {}
    const { error } = await supabase
      .from('profiles')
      .upsert({ id, full_name: p.name, role: p.role, email: p.email, company: p.company })
    if (error) throw error
    return settings
  },

  async exportAll() {
    const out = { settings: await this.getSettings(), collections: {} }
    for (const c of COLLECTIONS) out.collections[c] = await this.getAll(c)
    return out
  },
  async importAll(data) {
    for (const c of COLLECTIONS) if (data.collections?.[c]) await this.setAll(c, data.collections[c])
  },
  async clearAll() {
    for (const c of COLLECTIONS) await supabase.from(c).delete().neq('id', '')
  },
}

export default supabaseAdapter
