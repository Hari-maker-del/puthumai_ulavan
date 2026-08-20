import type { RealtimeStatus } from '@/services/realtimeManager';
import type { SyncState } from '@/services/farmerSyncCoordinator';

export function FarmerLiveStatus({
  realtime,
  sync,
}: {
  realtime: RealtimeStatus;
  sync: SyncState;
}) {
  const live = realtime === 'SUBSCRIBED';
  const offline = realtime === 'DISABLED' || sync === 'OFFLINE';

  const label = offline
    ? 'Offline'
    : live
      ? 'Live'
      : realtime === 'RECONNECTING' || realtime === 'CONNECTING'
        ? 'Reconnecting'
        : 'Connection issue';

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
    >
      <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <span>{label}</span>
      {sync === 'SYNCING' && <span>• Syncing…</span>}
      {sync === 'SYNCED' && !offline && <span>• Synced</span>}
    </div>
  );
}
