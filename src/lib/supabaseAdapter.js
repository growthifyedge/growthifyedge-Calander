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

// Self-healing upsert: if PostgREST reports a column that doesn't exist in the
// table (e.g. a stray field like `attachments`, or a column a migration hasn't
// added yet), drop that column and retry instead of failing the whole write.
// Real errors (RLS, network, etc.) are thrown — never silently swallowed.
const upsertWithRetry = async (collection, payload) => {
  let body = payload
  for (let attempt = 0; attempt < 10; attempt++) {
    const query = supabase.from(collection).upsert(body)
    const { data, error } = Array.isArray(body) ? await query.select() : await query.select().single()
    if (!error) return data
    // Detect "unknown column" across both PostgREST (PGRST204) and native
    // Postgres (42703) error message formats.
    const msg = error.message || ''
    const missingCol =
      /Could not find the '([^']+)' column/.exec(msg)?.[1] ||
      /column "?([a-z0-9_]+)"? of relation/i.exec(msg)?.[1] ||
      /column (?:[a-z0-9_]+\.)?"?([a-z0-9_]+)"? does not exist/i.exec(msg)?.[1]
    if (missingCol) {
      console.warn(`[supabaseAdapter] '${collection}': unknown column '${missingCol}' — dropping it and retrying`)
      body = Array.isArray(body)
        ? body.map((r) => {
            const { [missingCol]: _omit, ...rest } = r
            return rest
          })
        : (() => {
            const { [missingCol]: _omit, ...rest } = body
            return rest
          })()
      continue
    }
    console.error(`[supabaseAdapter] upsert '${collection}' failed:`, error)
    throw error
  }
  throw new Error(`[supabaseAdapter] upsert '${collection}' failed after stripping unknown columns`)
}

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
    await upsertWithRetry(collection, records.map(toRow))
    return records
  },

  async put(collection, record) {
    const row = toRow(record)
    if (collection === 'tasks') {
      try {
        const { data: s } = await supabase.auth.getSession()
        console.log('[Current Auth User]', s?.session?.user ? { id: s.session.user.id, email: s.session.user.email } : null)
      } catch (e) {
        console.log('[Current Auth User] (could not read session)', e?.message)
      }
      console.log('[Task Save Payload]', row)
    }
    try {
      const data = await upsertWithRetry(collection, row)
      if (collection === 'tasks') console.log('[Task Save Result]', data)
      return fromRow(data)
    } catch (e) {
      if (collection === 'tasks') {
        console.error('[Task Save Error]', { code: e?.code, message: e?.message, details: e?.details, hint: e?.hint })
      }
      throw e
    }
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
