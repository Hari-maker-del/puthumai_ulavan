import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, CircleHelp, Leaf, ShieldCheck, Sprout, Wrench } from 'lucide-react';

type PageLink = { label: string; path: string; note?: string };
type PageGroup = { title: string; description: string; icon: typeof Leaf; pages: PageLink[] };

const groups: PageGroup[] = [
  {
    title: 'Discover Puthumai Ulavan',
    description: 'Learn about the product, its tools and how to get support.',
    icon: Leaf,
    pages: [
      { label: 'About us', path: '/about' },
      { label: 'Features', path: '/features' },
      { label: 'Services', path: '/services' },
      { label: 'Pricing and access', path: '/pricing' },
      { label: 'Contact', path: '/contact' },
      { label: 'Frequently asked questions', path: '/faq' },
      { label: 'Help center', path: '/help' },
      { label: 'Farming blog and resources', path: '/blog' },
      { label: 'Farmer feedback and reviews', path: '/reviews' },
      { label: 'How it works', path: '/how-it-works' },
      { label: 'For farmers', path: '/for-farmers' },
      { label: 'Mobile app information', path: '/app-download' },
    ],
  },
  {
    title: 'Farming guides',
    description: 'Practical reference pages for planning and day-to-day farm decisions.',
    icon: BookOpen,
    pages: [
      { label: 'Crop calendar', path: '/crop-calendar' },
      { label: 'Soil health guide', path: '/soil-health-guide' },
      { label: 'Water management', path: '/water-management' },
      { label: 'Pest management', path: '/pest-management' },
      { label: 'Market prices', path: '/market-prices' },
      { label: 'Government schemes', path: '/government-schemes' },
      { label: 'Farmer resources', path: '/farmer-resources' },
      { label: 'Farmer community', path: '/community' },
      { label: 'Success stories', path: '/success-stories' },
      { label: 'Weather guidance', path: '/weather-guidance' },
      { label: 'Expense guidance', path: '/expense-guidance' },
      { label: 'Yield estimates', path: '/yield-estimates' },
      { label: 'Crop planning', path: '/crop-planning' },
      { label: 'Farm records guide', path: '/farm-records' },
      { label: 'Responsible-use guidelines', path: '/service-guidelines' },
    ],
  },
  {
    title: 'Account, privacy and support',
    description: 'Account help, data rights, security and accessibility information.',
    icon: ShieldCheck,
    pages: [
      { label: 'Privacy policy', path: '/privacy' },
      { label: 'Terms and conditions', path: '/terms' },
      { label: 'Cookie and storage preferences', path: '/cookies' },
      { label: 'Accessibility statement', path: '/accessibility' },
      { label: 'Data consent information', path: '/data-consent' },
      { label: 'Security and account safety', path: '/security' },
      { label: 'Request a data export', path: '/data-export', note: 'Support-assisted request' },
      { label: 'Request account deletion', path: '/delete-account', note: 'Support-assisted request' },
      { label: 'Feedback', path: '/feedback' },
      { label: 'How we use data', path: '/how-we-use-data' },
      { label: 'Report an issue', path: '/report-issue' },
      { label: 'Accessibility help', path: '/accessibility-help' },
      { label: 'Correct account or farm data', path: '/data-correction' },
      { label: 'Unsubscribe information', path: '/unsubscribe', note: 'No preference is changed on this page' },
    ],
  },
  {
    title: 'System and recovery',
    description: 'Recovery guidance for connection, account and service problems.',
    icon: Wrench,
    pages: [
      { label: 'System status', path: '/system-status', note: 'Live monitoring is not connected' },
      { label: 'Maintenance notice', path: '/maintenance' },
      { label: 'Offline help', path: '/offline' },
      { label: 'Network error', path: '/network-error' },
      { label: 'Session expired', path: '/session-expired' },
      { label: 'Expired link', path: '/link-expired' },
      { label: 'Account suspended', path: '/account-suspended' },
      { label: 'Unsupported browser', path: '/unsupported-browser' },
      { label: '400 — Invalid request', path: '/400' },
      { label: '401 — Sign-in required', path: '/401' },
      { label: '403 — Access denied', path: '/403' },
      { label: '404 — Page not found', path: '/404' },
      { label: '408 — Request timeout', path: '/408' },
      { label: '429 — Too many requests', path: '/429' },
      { label: '500 — Internal error', path: '/500' },
      { label: '502 — Service connection error', path: '/502' },
      { label: '503 — Service unavailable', path: '/503' },
      { label: '504 — Gateway timeout', path: '/504' },
    ],
  },
];

