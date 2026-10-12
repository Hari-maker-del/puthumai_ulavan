import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { RecommendationProvider } from '@/context/RecommendationContext';
import { ToastProvider } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Leaf } from 'lucide-react';
import OnboardingRolePage from '@/pages/OnboardingRolePage';
import OnboardingFarmPage from '@/pages/OnboardingFarmPage';
import { I18nProvider } from '@/i18n/I18nContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const LandingPage            = lazy(() => import('@/pages/LandingPage'));
const LoginPage              = lazy(() => import('@/pages/LoginPage'));
const RegisterPage           = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage     = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage      = lazy(() => import('@/pages/ResetPasswordPage'));
const AuthCallbackPage       = lazy(() => import('@/pages/AuthCallbackPage'));
const VerifyEmailPage        = lazy(() => import('@/pages/VerifyEmailPage'));
const ProfessionalPage       = lazy(() => import('@/pages/ProfessionalPage'));
const NotFoundPage            = lazy(() => import('@/pages/NotFoundPage'));
const PageDirectoryPage       = lazy(() => import('@/pages/PageDirectoryPage'));
const DashboardLayout        = lazy(() => import('@/components/dashboard/DashboardLayout'));
const DashboardHome          = lazy(() => import('@/pages/app/DashboardHome'));
const FarmProfilePage        = lazy(() => import('@/pages/app/FarmProfilePage'));
const ProfilePage            = lazy(() => import('@/pages/app/ProfilePage'));
const WeatherPage            = lazy(() => import('@/pages/app/WeatherPage'));
const CropRecommendationPage = lazy(() => import('@/pages/app/CropRecommendationPage'));
const ExpenseTrackerPage     = lazy(() => import('@/pages/app/ExpenseTrackerPage'));
const AnalyticsPage          = lazy(() => import('@/pages/app/AnalyticsPage'));
const AIAssistantPage        = lazy(() => import('@/pages/app/AIAssistantPage'));
const CropHealthPage         = lazy(() => import('@/pages/app/CropHealthPage'));
const YieldPredictionPage    = lazy(() => import('@/pages/app/YieldPredictionPage'));
const SeasonReportPage       = lazy(() => import('@/pages/app/SeasonReportPage'));
const SettingsPage           = lazy(() => import('@/pages/app/SettingsPage'));
const AdminPanelPage         = lazy(() => import('@/pages/app/AdminPanelPage'));
const GovSchemesPage         = lazy(() => import('@/pages/app/GovSchemesPage'));
const MarketplacePage        = lazy(() => import('@/pages/app/ProductMarketplacePage'));
const FarmerMemoryPage       = lazy(() => import('@/pages/app/FarmerMemoryPage'));
const FarmingAlertsPage      = lazy(() => import('@/pages/app/FarmingAlertsPage'));
const MarketIntelligencePage = lazy(() => import('@/pages/app/MarketIntelligencePage'));
const DailyFarmPlanPage      = lazy(() => import('@/pages/app/DailyFarmPlanPage'));
const CropLifecyclePage      = lazy(() => import('@/pages/app/CropLifecyclePage'));
const NotificationsPage      = lazy(() => import('@/pages/app/NotificationsPage'));
const OfflineModePage        = lazy(() => import('@/pages/app/OfflineModePage'));
const FarmReportPage         = lazy(() => import('@/pages/app/FarmReportPage'));
const FarmIntelligencePage   = lazy(() => import('@/pages/app/FarmIntelligencePage'));
const FarmOutcomePage        = lazy(() => import('@/pages/app/FarmOutcomePage'));
const FarmHealthPage         = lazy(() => import('@/pages/app/FarmHealthPage'));

