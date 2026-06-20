# Production Readiness & QA Report

Version 1.0 — prepared for production release.

## QA results

Every module was tested in the running app (CRUD exercised through the real UI, data
verified in IndexedDB, layouts measured at mobile width).

| Area | Test | Result |
|------|------|--------|
| **Dashboard** | Stats, widgets, charts render from live data | ✅ Pass |
| **Tasks — CRUD** | Create (modal, with tags), edit, status change, delete | ✅ Pass |
| **Tasks — views** | List / Kanban / Calendar render & switch | ✅ Pass |
| **Recurring tasks** | Completing a recurring task spawns the next occurrence (16→17) | ✅ Pass |
| **Dependencies** | Blocked task shows lock + chip; completion refused with warning | ✅ Pass |
| **Tags** | Add/remove chips, display on cards/list, filter by tag | ✅ Pass |
| **Clients — CRUD** | Create → edit → delete, full cycle | ✅ Pass |
| **Projects** | Create/edit/delete, progress, related tabs | ✅ Pass |
| **Persistence** | Survives full page reload (IndexedDB write-through) | ✅ Pass |
| **File upload** | Inject file → upload → record + 70-byte blob stored in IndexedDB | ✅ Pass |
| **File preview/download** | Image thumbnail renders from blob URL; blob is download source | ✅ Pass |
| **Content Approvals** | Pipeline board, status drag, history timeline | ✅ Pass |
| **Calendar** | Day/Week/Month render; events present; draggable; reschedule = task update | ✅ Pass |
| **Meeting notes** | Notes/decisions/action items; **action item → task** | ✅ Pass |
| **Reports** | All 5 reports populate (Pending 13 / Done 3 / Overdue 1 / Clients 5 / Projects 6); CSV export; PDF export (popup-guarded) | ✅ Pass |
| **Settings** | Theme, accent (live), profile save, backup/restore, reset | ✅ Pass |
| **Mobile responsiveness** | Zero horizontal overflow across all 10 routes at 375px | ✅ Pass |
| **Auth flow** | Email+password sign-up/in/out, protected routes, profile trigger | ✅ Build + code verified; E2E requires live Supabase keys |
| **Production build** | Compiles clean; vendor chunks split for caching | ✅ Pass |

### Fixes applied during this pass
- Vendor code-splitting (react / charts / motion / vendor) to remove the >500 KB single-chunk warning and improve caching.
- PDF export now shows a toast if the browser blocks the pop-up (was failing silently).

## Go-live checklist

- [ ] Run [SUPABASE_SETUP.md](SUPABASE_SETUP.md) — schema, `media` bucket, keys in `.env`.
- [ ] Set **Confirm email** preference in Supabase Auth (off for a private single user, or keep on and confirm via inbox).
- [ ] `npm run build` succeeds locally.
- [ ] Deploy per [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) with `VITE_*` env vars set.
- [ ] Add the deployed URL to Supabase **Auth → URL Configuration**.
- [ ] Sign up your account on the live URL; create a client/task to confirm cloud writes.
- [ ] Upload a file on the live URL to confirm Storage writes.
- [ ] (Optional) Configure a custom domain.

## Known limitations (by design for V1)

- **Single-owner.** No team members/roles yet; the schema is structured so this is an
  additive change later (organizations + memberships), not a rewrite.
- **Dependency cycles** (A depends on B, B depends on A) are not prevented; both tasks
  would stay blocked. Avoid creating circular dependencies.
- **JSON backup** (Settings → Export) covers records and settings, not file blobs; in
  Supabase mode your files live safely in Storage regardless.
- **Realtime** multi-device live updates are not enabled (changes appear on next load).

## Security notes

- Row Level Security restricts every table to `user_id = auth.uid()`.
- Storage objects are namespaced per user and served via short-lived signed URLs.
- Only the Supabase **anon** key is used in the frontend (never `service_role`).
