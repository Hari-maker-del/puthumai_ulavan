export interface FarmHealthInputs {
  averageCropHealth?: number;
  openHighPriorityTasks?: number;
  activeAlerts?: number;
  expensePressure?: number; // 0..1, where 1 is high pressure
  dataCompleteness?: number; // 0..1
  weatherRisk?: number; // 0..1
}

export interface FarmHealthScore {
  score: number;
  label: 'Excellent' | 'Good' | 'Watch' | 'At Risk';
  factors: Array<{ name: string; score: number; weight: number; detail: string }>;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function calculateFarmHealth(inputs: FarmHealthInputs): FarmHealthScore {
  const crop = clamp(inputs.averageCropHealth ?? 70);
  const tasks = clamp(100 - (inputs.openHighPriorityTasks ?? 0) * 15);
  const alerts = clamp(100 - (inputs.activeAlerts ?? 0) * 12);
  const expenses = clamp(100 - (inputs.expensePressure ?? 0) * 100);
  const data = clamp((inputs.dataCompleteness ?? 0.7) * 100);
  const weather = clamp(100 - (inputs.weatherRisk ?? 0.2) * 100);

  const factors = [
    { name: 'Crop health', score: crop, weight: 0.30, detail: 'Average health of monitored fields.' },
    { name: 'Field tasks', score: tasks, weight: 0.15, detail: 'Open high-priority work reduces readiness.' },
    { name: 'Risk alerts', score: alerts, weight: 0.15, detail: 'Active alerts reduce the safety margin.' },
    { name: 'Expense pressure', score: expenses, weight: 0.15, detail: 'Higher cost pressure lowers the financial score.' },
    { name: 'Farm data completeness', score: data, weight: 0.10, detail: 'Better farm context enables better decisions.' },
    { name: 'Weather risk', score: weather, weight: 0.15, detail: 'Current weather risk is reflected in the score.' },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Watch' : 'At Risk';
  return { score, label, factors };
}
