import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import BottomNav from '@/components/dashboard/BottomNav';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { CloudOff } from 'lucide-react';

export default function DashboardLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const realtimeRefreshKey = useRealtimeDashboard(user?.id);

  useEffect(() => {
    if (authLoading || !user) return;
    const meta = user.user_metadata ?? {};
    if (meta.onboarding_completed === true) return;
    if (meta.role === 'farmer') navigate('/onboarding/farm', { replace: true });
    else if (!meta.role && location.pathname === '/dashboard') navigate('/onboarding/role', { replace: true });
  }, [authLoading, user, navigate, location.pathname]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />
          {offline && (
            <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 flex items-center gap-2">
              <CloudOff size={15} className="shrink-0" />
              <span><strong>Offline mode:</strong> cached farm information remains available. Live weather, AI and market services will resume when you reconnect.</span>
            </div>
          )}
          <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto w-full">
            <Outlet key={realtimeRefreshKey} />
          </main>
        </div>
      </div>

      <BottomNav />
    </ProtectedRoute>
  );
}
