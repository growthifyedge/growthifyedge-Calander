import { useRef, useState } from 'react'
import { Sun, Moon, Check, Download, Upload, RotateCcw, Cloud, HardDrive, User, LogOut, Mail, Bell, BellRing, BellOff } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import { Button, Card, Avatar } from '../components/ui'
import { Field, Input, Switch } from '../components/ui/Form'
import { ConfirmDialog } from '../components/ui/Modal'
import { ACCENTS } from '../lib/constants'
import { getDataSource, setDataSource, supabaseAvailable } from '../lib/db'
import { downloadBlob, cn } from '../lib/utils'

export default function Settings() {
  const { theme, setTheme, accent, setAccent } = useTheme()
  const { settings, updateSettings, exportBackup, importBackup, resetWorkspace } = useData()
  const { isSupabase, user, signOut } = useAuth()
  const notif = useNotifications()
  const { toast } = useToast()
  const fileRef = useRef(null)
  const [profile, setProfile] = useState(settings.profile || {})
  const [reset, setReset] = useState(null)
  const source = getDataSource()

  const saveProfile = async () => {
    await updateSettings({ profile })
    toast('Profile saved')
  }

  const doExport = async () => {
    const data = await exportBackup()
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `growthifyedge-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast('Backup downloaded')
  }

  const doImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      await importBackup(data)
      toast('Backup restored')
    } catch {
      toast('Could not read that backup file', 'error')
    }
    e.target.value = ''
  }

  const switchSource = (src) => {
    setDataSource(src)
    toast('Switching data source…')
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Personalise your workspace and manage your data." />

      <div className="space-y-5">
        {/* Appearance */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Appearance</h2>
          <Field label="Theme">
            <div className="flex gap-2">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition', theme === t.id ? 'border-accent-500 bg-accent-500/10 text-accent-600' : 'border-border text-muted hover:text-fg')}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="mt-4">
            <span className="label">Accent colour</span>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(ACCENTS).map(([key, a]) => (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  className={cn('flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition', accent === key ? 'ring-fg/30' : 'ring-transparent hover:ring-border')}
                  style={{ background: a.swatch }}
                  title={a.label}
                >
                  {accent === key && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Reminders & Notifications</h2>
          <p className="mb-4 text-sm text-muted">
            Browser notifications for task reminders, due, and overdue alerts. Works while GrowthifyEdge OS is open in a tab — no apps or paid services needed.
          </p>
          {!notif?.supported ? (
            <p className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-muted">
              <BellOff className="h-4 w-4" /> This browser doesn't support notifications.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Status + actions (Send test is always available) */}
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2.5',
                  notif.permission === 'granted'
                    ? 'bg-emerald-500/10'
                    : notif.permission === 'denied'
                      ? 'bg-amber-500/10'
                      : 'bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    notif.permission === 'granted'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : notif.permission === 'denied'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-muted',
                  )}
                >
                  {notif.permission === 'granted' ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {notif.permission === 'granted'
                    ? 'Notifications enabled'
                    : notif.permission === 'denied'
                      ? 'Blocked — allow in browser settings'
                      : 'Not enabled yet'}
                </span>
                <div className="flex gap-2">
                  {notif.permission !== 'granted' && (
                    <Button
                      onClick={async () => {
                        const p = await notif.requestPermission()
                        if (p === 'granted') toast('Notifications enabled')
                        else if (p === 'denied') toast('Notifications blocked in your browser', 'error')
                      }}
                    >
                      <Bell className="h-4 w-4" /> Enable
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => notif.sendTest()}>
                    Send test
                  </Button>
                </div>
              </div>

              {notif.permission === 'denied' && (
                <p className="text-xs text-muted">
                  Tip: click the lock/🔔 icon in the address bar → <strong>Notifications → Allow</strong>, then reload.
                </p>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-fg">Task reminders</div>
                  <div className="text-xs text-muted">Reminder, due, and overdue alerts for your tasks.</div>
                </div>
                <Switch checked={notif.enabled} onChange={notif.setEnabled} />
              </div>
            </div>
          )}
        </Card>

        {/* Profile */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Profile</h2>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={profile.name || 'GE'} size={56} />
            <div>
              <div className="text-base font-bold text-fg">{profile.name || 'Your name'}</div>
              <div className="text-sm text-muted">{profile.role || 'Agency Owner'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={profile.name || ''} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></Field>
            <Field label="Role"><Input value={profile.role || ''} onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={profile.email || ''} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="Company"><Input value={profile.company || ''} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} /></Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile}><User className="h-4 w-4" /> Save profile</Button>
          </div>
        </Card>

        {/* Account */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Account</h2>
          {isSupabase ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Mail className="h-4 w-4" /> Signed in as <span className="font-semibold text-fg">{user?.email}</span>
              </div>
              <Button variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Running in <span className="font-semibold text-fg">local mode</span> — no account needed. Add your Supabase keys in
              <code className="mx-1 rounded bg-surface-2 px-1.5 py-0.5 text-xs">.env</code> to enable email + password sign-in and cloud sync.
            </p>
          )}
        </Card>

        {/* Data */}
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Data & Storage</h2>
          <p className="mb-4 text-sm text-muted">
            {source === 'supabase' ? 'Synced to your Supabase cloud project.' : 'Stored privately in this browser (IndexedDB). Nothing leaves your device.'}
          </p>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => source !== 'local' && switchSource('local')}
              className={cn('flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition', source === 'local' ? 'border-accent-500 bg-accent-500/10 text-accent-600' : 'border-border text-muted hover:text-fg')}
            >
              <HardDrive className="h-4 w-4" /> Local (this device)
            </button>
            <button
              onClick={() => supabaseAvailable && source !== 'supabase' && switchSource('supabase')}
              disabled={!supabaseAvailable}
              className={cn('flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-50', source === 'supabase' ? 'border-accent-500 bg-accent-500/10 text-accent-600' : 'border-border text-muted hover:text-fg')}
              title={supabaseAvailable ? 'Switch to cloud sync' : 'Add Supabase keys in .env to enable'}
            >
              <Cloud className="h-4 w-4" /> Cloud sync {supabaseAvailable ? '' : '(not configured)'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={doExport}><Download className="h-4 w-4" /> Export backup</Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import backup</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={doImport} />
            <Button variant="ghost" onClick={() => setReset('demo')}><RotateCcw className="h-4 w-4" /> Reset to demo</Button>
            <Button variant="danger" onClick={() => setReset('empty')}>Clear all data</Button>
          </div>
        </Card>

        <p className="pb-4 text-center text-xs text-muted">GrowthifyEdge OS · v1.0 · built for {settings.profile?.company || 'GrowthifyEdge'}</p>
      </div>

      <ConfirmDialog
        open={Boolean(reset)}
        onClose={() => setReset(null)}
        onConfirm={() => {
          resetWorkspace(reset === 'demo')
          toast(reset === 'demo' ? 'Workspace reset to demo data' : 'All data cleared')
        }}
        title={reset === 'demo' ? 'Reset to demo data?' : 'Clear all data?'}
        message={reset === 'demo' ? 'This replaces your current workspace with fresh sample data.' : 'This permanently deletes all your clients, projects, tasks and files.'}
        confirmLabel={reset === 'demo' ? 'Reset' : 'Clear everything'}
      />
    </div>
  )
}