const farmerTools: PageLink[] = [
  { label: 'Dashboard home', path: '/dashboard' },
  { label: 'Profile', path: '/dashboard/profile' },
  { label: 'Farm profile', path: '/dashboard/farm-profile' },
  { label: 'Weather', path: '/dashboard/weather' },
  { label: 'Crop recommendation', path: '/dashboard/crops' },
  { label: 'Crop health', path: '/dashboard/crop-health' },
  { label: 'Crop lifecycle', path: '/dashboard/crop-lifecycle' },
  { label: 'Daily farm plan', path: '/dashboard/daily-plan' },
  { label: 'Yield prediction', path: '/dashboard/yield-prediction' },
  { label: 'Expense tracker', path: '/dashboard/expenses' },
  { label: 'Analytics', path: '/dashboard/analytics' },
  { label: 'Season report', path: '/dashboard/season-report' },
  { label: 'Farm report', path: '/dashboard/farm-report' },
  { label: 'Farm intelligence', path: '/dashboard/farm-intelligence' },
  { label: 'Farm outcomes', path: '/dashboard/farm-outcomes' },
  { label: 'Farm health', path: '/dashboard/farm-health' },
  { label: 'AI assistant', path: '/dashboard/chatbot' },
  { label: 'Market intelligence', path: '/dashboard/market-intelligence' },
  { label: 'Marketplace', path: '/dashboard/marketplace' },
  { label: 'Government schemes directory', path: '/dashboard/schemes' },
  { label: 'Farmer memory', path: '/dashboard/farmer-memory' },
  { label: 'Farming alerts', path: '/dashboard/alerts' },
  { label: 'Notifications', path: '/dashboard/notifications' },
  { label: 'Settings', path: '/dashboard/settings' },
  { label: 'Offline mode', path: '/dashboard/offline' },
];

function PageCard({ page }: { page: PageLink }) {
  return (
    <Link
      to={page.path}
      className="group flex min-h-16 items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{page.label}</span>
        {page.note && <span className="mt-1 block text-xs leading-5 text-slate-500">{page.note}</span>}
        <span className="mt-1 block break-all text-xs text-slate-400">{page.path}</span>
      </span>
      <ArrowUpRight size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400 transition group-hover:text-emerald-700" />
    </Link>
  );
}

export default function PageDirectoryPage() {
  const totalPublicPages = groups.reduce((sum, group) => sum + group.pages.length, 0);

  return (
    <main className="min-h-screen bg-[#f7f9f4] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg font-bold text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-white"><Leaf size={20} /></span>
              <span>புதுமை உழவன் <span className="block text-xs font-medium text-slate-500">Puthumai Ulavan</span></span>
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Page directory</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find your page</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Browse the public information pages, farming guides, support resources and system recovery pages currently wired into the website.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Sign in</Link>
            <Link to="/dashboard" className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Open farmer workspace</Link>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6" aria-label="Directory coverage">
          <div className="flex items-start gap-3">
            <CircleHelp size={22} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">What this directory confirms</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {totalPublicPages} public information and recovery destinations are linked below. A listed route means the page is reachable in the app; it does not mean every item is an interactive workflow. Pages that still need a real form, live monitoring or a connected service are labelled.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <section key={group.title} aria-labelledby={group.title.replace(/\s+/g, '-').toLowerCase()}>
                <div className="mb-4 flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><GroupIcon size={20} aria-hidden="true" /></span>
                  <div>
                    <h2 id={group.title.replace(/\s+/g, '-').toLowerCase()} className="text-lg font-bold">{group.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.pages.map((page) => <PageCard key={page.path} page={page} />)}
                </div>
              </section>
            );
          })}

          <section aria-labelledby="farmer-workspace">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><Sprout size={20} aria-hidden="true" /></span>
              <div>
                <h2 id="farmer-workspace" className="text-lg font-bold">Farmer workspace</h2>
                <p className="mt-1 text-sm text-slate-600">These tools require sign-in. If you are not signed in, the app will send you to the login flow.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {farmerTools.map((page) => <PageCard key={page.path} page={page} />)}
            </div>
          </section>
        </div>

        <footer className="mt-10 border-t border-emerald-100 pt-6 text-sm text-slate-500">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/" className="hover:text-emerald-800">Home</Link>
            <Link to="/help" className="hover:text-emerald-800">Help</Link>
            <Link to="/privacy" className="hover:text-emerald-800">Privacy</Link>
            <Link to="/accessibility" className="hover:text-emerald-800">Accessibility</Link>
            <Link to="/contact" className="hover:text-emerald-800">Contact</Link>
          </div>
          <p className="mt-4">Puthumai Ulavan — all page links in one place.</p>
        </footer>
      </div>
    </main>
  );
}
