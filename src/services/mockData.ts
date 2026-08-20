/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock API responses sourced from the existing dummy data.
// Returned by services while VITE_USE_MOCK is "true".
// Load dummy fixtures dynamically only when mock mode is used to avoid bundling in production.

import type {
  AuthResponse,
  DashboardResponse,
  ExpensesResponse,
  AddExpenseResponse,
  CropRecommendResponse,
  ChatResponse,
  ScannerResponse,
  YieldResponse,
  ReportResponse,
  ScanResult,
} from '@/services/types';

const uid = () => Math.random().toString(36).slice(2, 10);

export const mockLogin = async (): Promise<AuthResponse> => {
  const dd = await import('@/data/dummyData');
  const { farmerProfile } = dd;
  return {
    token: `mock-token-${uid()}`,
    user: {
      id: 'u-murugan',
      name: farmerProfile.name,
      email: 'murugan@puthumai.farm',
      plan: farmerProfile.plan,
      location: farmerProfile.location,
    },
  };
};

export const mockRegister = async (): Promise<AuthResponse> => {
  const dd = await import('@/data/dummyData');
  const { farmerProfile } = dd;
  return {
    token: `mock-token-${uid()}`,
    user: {
      id: `u-${uid()}`,
      name: farmerProfile.name,
      email: 'murugan@puthumai.farm',
      plan: 'Free',
      location: farmerProfile.location,
    },
  };
};

export const mockDashboard = async (): Promise<DashboardResponse> => {
  const dd = await import('@/data/dummyData');
  const { farmerProfile, kpis, finance, weather, fields, cropStatus, tasks, notifications, profitTrend, yieldTrend } = dd;
  return {
    farmerProfile,
    kpis,
    finance: {
      expectedRevenue: finance.expectedRevenue,
      revenueLastMonth: finance.revenueLastMonth,
      totalExpenses: finance.totalExpenses,
      expensesLastMonth: finance.expensesLastMonth,
      expectedProfit: finance.expectedProfit,
      profitMargin: 49.2,
      profitPerAcre: 8625,
    },
    weather,
    fields,
    cropStatus,
    tasks,
    notifications,
    profitTrend,
    yieldTrend,
  };
};

export const mockCropRecommend = async (): Promise<CropRecommendResponse> => {
  const dd = await import('@/data/dummyData');
  const { cropRecommendations } = dd;
  return {
    recommendations: cropRecommendations.map((item: any) => ({
      crop: item.crop,
      variety: item.variety,
      confidence: item.score,
      expectedYield: '',
      expectedRevenue: 0,
      expectedProfit: 0,
      marketDemand: item.marketDemand,
      waterRequirement: item.waterNeed,
      growingDuration: '',
      riskLevel: 'Medium',
      reason: item.reason,
      color: item.color,
    })),
  };
};

export const mockExpenses = async (): Promise<ExpensesResponse> => {
  const dd = await import('@/data/dummyData');
  const { expenses, expenseRows, expenseByCategory } = dd;
  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  return { rows: expenseRows, total, byCategory: expenseByCategory };
};

export const mockAddExpense = async (amount: number): Promise<AddExpenseResponse> => {
  const dd = await import('@/data/dummyData');
  const { expenses } = dd;
  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0) + amount;
  return {
    expense: {
      id: `x-${uid()}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      category: 'Other',
      description: 'New expense',
      field: 'Field A',
      amount,
    },
    total,
  };
};

export const mockChat = async (message: string): Promise<ChatResponse> => ({
  reply: {
    id: `a-${uid()}`,
    role: 'assistant',
    text: `Based on your field data, I recommend monitoring moisture levels for "${message.slice(0, 40)}". Apply 30 kg urea per acre and irrigate lightly after 24 hours if no rain is forecast.`,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  },
});

export const mockScanner = async (crop: string, field: string): Promise<ScannerResponse> => {
  const result: ScanResult = {
    crop,
    field,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    disease: null,
    confidence: 94,
    severity: 'None',
    treatment: 'No action needed. Field is healthy.',
    status: 'Healthy',
  };
  return { result };
};

export const mockYield = async (): Promise<YieldResponse> => {
  const dd = await import('@/data/dummyData');
  const { yieldFields, yieldTrend } = dd;
  return { fields: yieldFields, trend: yieldTrend };
};

export const mockReport = async (): Promise<ReportResponse> => {
  const dd = await import('@/data/dummyData');
  const { seasonSummary, seasonCrops, profitTrend } = dd;
  return { summary: seasonSummary, crops: seasonCrops, profitTrend };
};

export const mockChatSeed = async () => (await import('@/data/dummyData')).chatSeed;
export const mockScanResults = async () => (await import('@/data/dummyData')).scanResults;
