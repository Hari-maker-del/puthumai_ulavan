import React, { useEffect, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';
import { isOffline, getQueuedActions } from '../../services/offlineService';

export default function OfflineModePage() {
  const [offline, setOffline] = useState(isOffline());
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const update = () => { setOffline(isOffline()); setQueued(getQueuedActions().length); };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-emerald-600">Connectivity</p><h1 className="text-3xl font-bold">Offline Mode</h1><p className="mt-1 text-sm text-slate-600">Keep essential farm information available when connectivity is weak.</p></div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          {offline ? <CloudOff className="text-amber-600" /> : <Wifi className="text-emerald-600" />}
          <div><p className="font-semibold">{offline ? 'You are offline' : 'Connection available'}</p><p className="text-sm text-slate-500">{offline ? 'Cached information can remain available; live services will resume when you reconnect.' : 'Live services are available.'}</p></div>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">Queued offline actions: <strong>{queued}</strong></div>
      </div>
    </div>
  );
}
