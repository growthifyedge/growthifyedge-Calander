// Vercel serverless function — saves a Web Push subscription to Supabase.
// POST { userId, deviceId, subscription } → upsert into push_subscriptions.
// Uses the SERVICE ROLE key (server-only; never exposed to the browser).
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId = null, deviceId, subscription } = req.body || {}

    if (!deviceId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing deviceId or subscription.endpoint' })
    }

    const url = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })
    }

    const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

    const row = {
      user_id: userId,
      device_id: deviceId,
      endpoint: subscription.endpoint, // stored separately from the jsonb blob
      subscription,
      user_agent: req.headers['user-agent'] || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(row, { onConflict: 'endpoint' })
      .select('id')
      .single()

    if (error) {
      console.error('[save-push-subscription] supabase error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true, id: data?.id })
  } catch (e) {
    console.error('[save-push-subscription] error:', e)
    return res.status(500).json({ error: e?.message || 'Unknown server error' })
  }
}
