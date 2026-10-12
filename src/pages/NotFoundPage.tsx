import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Leaf, LifeBuoy, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-[#f7f9f4] px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-4 rounded-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-white"><Leaf size={20} /></span>
          <span>புதுமை உழவன் <span className="block text-left text-xs font-medium text-slate-500">Puthumai Ulavan</span></span>
        </Link>

        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-emerald-800">
          <SearchX size={38} aria-hidden="true" />
        </div>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Error 404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">We couldn’t find that page</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          The page may have moved, the address may be incorrect, or the link may no longer exist. Your farm workspace is still available from the main navigation.
        </p>

        <div className="mt-5 max-w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requested address</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-700">{location.pathname}{location.search}</p>
        </div>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
            <Home size={17} aria-hidden="true" /> Go to home
          </Link>
          <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
            <ArrowLeft size={17} aria-hidden="true" /> Open dashboard
          </Link>
          <Link to="/help" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
            <LifeBuoy size={17} aria-hidden="true" /> Get help
          </Link>
        </div>
        <p className="mt-8 text-sm text-slate-500">If you followed a saved link, check the address or return to your dashboard.</p>
      </div>
    </main>
  );
}
