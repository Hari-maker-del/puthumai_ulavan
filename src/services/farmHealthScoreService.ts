export interface FarmHealthInputs {
  averageCropHealth?: number;
  openHighPriorityTasks?: number;
  activeAlerts?: number;
  expensePressure?: number;
  dataCompleteness?: number;
  weatherRisk?: number;
}

export interface FarmHealthScore {
  score: number;
  label: 'Excellent' | 'Good' | 'Watch' | 'At Risk';
  factors: Array<{ name: string; score: number; weight: number; detail: string }>;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function calculateFarmHealth(inputs: FarmHealthInputs): FarmHealthScore {
  const crop = clamp(inputs.averageCropHealth ?? 0);
  const tasks = inputs.openHighPriorityTasks === undefined
    ? 0
    : clamp(100 - inputs.openHighPriorityTasks * 15);
  const alerts = inputs.activeAlerts === undefined
    ? 0
    : clamp(100 - inputs.activeAlerts * 12);
  const expenses = inputs.expensePressure === undefined
    ? 0
    : clamp(100 - inputs.expensePressure * 100);
  const data = inputs.dataCompleteness === undefined
    ? 0
    : clamp(inputs.dataCompleteness * 100);
  const weather = inputs.weatherRisk === undefined
    ? 0
    : clamp(100 - inputs.weatherRisk * 100);

  const factors = [
    { name: 'Crop health', score: crop, weight: 0.30, detail: 'Average health of monitored fields.' },
    { name: 'Field tasks', score: tasks, weight: 0.15, detail: 'Open high-priority work reduces readiness.' },
    { name: 'Risk alerts', score: alerts, weight: 0.15, detail: 'Active alerts reduce the safety margin.' },
    { name: 'Expense pressure', score: expenses, weight: 0.15, detail: 'Higher cost pressure lowers the financial score.' },
    { name: 'Farm data completeness', score: data, weight: 0.10, detail: 'Better farm context enables better decisions.' },
    { name: 'Weather risk', score: weather, weight: 0.15, detail: 'Current weather risk is reflected in the score.' },
  ];

  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0));
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Watch' : 'At Risk';
  return { score, label, factors };
}
