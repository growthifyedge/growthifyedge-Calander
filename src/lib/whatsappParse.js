// Lightweight, offline parser for pasted WhatsApp messages → a task draft.
// Pure function, no network/APIs. Intentionally conservative: anything unclear
// is left empty so the user fills it in manually (no aggressive guessing).
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, startOfDay } from 'date-fns'

const WEEKDAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tues: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thurs: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

const atTime = (date, h, m = 0) => setMilliseconds(setSeconds(setMinutes(setHours(date, h), m), 0), 0)

export function parseWhatsApp(raw, now = new Date()) {
  const text = (raw || '').trim()
  const lower = text.toLowerCase()
  const detected = { date: false, time: false, urgent: false }

  // ── Urgency ────────────────────────────────────────────────────────────────
  const urgent = /\b(urgent|asap|emergency|immediately|right away)\b/.test(lower)
  detected.urgent = urgent

  // ── Date (today / tonight / tomorrow / weekday names) ───────────────────────
  let baseDay = null
  if (/\btomorrow\b/.test(lower)) baseDay = addDays(startOfDay(now), 1)
  else if (/\btoday\b|\btonight\b/.test(lower)) baseDay = startOfDay(now)
  else {
    for (const [word, dow] of Object.entries(WEEKDAYS)) {
      if (new RegExp(`\\b${word}\\b`).test(lower)) {
        const diff = (dow - now.getDay() + 7) % 7 // 0 = today
        baseDay = addDays(startOfDay(now), diff)
        break
      }
    }
  }
  detected.date = Boolean(baseDay)

  // ── Time (5pm / 5:30 pm / 17:00 / morning / evening / tonight / noon) ────────
  let hour = null
  let minute = 0
  const ampm = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/)
  const h24 = lower.match(/\b(\d{1,2}):(\d{2})\b/)
  if (ampm) {
    hour = parseInt(ampm[1], 10) % 12
    minute = ampm[2] ? parseInt(ampm[2], 10) : 0
    if (ampm[3] === 'pm') hour += 12
  } else if (h24) {
    hour = parseInt(h24[1], 10)
    minute = parseInt(h24[2], 10)
  } else if (/\bnoon\b/.test(lower)) hour = 12
  else if (/\bmidnight\b/.test(lower)) hour = 0
  else if (/\btonight\b/.test(lower)) hour = 20
  else if (/\bmorning\b/.test(lower)) hour = 9
  else if (/\bafternoon\b/.test(lower)) hour = 14
  else if (/\bevening\b/.test(lower)) hour = 18
  const hasTime = hour !== null && hour >= 0 && hour <= 23
  detected.time = hasTime

  // ── Build a due date only from what was actually detected ───────────────────
  let dueDate = null
  if (baseDay && hasTime) dueDate = atTime(baseDay, hour, minute)
  else if (baseDay && !hasTime) dueDate = atTime(baseDay, 9, 0) // date but no time → 9am (editable)
  else if (!baseDay && hasTime) {
    dueDate = atTime(startOfDay(now), hour, minute)
    if (dueDate.getTime() < now.getTime()) dueDate = addDays(dueDate, 1) // time already passed today
  }

  // Suggest an "at due time" reminder only when a clear time was found; else manual.
  const reminder = hasTime ? 'at_due' : 'none'

  // ── Title: first non-empty line, sentence-capped, ≤ 80 chars ────────────────
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) || text
  let title = firstLine
  const sentenceEnd = title.search(/[.!?]/)
  if (sentenceEnd > 12) title = title.slice(0, sentenceEnd)
  title = title.replace(/\s+/g, ' ').trim()
  if (title.length > 80) title = title.slice(0, 77).trimEnd() + '…'
  if (!title) title = 'WhatsApp task'

  const tags = ['whatsapp']
  if (urgent) tags.push('urgent')

  return {
    title,
    description: text, // full original message preserved
    dueDate, // Date | null
    reminder, // 'at_due' | 'none'
    priority: urgent ? 'urgent' : 'medium',
    tags,
    detected,
  }
}
