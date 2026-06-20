import { nowISO } from './utils'

// Generates a realistic starter workspace for a digital-marketing agency.
// Dates are relative to "now" so the dashboard always looks current.
const at = (days, hour = 10, min = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

export function buildSeed() {
  const clients = [
    { id: 'cl_lumen', company: 'Lumen Coffee Co.', contact: 'Sarah Bennett', email: 'sarah@lumencoffee.com', phone: '+1 415 555 0182', whatsapp: '+1 415 555 0182', notes: 'Specialty roaster, 4 cafés. Focus: local SEO + Instagram growth.', createdAt: at(-60) },
    { id: 'cl_novafit', company: 'NovaFit Studio', contact: 'Marcus Lee', email: 'marcus@novafit.io', phone: '+1 312 555 0147', whatsapp: '+1 312 555 0147', notes: 'Boutique gym chain. Running Meta + Google ads, monthly content.', createdAt: at(-48) },
    { id: 'cl_bloom', company: 'Bloom Skincare', contact: 'Priya Nair', email: 'priya@bloomskin.co', phone: '+44 20 7946 0321', whatsapp: '+44 7700 900321', notes: 'DTC skincare. Heavy on UGC + influencer content approvals.', createdAt: at(-35) },
    { id: 'cl_apex', company: 'Apex Realty Group', contact: 'David Okafor', email: 'david@apexrealty.com', phone: '+1 646 555 0199', notes: 'Real estate. Needs weekly listings content + email newsletter.', createdAt: at(-22) },
    { id: 'cl_drift', company: 'Drift Apparel', contact: 'Hana Suzuki', email: 'hana@driftapparel.com', whatsapp: '+81 90 1234 5678', notes: 'Streetwear brand. Quarterly campaign + paid social.', createdAt: at(-12) },
  ]

  const projects = [
    { id: 'pr_lumen_seo', name: 'Local SEO Overhaul', clientId: 'cl_lumen', description: 'Optimise GMB profiles, build local citations, on-page SEO for 4 locations.', status: 'active', dueDate: at(21), progress: 55, createdAt: at(-40) },
    { id: 'pr_lumen_social', name: 'Q3 Instagram Content', clientId: 'cl_lumen', description: '12 posts/month + reels. Brand-aligned, seasonal menu pushes.', status: 'active', dueDate: at(9), progress: 70, createdAt: at(-30) },
    { id: 'pr_novafit_ads', name: 'New Year Ads Campaign', clientId: 'cl_novafit', description: 'Meta + Google ads for membership drive. Landing page + creative.', status: 'active', dueDate: at(5), progress: 40, createdAt: at(-25) },
    { id: 'pr_bloom_launch', name: 'Vitamin C Serum Launch', clientId: 'cl_bloom', description: 'Full launch: UGC, influencer seeding, email flow, paid social.', status: 'active', dueDate: at(14), progress: 30, createdAt: at(-20) },
    { id: 'pr_apex_news', name: 'Monthly Newsletter System', clientId: 'cl_apex', description: 'Build templated newsletter + listings automation.', status: 'planning', dueDate: at(28), progress: 10, createdAt: at(-15) },
    { id: 'pr_drift_brand', name: 'Brand Refresh 2026', clientId: 'cl_drift', description: 'Visual identity refresh + campaign launch assets.', status: 'on_hold', dueDate: at(45), progress: 15, createdAt: at(-8) },
  ]

  const tasks = [
    { id: 'tk_1', title: 'Optimise Google Business Profile — Downtown', description: 'Update hours, add 10 photos, post weekly offer, respond to reviews.', clientId: 'cl_lumen', projectId: 'pr_lumen_seo', category: 'SEO', priority: 'high', status: 'in_progress', dueDate: at(0, 16), notes: 'Need new interior photos from Sarah.', tags: ['gmb', 'local'], reminder: '1h', attachments: [], createdAt: at(-6) },
    { id: 'tk_2', title: 'Schedule 6 Instagram reels — June', description: 'Batch-schedule seasonal cold brew reels.', clientId: 'cl_lumen', projectId: 'pr_lumen_social', category: 'Social Media', priority: 'medium', status: 'review', dueDate: at(0, 12), notes: '', attachments: [], createdAt: at(-4) },
    { id: 'tk_3', title: 'Write 8 local citation submissions', description: 'Yelp, Yellow Pages, Apple Maps, Bing Places + 4 local dirs.', clientId: 'cl_lumen', projectId: 'pr_lumen_seo', category: 'SEO', priority: 'medium', status: 'pending', dueDate: at(3), notes: '', attachments: [], createdAt: at(-3) },
    { id: 'tk_4', title: 'Build Meta ad creative set (5 variations)', description: 'Carousel + single image + 1 video. New Year membership offer.', clientId: 'cl_novafit', projectId: 'pr_novafit_ads', category: 'Ads', priority: 'urgent', status: 'in_progress', dueDate: at(1, 14), notes: 'Awaiting brand colours hex codes.', tags: ['paid', 'creative'], reminder: '1d', attachments: [], createdAt: at(-5) },
    { id: 'tk_5', title: 'Landing page copy — membership drive', description: 'Hero, benefits, social proof, FAQ, CTA. Conversion-focused.', clientId: 'cl_novafit', projectId: 'pr_novafit_ads', category: 'Content', priority: 'high', status: 'pending', dueDate: at(2), notes: '', attachments: [], createdAt: at(-2) },
    { id: 'tk_6', title: 'Set up Google Ads search campaign', description: 'Keyword research, ad groups, 3 RSAs, conversion tracking.', clientId: 'cl_novafit', projectId: 'pr_novafit_ads', category: 'Ads', priority: 'high', status: 'pending', dueDate: at(4), notes: '', tags: ['paid', 'google-ads'], dependencies: ['tk_5'], attachments: [], createdAt: at(-2) },
    { id: 'tk_7', title: 'Brief 5 UGC creators — serum launch', description: 'Send brief + product. Track shipping & deliverables.', clientId: 'cl_bloom', projectId: 'pr_bloom_launch', category: 'Content', priority: 'high', status: 'in_progress', dueDate: at(-1, 17), notes: '2 creators confirmed, 3 pending.', attachments: [], createdAt: at(-7) },
    { id: 'tk_8', title: 'Design launch email flow (4 emails)', description: 'Teaser → launch → social proof → last call.', clientId: 'cl_bloom', projectId: 'pr_bloom_launch', category: 'Email Marketing', priority: 'medium', status: 'pending', dueDate: at(6), notes: '', attachments: [], createdAt: at(-4) },
    { id: 'tk_9', title: 'Approve hero product photography', description: 'Review 30 shots, pick 8 for web + ads.', clientId: 'cl_bloom', projectId: 'pr_bloom_launch', category: 'Design', priority: 'medium', status: 'review', dueDate: at(1), notes: '', attachments: [], createdAt: at(-3) },
    { id: 'tk_10', title: 'Draft newsletter template in Klaviyo', description: 'Modular blocks: featured listing, market tip, agent spotlight.', clientId: 'cl_apex', projectId: 'pr_apex_news', category: 'Email Marketing', priority: 'low', status: 'pending', dueDate: at(8), notes: '', attachments: [], createdAt: at(-2) },
    { id: 'tk_11', title: 'Competitor SEO audit', description: 'Top 5 local competitors. Backlinks, keywords, content gaps.', clientId: 'cl_apex', projectId: 'pr_apex_news', category: 'SEO', priority: 'low', status: 'pending', dueDate: at(10), notes: '', attachments: [], createdAt: at(-1) },
    { id: 'tk_12', title: 'Moodboard for brand refresh', description: 'Direction options: bold/minimal/retro. 3 concepts.', clientId: 'cl_drift', projectId: 'pr_drift_brand', category: 'Design', priority: 'medium', status: 'pending', dueDate: at(7), notes: 'On hold pending client budget sign-off.', attachments: [], createdAt: at(-1) },
    { id: 'tk_13', title: 'Weekly performance report — all clients', description: 'Pull metrics, write insights, send Monday AM.', clientId: null, projectId: null, category: 'General', priority: 'medium', status: 'pending', dueDate: at(2, 9), notes: 'Recurring every Monday.', tags: ['reporting'], recurrence: 'weekly', reminder: '30m', attachments: [], createdAt: at(-1) },
    { id: 'tk_14', title: 'Respond to Bloom Skincare DMs', description: 'Clear influencer & customer DMs, log leads.', clientId: 'cl_bloom', projectId: null, category: 'Social Media', priority: 'low', status: 'done', dueDate: at(-2), notes: '', attachments: [], createdAt: at(-3), completedAt: at(-2) },
    { id: 'tk_15', title: 'Publish June blog post — Lumen', description: '"5 cold brew recipes for summer" — 1200 words, optimised.', clientId: 'cl_lumen', projectId: 'pr_lumen_seo', category: 'Content', priority: 'medium', status: 'done', dueDate: at(-3), notes: '', attachments: [], createdAt: at(-6), completedAt: at(-3) },
    { id: 'tk_16', title: 'Invoice clients — month end', description: 'Generate & send invoices, log in tracker.', clientId: null, projectId: null, category: 'General', priority: 'high', status: 'done', dueDate: at(-5), notes: '', attachments: [], createdAt: at(-7), completedAt: at(-5) },
  ]

  const meetings = [
    {
      id: 'mt_1', title: 'Lumen — Q3 strategy kickoff', clientId: 'cl_lumen', date: at(-2, 11),
      notes: 'Reviewed Q2 results: +38% IG reach, +12 GMB calls. Sarah wants more video. Budget steady.',
      decisions: 'Shift 30% of content budget to short-form video. Add weekly GMB posts.',
      actionItems: [
        { id: 'ai_1', text: 'Send Q3 content calendar by Friday', done: false, taskId: null },
        { id: 'ai_2', text: 'Source a local videographer', done: false, taskId: null },
      ],
      createdAt: at(-2),
    },
    {
      id: 'mt_2', title: 'NovaFit — campaign check-in', clientId: 'cl_novafit', date: at(-1, 15),
      notes: 'Ads pacing slightly under. CPL at $9.20, target $8. Landing page bounce 61%.',
      decisions: 'Refresh creative this week. Rewrite landing hero. Add testimonial section.',
      actionItems: [
        { id: 'ai_3', text: 'Refresh ad creative set', done: false, taskId: null },
        { id: 'ai_4', text: 'A/B test new landing hero', done: false, taskId: null },
      ],
      createdAt: at(-1),
    },
    {
      id: 'mt_3', title: 'Bloom — launch readiness', clientId: 'cl_bloom', date: at(1, 13),
      notes: 'Launch in 2 weeks. UGC on track. Email flow needs build. Inventory confirmed.',
      decisions: 'Lock creator list Monday. Email flow live by next Wed.',
      actionItems: [{ id: 'ai_5', text: 'Finalise UGC creator list', done: false, taskId: null }],
      createdAt: at(0),
    },
  ]

  const approvals = [
    {
      id: 'ap_1', title: 'Summer Cold Brew — IG Carousel', clientId: 'cl_lumen', projectId: 'pr_lumen_social',
      status: 'review', notes: 'Client to confirm copy on slide 3.', fileIds: [],
      history: [
        { status: 'draft', note: 'Initial draft created', at: at(-3) },
        { status: 'review', note: 'Sent to Sarah for review', at: at(-1) },
      ],
      createdAt: at(-3), updatedAt: at(-1),
    },
    {
      id: 'ap_2', title: 'NovaFit — Membership Promo Video', clientId: 'cl_novafit', projectId: 'pr_novafit_ads',
      status: 'revision', notes: 'Make logo bigger, add price overlay at 0:08.', fileIds: [],
      history: [
        { status: 'draft', note: 'Draft uploaded', at: at(-4) },
        { status: 'review', note: 'Sent for review', at: at(-2) },
        { status: 'revision', note: 'Client requested changes', at: at(-1) },
      ],
      createdAt: at(-4), updatedAt: at(-1),
    },
    {
      id: 'ap_3', title: 'Bloom — Serum Hero Image', clientId: 'cl_bloom', projectId: 'pr_bloom_launch',
      status: 'approved', notes: 'Approved for web + paid social.', fileIds: [],
      history: [
        { status: 'draft', note: 'Draft', at: at(-6) },
        { status: 'review', note: 'Review', at: at(-4) },
        { status: 'approved', note: 'Approved by Priya', at: at(-2) },
      ],
      createdAt: at(-6), updatedAt: at(-2),
    },
    {
      id: 'ap_4', title: 'Apex — June Newsletter Draft', clientId: 'cl_apex', projectId: 'pr_apex_news',
      status: 'draft', notes: 'Building template — not yet sent.', fileIds: [],
      history: [{ status: 'draft', note: 'Started', at: at(-1) }],
      createdAt: at(-1), updatedAt: at(-1),
    },
  ]

  const activity = [
    { id: 'av_1', type: 'task', action: 'completed', entity: 'Invoice clients — month end', at: at(-5) },
    { id: 'av_2', type: 'task', action: 'completed', entity: 'Publish June blog post — Lumen', at: at(-3) },
    { id: 'av_3', type: 'meeting', action: 'logged', entity: 'Lumen — Q3 strategy kickoff', at: at(-2) },
    { id: 'av_4', type: 'approval', action: 'approved', entity: 'Bloom — Serum Hero Image', at: at(-2) },
    { id: 'av_5', type: 'meeting', action: 'logged', entity: 'NovaFit — campaign check-in', at: at(-1) },
    { id: 'av_6', type: 'approval', action: 'updated', entity: 'NovaFit — Membership Promo Video', at: at(-1) },
  ]

  return { clients, projects, tasks, meetings, approvals, activity }
}

export const defaultSettings = () => ({
  theme: 'light',
  accent: 'indigo',
  profile: {
    name: 'GrowthifyEdge',
    email: 'hr.esire.ai@gmail.com',
    company: 'GrowthifyEdge',
    role: 'Agency Owner',
  },
  seededAt: nowISO(),
})
