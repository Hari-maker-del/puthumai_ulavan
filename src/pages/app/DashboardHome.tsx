import WelcomeCard from '@/components/dashboard/WelcomeCard';
import KpiStrip from '@/components/dashboard/KpiStrip';
import WeatherCard from '@/components/dashboard/WeatherCard';
import CropRecommendationCard from '@/components/dashboard/CropRecommendationCard';
import FarmOverview from '@/components/dashboard/FarmOverview';
import ExpenseStatCard from '@/components/dashboard/ExpenseStatCard';
import CropHealthScore from '@/components/dashboard/CropHealthScore';
import ChartsSection from '@/components/dashboard/ChartsSection';
import AIAssistantQuickPanel from '@/components/dashboard/AIAssistantQuickPanel';
import FarmCommandCenter from '@/components/dashboard/FarmCommandCenter';

export default function DashboardHome() {
  return (
    <div className="space-y-5">
      <WelcomeCard />
      <FarmCommandCenter />

      <KpiStrip />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <WeatherCard />
        <CropRecommendationCard />
        <CropHealthScore />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <FarmOverview />
        <ExpenseStatCard />
        <AIAssistantQuickPanel />
      </div>

      <ChartsSection />

      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-ink-600">
        Dashboard summaries use authenticated farm, crop, expense, weather and recommendation records only.
        Empty or unavailable live data is shown as empty rather than replaced with demo values.
      </div>
    </div>
  );
}
