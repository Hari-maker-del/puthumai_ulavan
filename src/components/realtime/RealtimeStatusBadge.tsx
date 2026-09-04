import type { RealtimeStatus } from '@/services/realtimeService';

export function RealtimeStatusBadge({ status }: { status: RealtimeStatus }) {
  const label = status === 'SUBSCRIBED' ? 'Live' :
    status === 'CONNECTING' ? 'Connecting…' :
    status === 'ERROR' ? 'Reconnecting…' :
    status === 'CLOSED' ? 'Offline' :
    'Unavailable';

  const className = status === 'SUBSCRIBED'
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : status === 'ERROR'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`} aria-live="polite">
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'SUBSCRIBED' ? 'bg-emerald-500' : status === 'ERROR' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {label}
    </span>
  );
}
