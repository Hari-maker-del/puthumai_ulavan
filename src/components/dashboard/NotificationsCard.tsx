import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CloudRain, Leaf, Wallet, Bot, X } from 'lucide-react';
import Card from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as farmerAlertsService from '@/services/farmerAlertsService';

const typeMeta: Record<string, { icon: typeof CloudRain; bg: string; fg: string }> = {
  weather: { icon: CloudRain, bg: 'bg-accent-100', fg: 'text-accent-700' },
  crop: { icon: Leaf, bg: 'bg-brand-100', fg: 'text-brand-700' },
  expense: { icon: Wallet, bg: 'bg-amber-100', fg: 'text-amber-700' },
  ai: { icon: Bot, bg: 'bg-emerald-100', fg: 'text-emerald-700' },
};

export default function NotificationsCard() {
  const { user } = useAuth();
  const { data: items = [], refetch, loading } = useApiQuery(
    () => (user?.id ? farmerAlertsService.getAlerts(user.id) : Promise.resolve([])),
    Boolean(user?.id),
  );

  const dismiss = async (id: string) => {
    try {
      await farmerAlertsService.markAlertRead(id);
      await refetch();
    } catch {
      // swallow; UI will refresh on next poll
    }
  };

  const renderedNotifications = loading ? (
    <div className="text-center text-sm text-ink-600 py-6">Loading…</div>
  ) : (
    items.map((n) => {
      const meta = typeMeta[n.type];
      const Icon = meta.icon;
      return (
        <motion.li
          key={n.id}
          layout
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
          className="group flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-100 p-3 hover:border-brand-200 transition-colors"
        >
          <div className={`h-9 w-9 rounded-lg ${meta.bg} grid place-items-center flex-shrink-0`}>
            <Icon size={16} className={meta.fg} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink-900">{n.title}</div>
            <div className="text-xs text-ink-600 leading-snug mt-0.5">{n.detail}</div>
            <div className="text-[10px] text-ink-600/60 mt-1">{n.time}</div>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-800/30 hover:text-error-600"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </motion.li>
      );
    })
  );

  return (
    <Card padding="lg" className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-brand-50 grid place-items-center relative">
            <Bell size={17} className="text-brand-600" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-error-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="font-display font-bold text-ink-900">Notifications</div>
            <div className="text-xs text-ink-600">{items.length} new updates</div>
          </div>
        </div>
        <button className="text-xs font-bold text-brand-600 hover:text-brand-700">Mark all read</button>
      </div>

      <ul className="mt-4 space-y-2.5 flex-1">
        <AnimatePresence initial={false}>{renderedNotifications}</AnimatePresence>
        {(!loading && items.length === 0) && (
          <li className="text-center text-sm text-ink-600/60 py-8">No notifications yet</li>
        )}
      </ul>
    </Card>
  );
}
