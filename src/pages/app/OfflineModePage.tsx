import React, { useEffect, useState } from 'react';
import { CloudOff, Wifi, RefreshCw, Database, CheckCircle2 } from 'lucide-react';
import { getTotalQueuedActions, isOffline, subscribeOfflineState } from '../../services/offlineService';
import { flushOfflineQueue } from '../../services/offlineSyncCoordinator';

export default function OfflineModePage() {
  const [offline, setOffline] = useState(isOffline());
  const [queued, setQueued] = useState(getTotalQueuedActions());
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const refreshStatus = () => {
    setOffline(isOffline());
    setQueued(getTotalQueuedActions());
  };

  useEffect(() => {
    const unsubscribe = subscribeOfflineState((value) => {
      setOffline(value);
      setQueued(getTotalQueuedActions());
    });
    const onSynced = () => {
      setQueued(getTotalQueuedActions());
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSyncing(false);
    };
    window.addEventListener('puthumai-offline-synced', onSynced);
    refreshStatus();
    return () => {
      unsubscribe();
      window.removeEventListener('puthumai-offline-synced', onSynced);
    };
  }, []);

  const syncNow = async () => {
    if (offline || syncing) return;
    setSyncing(true);
    await flushOfflineQueue();
    setQueued(getTotalQueuedActions());
    setSyncing(false);
    setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600">Connectivity</p>
        <h1 className="text-3xl font-bold">Offline Mode</h1>
        <p className="mt-1 text-sm text-slate-600">Keep essential farm information available when connectivity is weak.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          {offline ? <CloudOff className="text-amber-600" /> : <Wifi className="text-emerald-600" />}
          <div>
            <p className="font-semibold">{offline ? 'You are offline' : 'Connection available'}</p>
            <p className="text-sm text-slate-500">
              {offline
                ? 'Saved farm information remains available. New changes will sync automatically when you reconnect.'
                : 'Live services are available. Any saved offline changes will sync automatically.'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Database size={17} /> Pending sync</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{queued}</div>
            <p className="mt-1 text-xs text-slate-500">Changes waiting for a connection</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={17} /> Local data</div>
            <div className="mt-1 text-sm font-semibold text-emerald-900">Available offline</div>
            <p className="mt-1 text-xs text-emerald-700">Previously loaded farm data is cached on this device.</p>
          </div>
        </div>

        {lastSynced && <p className="mt-4 text-xs text-slate-500">Last sync check: {lastSynced}</p>}

        {!offline && queued > 0 && (
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing changes…' : 'Sync changes now'}
          </button>
        )}
      </div>
    </div>
  );
}
