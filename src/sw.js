// Custom service worker for "My Calander" (PWA precache + Web Push).
// Built by vite-plugin-pwa in injectManifest mode. Registration happens in
// React in Step 3 (vite-plugin-pwa is configured with injectRegister: false).
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching'

// Precache the built assets. vite-plugin-pwa replaces self.__WB_MANIFEST at build time.
precacheAndRoute(self.__WB_MANIFEST || [])

// Take control as soon as a new SW is available.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// ── Web Push ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Reminder'
  const options = {
    body: data.body || 'You have a reminder.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click → focus/open the app at data.url ──────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = clients.find((c) => 'focus' in c)
      if (existing) {
        try {
          if (existing.navigate) await existing.navigate(url)
        } catch {
          /* navigation can fail in rare cases — focusing is enough */
        }
        return existing.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })(),
  )
})
