import type { RealtimeStatus } from '@/services/realtimeManager';

const labels: Record<RealtimeStatus, string> = {
  DISABLED: 'Offline mode',
  CONNECTING: 'Connecting…',
  SUBSCRIBED: 'Live',
  RECONNECTING: 'Reconnecting…',
  ERROR: 'Connection issue',
  CLOSED: 'Offline mode',
};

export function RealtimeStatusBadge({ status }: { status: RealtimeStatus }) {
  const live = status === 'SUBSCRIBED';
  return (
    <span
      role="status"
      aria-live="polite"
      title={`Realtime status: ${labels[status]}`}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {labels[status]}
    </span>
  );
}
