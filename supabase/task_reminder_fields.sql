-- ============================================================================
--  Task reminder delivery fields (Step 5A)
--  Adds columns the reminder-sending cron (a later step) will use to find and
--  mark due reminders. Run in the Supabase SQL editor. Safe + idempotent —
--  does not modify any existing task data.
-- ============================================================================

alter table tasks add column if not exists reminder_time    timestamptz;
alter table tasks add column if not exists reminder_sent     boolean not null default false;
alter table tasks add column if not exists reminder_sent_at  timestamptz;

-- Lets the cron quickly find tasks whose reminder is due but not yet sent.
create index if not exists tasks_due_reminders_idx
  on tasks (reminder_time)
  where reminder_time is not null and reminder_sent = false;
