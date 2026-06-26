// Vercel serverless function (also runs on a cron) — sends due task reminders
// via Web Push. Finds tasks whose reminder_time has passed and reminder_sent is
// false, pushes to ALL active device subscriptions, prunes expired ones, then
// marks the tasks as sent. Server-only secrets (service role + VAPID private).
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// ── Notification text helpers (content only — no effect on send logic) ───────
const STATUS_LABEL = { pending: 'Pending', in_progress: 'In Progress', review: 'In Review', done: 'Completed' }
const priorityLabel = (priority, tags) => {
  if (priority === 'urgent') return Array.isArray(tags) && tags.includes('top-urgent') ? 'Top Urgent' : 'Urgent'
  if (priority === 'high') return 'Urgent'
  if (priority === 'medium') return 'Normal'
  if (priority === 'low') return 'Low'
  return null
}
// Title: "Reminder: <task>" · Body: "Status: X · Priority: Y · Client: Z"
// Client is included only when a name is available.
const buildReminderText = (task, clientName) => {
  const parts = []
  const status = STATUS_LABEL[task.status] || task.status
  if (status) parts.push(`Status: ${status}`)
  const prio = priorityLabel(task.priority, task.tags)
  if (prio) parts.push(`Priority: ${prio}`)
  if (clientName) parts.push(`Client: ${clientName}`)
  return {
    title: `Reminder: ${task.title || 'Task'}`,
    body: parts.length ? parts.join(' · ') : task.title || 'You have a task reminder.',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })
  }
  if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Server missing VAPID_SUBJECT / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY' })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  const now = new Date().toISOString()
  let sent = 0
  let failed = 0
  let expiredRemoved = 0
  const expired = new Set() // endpoints to delete (404/410)

  try {
    // 1. Due, unsent reminders (cap per run).
    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('id, title, description, user_id, reminder_time, status, priority, tags, client_id')
      .not('reminder_time', 'is', null)
      .eq('reminder_sent', false)
      .lte('reminder_time', now)
      .limit(25)
    if (tasksErr) throw tasksErr

    // 2. Load all active subscriptions once (every due reminder goes to all).
    const { data: allSubs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, subscription, user_id')
    if (subsErr) throw subsErr
    const subscriptions = allSubs || []

    // Client names for notification context — loaded once, non-fatal if it fails
    // (then notifications fall back to status + priority only).
    let clientName = {}
    const { data: clientRows, error: clientErr } = await supabase.from('clients').select('id, company')
    if (!clientErr && clientRows) clientName = Object.fromEntries(clientRows.map((c) => [c.id, c.company]))

    for (const task of tasks || []) {
      // Multi-device: send every due reminder to ALL active subscriptions
      // (no user_id filtering yet — that comes in a later step).
      const targets = subscriptions.filter((s) => !expired.has(s.endpoint))

      const { title, body } = buildReminderText(task, task.client_id ? clientName[task.client_id] : null)
      const payload = JSON.stringify({ title, body, url: '/' })

      for (const sub of targets) {
        try {
          await webpush.sendNotification(sub.subscription, payload)
          sent++
        } catch (err) {
          const code = err && err.statusCode
          if (code === 404 || code === 410) {
            expired.add(sub.endpoint) // subscription is gone/expired
          } else {
            failed++
            console.error('[check-reminders] push failed:', code, (err && (err.body || err.message)) || err)
          }
        }
      }

      // Mark processed regardless of individual send results (avoids retry storms).
      const { error: markErr } = await supabase
        .from('tasks')
        .update({ reminder_sent: true, reminder_sent_at: now })
        .eq('id', task.id)
      if (markErr) console.error('[check-reminders] mark sent failed:', markErr.message)
    }

    // 3. Delete expired subscriptions.
    if (expired.size > 0) {
      const endpoints = [...expired]
      const { error: delErr } = await supabase.from('push_subscriptions').delete().in('endpoint', endpoints)
      if (delErr) console.error('[check-reminders] delete expired failed:', delErr.message)
      else expiredRemoved = endpoints.length
    }

    return res.status(200).json({
      success: true,
      checked: (tasks && tasks.length) || 0,
      sent,
      failed,
      expiredRemoved,
    })
  } catch (e) {
    console.error('[check-reminders] error:', e)
    return res.status(500).json({ success: false, error: e?.message || 'Unknown error', checked: 0, sent, failed, expiredRemoved })
  }
}
