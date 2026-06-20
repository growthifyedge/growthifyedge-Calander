// ── Central enums, labels, and colour maps used across the app ──────────────

export const COLLECTIONS = [
  'clients',
  'projects',
  'tasks',
  'files',
  'meetings',
  'approvals',
  'activity',
]

// Task status -----------------------------------------------------------------
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'slate', dot: '#94a3b8' },
  { value: 'in_progress', label: 'In Progress', color: 'blue', dot: '#3b82f6' },
  { value: 'review', label: 'Review', color: 'amber', dot: '#f59e0b' },
  { value: 'done', label: 'Done', color: 'emerald', dot: '#10b981' },
]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', dot: '#94a3b8', rank: 0 },
  { value: 'medium', label: 'Medium', dot: '#3b82f6', rank: 1 },
  { value: 'high', label: 'High', dot: '#f59e0b', rank: 2 },
  { value: 'urgent', label: 'Urgent', dot: '#ef4444', rank: 3 },
]

export const TASK_CATEGORIES = [
  'SEO',
  'Social Media',
  'Ads',
  'Website',
  'Content',
  'Design',
  'Email Marketing',
  'General',
]

// Recurring tasks ------------------------------------------------------------
export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom (every N days)' },
]

// Reminders ------------------------------------------------------------------
// offset = minutes before the due time the reminder fires (null = custom time)
export const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder', offset: null },
  { value: 'at_due', label: 'At due time', offset: 0 },
  { value: '15m', label: '15 minutes before', offset: 15 },
  { value: '30m', label: '30 minutes before', offset: 30 },
  { value: '1h', label: '1 hour before', offset: 60 },
  { value: '1d', label: '1 day before', offset: 1440 },
  { value: 'custom', label: 'Custom reminder time', offset: null },
]

export const REMINDER_SHORT = {
  none: 'None',
  at_due: 'At due',
  '15m': '15m before',
  '30m': '30m before',
  '1h': '1h before',
  '1d': '1d before',
  custom: 'Custom',
}

// Project status --------------------------------------------------------------
export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'slate', dot: '#94a3b8' },
  { value: 'active', label: 'Active', color: 'blue', dot: '#3b82f6' },
  { value: 'on_hold', label: 'On Hold', color: 'amber', dot: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: 'emerald', dot: '#10b981' },
]

// Content approval status -----------------------------------------------------
export const APPROVAL_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'slate', dot: '#94a3b8' },
  { value: 'review', label: 'Review', color: 'blue', dot: '#3b82f6' },
  { value: 'revision', label: 'Revision Required', color: 'amber', dot: '#f59e0b' },
  { value: 'approved', label: 'Approved', color: 'emerald', dot: '#10b981' },
]

// Accent palettes (RGB channel triplets) for Settings → Accent color ----------
export const ACCENTS = {
  indigo: {
    label: 'Indigo',
    swatch: '#6366f1',
    shades: {
      50: '238 242 255', 100: '224 231 255', 200: '199 210 254', 300: '165 180 252',
      400: '129 140 248', 500: '99 102 241', 600: '79 70 229', 700: '67 56 202',
    },
  },
  violet: {
    label: 'Violet',
    swatch: '#8b5cf6',
    shades: {
      50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253',
      400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217',
    },
  },
  emerald: {
    label: 'Emerald',
    swatch: '#10b981',
    shades: {
      50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183',
      400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 700: '4 120 87',
    },
  },
  blue: {
    label: 'Ocean',
    swatch: '#3b82f6',
    shades: {
      50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253',
      400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216',
    },
  },
  rose: {
    label: 'Rose',
    swatch: '#f43f5e',
    shades: {
      50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175',
      400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60',
    },
  },
  amber: {
    label: 'Amber',
    swatch: '#f59e0b',
    shades: {
      50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77',
      400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9',
    },
  },
}

// Helpers ---------------------------------------------------------------------
export const statusMeta = (list, value) => list.find((s) => s.value === value) || list[0]

// Tailwind tone classes per semantic colour name (badges, chips) --------------
export const TONE = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
}
