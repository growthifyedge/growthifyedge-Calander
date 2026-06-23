// Frontend Web Push helpers. No backend yet — enablePushNotifications() logs and
// returns the subscription. Step 4 will POST it to a Vercel route → Supabase.

const DEVICE_ID_KEY = 'ge_device_id'

// Ask for Notification permission (returns 'granted' | 'denied' | 'default' | 'unsupported').
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  let permission = Notification.permission
  if (permission === 'default') permission = await Notification.requestPermission()
  return permission
}

// VAPID public keys are URL-safe base64; pushManager needs a Uint8Array.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

// Stable per-device id (so Step 4 can dedupe subscriptions per device).
export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// Request permission, ensure a push subscription exists, and return it.
// userId is optional for now (Step 4 will attach it when saving).
export async function enablePushNotifications(userId = null) {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported in this browser')
  if (!('PushManager' in window)) throw new Error('Push notifications are not supported in this browser')

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) throw new Error('Missing VITE_VAPID_PUBLIC_KEY environment variable')

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted')

  const registration = await navigator.serviceWorker.ready

  // Reuse an existing subscription if the device already has one.
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  const payload = {
    userId,
    deviceId: getDeviceId(),
    subscription: subscription.toJSON(),
  }

  console.log('[Push] saving subscription:', payload)

  // Persist to Supabase via the Vercel API route (Step 4).
  const res = await fetch('/api/save-push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !body?.success) {
    const reason = body?.error || `Failed to save subscription (HTTP ${res.status})`
    console.error('[Push] save failed:', reason)
    throw new Error(reason)
  }

  console.log('[Push] subscription saved:', body)
  return { ...payload, saved: true, id: body.id }
}
