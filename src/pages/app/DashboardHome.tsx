import WelcomeCard           from '@/components/dashboard/WelcomeCard';
import KpiStrip              from '@/components/dashboard/KpiStrip';
import WeatherCard           from '@/components/dashboard/WeatherCard';
import CropRecommendationCard from '@/components/dashboard/CropRecommendationCard';
import FarmOverview          from '@/components/dashboard/FarmOverview';
import ExpenseStatCard       from '@/components/dashboard/ExpenseStatCard';
import CropHealthScore       from '@/components/dashboard/CropHealthScore';
import ChartsSection         from '@/components/dashboard/ChartsSection';
import AIAssistantQuickPanel from '@/components/dashboard/AIAssistantQuickPanel';
import GovSchemesCard        from '@/components/dashboard/GovSchemesCard';
import RecentActivities      from '@/components/dashboard/RecentActivities';
import MarketplacePreview    from '@/components/dashboard/MarketplacePreview';
import FarmCommandCenter      from '@/components/dashboard/FarmCommandCenter';

export default function DashboardHome() {
  return (
    <div className="space-y-5">

      {/* ── Row 1: Welcome banner ── */}
      <WelcomeCard />

      {/* ── AI Farm Command Center ── */}
      <FarmCommandCenter />

      {/* ── Row 2: KPI Cards ── */}
      <KpiStrip />

      {/* ── Row 3: Weather | Crop Recommendation | Crop Health ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <WeatherCard />
        <CropRecommendationCard />
        <CropHealthScore />
      </div>

      {/* ── Row 4: Farm Overview | Expense Summary | AI Quick Panel ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <FarmOverview />
        </div>
        <div className="lg:col-span-1">
          <ExpenseStatCard />
        </div>
        <div className="lg:col-span-1">
          <AIAssistantQuickPanel />
        </div>
      </div>

      {/* ── Row 5: Charts (Income vs Expense + Expense Summary) ── */}
      <ChartsSection />

      {/* ── Row 6: Gov Schemes ── */}
      <GovSchemesCard />

      {/* ── Row 7: Marketplace Preview ── */}
      <MarketplacePreview />

      {/* ── Row 8: Recent Activity ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <RecentActivities />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-2">
              Live farm summary
            </div>
            <p className="text-sm text-ink-600">
              Financial and yield totals appear here only after real farm records are available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
