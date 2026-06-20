# Project Structure

```
growthifyedge-os/
├── index.html                  # App entry HTML (loads /src/main.jsx, fonts, favicon)
├── package.json                # Scripts + dependencies
├── vite.config.js              # Vite config (relative base, hash routing, vendor chunks)
├── tailwind.config.js          # Tailwind theme (semantic tokens, accent palette)
├── postcss.config.js           # PostCSS (tailwind + autoprefixer)
├── .env.example                # Template for Supabase keys (copy to .env)
│
├── supabase/
│   └── schema.sql              # All tables, RLS policies, storage policies, profile trigger
│
├── docs/                       # ← you are here
│   ├── PROJECT_STRUCTURE.md
│   ├── INSTALLATION.md
│   ├── SUPABASE_SETUP.md
│   ├── DEPLOYMENT_VERCEL.md
│   └── PRODUCTION_CHECKLIST.md
│
└── src/
    ├── main.jsx                # Root render + provider tree (Theme→Toast→Auth→Data→QuickAdd)
    ├── App.jsx                 # Routes: /login (public) + protected app shell
    ├── index.css               # Tailwind layers, semantic CSS variables, component classes
    │
    ├── lib/                    # Framework-free logic
    │   ├── db.js               # Adapter selector (local vs supabase) + data-source pref
    │   ├── localAdapter.js     # IndexedDB persistence (localforage): records + file blobs
    │   ├── supabaseAdapter.js  # Supabase Postgres + Storage (mirrors local interface)
    │   ├── supabaseClient.js   # createClient(); isSupabaseConfigured flag
    │   ├── constants.js        # Statuses, priorities, categories, recurrence, accent palettes
    │   ├── utils.js            # Dates, ids, formatting, file helpers (cn, uid, fmtDate, …)
    │   └── seed.js             # Demo workspace data + default settings (local mode only)
    │
    ├── context/                # React state providers
    │   ├── AuthContext.jsx     # Supabase email+password session (local fallback user)
    │   ├── DataContext.jsx     # All collections in memory; CRUD; recurrence; dependencies
    │   ├── ThemeContext.jsx    # Light/dark + accent (persisted to localStorage)
    │   ├── ToastContext.jsx    # Toast notifications
    │   └── QuickAddContext.jsx # Global "new X" modal opener (task/client/project/…)
    │
    ├── routes/
    │   └── ProtectedRoute.jsx  # Redirects to /login when unauthenticated
    │
    ├── components/
    │   ├── Layout.jsx          # Sidebar + Topbar + routed <Outlet>
    │   ├── Sidebar.jsx         # Grouped nav + data-source indicator
    │   ├── Topbar.jsx          # Global search, quick-add menu, theme toggle, avatar
    │   ├── PageHeader.jsx      # Reusable page title/subtitle/actions/back
    │   ├── ui/                 # Design system: index (Button/Card/StatCard/…), Badge,
    │   │                       #   Form (Field/Input/Select/Switch), Modal, Tabs
    │   ├── tasks/              # TaskCard, TaskListView, KanbanBoard
    │   ├── calendar/           # CalendarView (Day/Week/Month + drag-to-reschedule)
    │   ├── files/              # FileThumb, FileGrid, FilePreviewModal
    │   ├── projects/           # ProjectCard
    │   ├── approvals/          # ApprovalCard
    │   ├── meetings/           # MeetingCard (action-item → task)
    │   └── modals/             # Task/Client/Project/Meeting/Approval/FileUpload modals
    │
    └── pages/                  # One per route
        ├── Login.jsx           Dashboard.jsx   Tasks.jsx       Calendar.jsx
        ├── Clients.jsx         ClientDetail.jsx Projects.jsx   ProjectDetail.jsx
        ├── Files.jsx           Approvals.jsx    Meetings.jsx   Reports.jsx
        └── Settings.jsx
```

## Architecture in one paragraph

The UI is plain React. All data access goes through **`lib/db.js`**, which picks one of
two interchangeable adapters implementing the same interface: **`localAdapter`**
(IndexedDB, zero-setup) or **`supabaseAdapter`** (Postgres + Storage). **`DataContext`**
loads every collection into memory once, then does per-record create/update/delete
(stamping `user_id`) and persists through the active adapter — so every screen is
reactive and the backend is swappable without touching component code.
