import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { FarmNotification, loadNotifications, saveNotifications } from '../../services/notificationService';

export default function NotificationsPage() {
  const [items, setItems] = useState<FarmNotification[]>([]);
  useEffect(() => setItems(loadNotifications()), []);

  const markAll = () => {
    const next = items.map(item => ({ ...item, read: true }));
    setItems(next); saveNotifications(next);
  };
  const clear = () => { setItems([]); saveNotifications([]); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-medium text-emerald-600">Farm updates</p><h1 className="text-3xl font-bold">Notifications</h1></div>
        <div className="flex gap-2">
          <button onClick={markAll} className="rounded-xl border px-4 py-2 text-sm"><CheckCheck className="mr-2 inline h-4 w-4" />Mark all read</button>
          <button onClick={clear} className="rounded-xl border px-4 py-2 text-sm"><Trash2 className="mr-2 inline h-4 w-4" />Clear</button>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-500"><Bell className="mx-auto mb-3 h-8 w-8" />No notifications yet.</div>
        ) : items.map(item => (
          <div key={item.id} className={`border-b py-4 last:border-b-0 ${item.read ? '' : 'bg-emerald-50/40'}`}>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-600">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
