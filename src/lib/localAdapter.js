import localforage from 'localforage'
import { COLLECTIONS } from './constants'

// Local-first persistence using IndexedDB (via localforage).
// One store holds JSON collections; a second store holds file blobs so large
// media never bloats the records store.

const dataStore = localforage.createInstance({
  name: 'growthifyedge-os',
  storeName: 'data',
  description: 'GrowthifyEdge OS structured data (collections + settings)',
})

const blobStore = localforage.createInstance({
  name: 'growthifyedge-os',
  storeName: 'blobs',
  description: 'GrowthifyEdge OS uploaded file blobs',
})

const localAdapter = {
  kind: 'local',

  async ready() {
    await dataStore.ready()
    return true
  },

  async getAll(collection) {
    return (await dataStore.getItem(collection)) || []
  },

  async setAll(collection, records) {
    await dataStore.setItem(collection, records)
    return records
  },

  async put(collection, record) {
    const list = (await dataStore.getItem(collection)) || []
    const idx = list.findIndex((r) => r.id === record.id)
    if (idx === -1) list.unshift(record)
    else list[idx] = record
    await dataStore.setItem(collection, list)
    return record
  },

  async remove(collection, id) {
    const list = (await dataStore.getItem(collection)) || []
    await dataStore.setItem(
      collection,
      list.filter((r) => r.id !== id),
    )
  },

  // ── File blobs (keyed by storagePath; falls back to id) ───────────────────
  async saveBlob(key, blob) {
    await blobStore.setItem(key, blob)
  },
  async getBlob(key) {
    return (await blobStore.getItem(key)) || null
  },
  async removeBlob(key) {
    await blobStore.removeItem(key)
  },
  // Returns an object URL the UI can use directly for preview/download.
  async getFileUrl(file) {
    const blob = await blobStore.getItem(file.storagePath || file.id)
    return blob ? URL.createObjectURL(blob) : null
  },

  // ── Settings ────────────────────────────────────────────────────────────
  async getSettings() {
    return (await dataStore.getItem('settings')) || null
  },
  async saveSettings(settings) {
    await dataStore.setItem('settings', settings)
    return settings
  },

  // ── Backup / restore / reset ──────────────────────────────────────────────
  async exportAll() {
    const out = { settings: await this.getSettings(), collections: {} }
    for (const c of COLLECTIONS) out.collections[c] = await this.getAll(c)
    return out
  },
  async importAll(data) {
    if (data.settings) await this.saveSettings(data.settings)
    for (const c of COLLECTIONS) {
      if (data.collections?.[c]) await this.setAll(c, data.collections[c])
    }
  },
  async clearAll() {
    await dataStore.clear()
    await blobStore.clear()
  },
}

export default localAdapter