function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-brand-600 grid place-items-center animate-pulse">
          <Leaf size={22} className="text-white" />
        </div>
        <div className="text-sm font-semibold text-ink-600">Loading…</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
        <AuthProvider>
          <I18nProvider>
          <ToastProvider>
            <ExpenseProvider>
            <RecommendationProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/pages" element={<PageDirectoryPage />} />

                {/* Public information, help, legal and system pages */}
                <Route path="/about" element={<ProfessionalPage />} />
                <Route path="/features" element={<ProfessionalPage />} />
                <Route path="/services" element={<ProfessionalPage />} />
                <Route path="/pricing" element={<ProfessionalPage />} />
                <Route path="/contact" element={<ProfessionalPage />} />
                <Route path="/faq" element={<ProfessionalPage />} />
                <Route path="/help" element={<ProfessionalPage />} />
                <Route path="/blog" element={<ProfessionalPage />} />
                <Route path="/reviews" element={<ProfessionalPage />} />
                <Route path="/privacy" element={<ProfessionalPage />} />
                <Route path="/terms" element={<ProfessionalPage />} />
                <Route path="/cookies" element={<ProfessionalPage />} />
                <Route path="/accessibility" element={<ProfessionalPage />} />
                <Route path="/data-consent" element={<ProfessionalPage />} />
                <Route path="/system-status" element={<ProfessionalPage />} />
                <Route path="/maintenance" element={<ProfessionalPage />} />
                <Route path="/offline" element={<ProfessionalPage />} />
                <Route path="/network-error" element={<ProfessionalPage />} />
                <Route path="/session-expired" element={<ProfessionalPage />} />
                <Route path="/link-expired" element={<ProfessionalPage />} />
                <Route path="/account-suspended" element={<ProfessionalPage />} />
                <Route path="/unsubscribe" element={<ProfessionalPage />} />
                <Route path="/unsupported-browser" element={<ProfessionalPage />} />


                {/* Farmer education, data rights, and support pages */}
                <Route path="/how-it-works" element={<ProfessionalPage />} />
                <Route path="/for-farmers" element={<ProfessionalPage />} />
                <Route path="/crop-calendar" element={<ProfessionalPage />} />
                <Route path="/soil-health-guide" element={<ProfessionalPage />} />
                <Route path="/water-management" element={<ProfessionalPage />} />
                <Route path="/pest-management" element={<ProfessionalPage />} />
                <Route path="/market-prices" element={<ProfessionalPage />} />
                <Route path="/government-schemes" element={<ProfessionalPage />} />
                <Route path="/farmer-resources" element={<ProfessionalPage />} />
                <Route path="/community" element={<ProfessionalPage />} />
                <Route path="/success-stories" element={<ProfessionalPage />} />
                <Route path="/report-issue" element={<ProfessionalPage />} />
                <Route path="/security" element={<ProfessionalPage />} />
                <Route path="/data-export" element={<ProfessionalPage />} />
                <Route path="/delete-account" element={<ProfessionalPage />} />
                <Route path="/feedback" element={<ProfessionalPage />} />
                <Route path="/how-we-use-data" element={<ProfessionalPage />} />
                <Route path="/app-download" element={<ProfessionalPage />} />
                <Route path="/service-guidelines" element={<ProfessionalPage />} />
                <Route path="/accessibility-help" element={<ProfessionalPage />} />
                <Route path="/data-correction" element={<ProfessionalPage />} />
                <Route path="/weather-guidance" element={<ProfessionalPage />} />
                <Route path="/expense-guidance" element={<ProfessionalPage />} />
                <Route path="/yield-estimates" element={<ProfessionalPage />} />
                <Route path="/crop-planning" element={<ProfessionalPage />} />
                <Route path="/farm-records" element={<ProfessionalPage />} />

                {/* Friendly error destinations */}
                <Route path="/400" element={<ProfessionalPage />} />
                <Route path="/401" element={<ProfessionalPage />} />
                <Route path="/403" element={<ProfessionalPage />} />
                <Route path="/404" element={<ProfessionalPage />} />
                <Route path="/408" element={<ProfessionalPage />} />
                <Route path="/429" element={<ProfessionalPage />} />
                <Route path="/500" element={<ProfessionalPage />} />
                <Route path="/502" element={<ProfessionalPage />} />
                <Route path="/503" element={<ProfessionalPage />} />
                <Route path="/504" element={<ProfessionalPage />} />

                {/* Authentication */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<RegisterPage />} />
                <Route path="/register" element={<Navigate to="/signup" replace />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/onboarding/role" element={<ProtectedRoute><OnboardingRolePage /></ProtectedRoute>} />
                <Route path="/onboarding/farm" element={<ProtectedRoute><OnboardingFarmPage /></ProtectedRoute>} />

                {/* Authenticated farmer workspace */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="weather" element={<WeatherPage />} />
                  <Route path="crops" element={<CropRecommendationPage />} />
                  <Route path="expenses" element={<ExpenseTrackerPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="chatbot" element={<AIAssistantPage />} />
                  <Route path="crop-health" element={<CropHealthPage />} />
                  <Route path="yield-prediction" element={<YieldPredictionPage />} />
                  <Route path="season-report" element={<SeasonReportPage />} />
                  <Route path="farm-profile" element={<FarmProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="admin" element={<AdminPanelPage />} />
                  <Route path="schemes" element={<GovSchemesPage />} />
                  <Route path="marketplace" element={<MarketplacePage />} />
                  <Route path="farmer-memory" element={<FarmerMemoryPage />} />
                  <Route path="alerts" element={<FarmingAlertsPage />} />
                  <Route path="market-intelligence" element={<MarketIntelligencePage />} />
                  <Route path="daily-plan" element={<DailyFarmPlanPage />} />
                  <Route path="crop-lifecycle" element={<CropLifecyclePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="offline" element={<OfflineModePage />} />
                  <Route path="farm-report" element={<FarmReportPage />} />
                  <Route path="farm-intelligence" element={<FarmIntelligencePage />} />
                  <Route path="farm-outcomes" element={<FarmOutcomePage />} />
                  <Route path="farm-health" element={<FarmHealthPage />} />
                </Route>

                {/* Backwards-compatible routes */}
                <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                <Route path="/app/farmer-memory" element={<Navigate to="/dashboard/farmer-memory" replace />} />
                <Route path="/app/alerts" element={<Navigate to="/dashboard/alerts" replace />} />
                <Route path="/app/market-intelligence" element={<Navigate to="/dashboard/market-intelligence" replace />} />
                <Route path="/app/daily-plan" element={<Navigate to="/dashboard/daily-plan" replace />} />
                <Route path="/app/crop-lifecycle" element={<Navigate to="/dashboard/crop-lifecycle" replace />} />
                <Route path="/app/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
                <Route path="/app/offline" element={<Navigate to="/dashboard/offline" replace />} />
                <Route path="/app/farm-report" element={<Navigate to="/dashboard/farm-report" replace />} />
                <Route path="/app/farm-intelligence" element={<Navigate to="/dashboard/farm-intelligence" replace />} />
                <Route path="/app/farm-outcomes" element={<Navigate to="/dashboard/farm-outcomes" replace />} />
                <Route path="/app/farm-health" element={<Navigate to="/dashboard/farm-health" replace />} />
                <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />

                {/* Keep the catch-all last so unknown URLs get a real 404 page. */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </RecommendationProvider>
            </ExpenseProvider>
          </ToastProvider>
          </I18nProvider>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
