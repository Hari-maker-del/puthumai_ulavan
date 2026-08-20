export interface SmartAlert {
  id: string;
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  action?: string;
  source: string;
  createdAt: string;
}

export interface SmartAlertInput {
  rainProbability?: number;
  temperatureC?: number;
  cropStage?: string;
  marketChangePct?: number;
  expenseChangePct?: number;
}

export function generateSmartAlerts(input: SmartAlertInput): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = new Date().toISOString();

  if (typeof input.rainProbability === 'number' && input.rainProbability >= 70) {
    alerts.push({
      id: 'rain-risk',
      severity: 'warning',
      title: 'High rain probability',
      message: 'Rain probability is high. Review irrigation and drainage before taking action.',
      action: 'Check irrigation and drainage',
      source: 'weather',
      createdAt: now,
    });
  }

  if (typeof input.temperatureC === 'number' && input.temperatureC >= 38) {
    alerts.push({
      id: 'heat-risk',
      severity: 'warning',
      title: 'Heat-stress risk',
      message: 'High temperature may increase crop water stress. Verify crop-specific guidance.',
      action: 'Inspect crop and water availability',
      source: 'weather',
      createdAt: now,
    });
  }

  if (input.cropStage?.toLowerCase().includes('flower')) {
    alerts.push({
      id: 'flowering-check',
      severity: 'info',
      title: 'Flowering-stage check',
      message: 'Your crop is in a sensitive stage. Inspect the field and record observations.',
      action: 'Open crop health',
      source: 'crop-lifecycle',
      createdAt: now,
    });
  }

  if (typeof input.marketChangePct === 'number' && Math.abs(input.marketChangePct) >= 10) {
    alerts.push({
      id: 'market-move',
      severity: input.marketChangePct > 0 ? 'info' : 'warning',
      title: 'Significant market movement',
      message: `Verified market data moved ${input.marketChangePct > 0 ? '+' : ''}${input.marketChangePct}%.`,
      action: 'Review market intelligence',
      source: 'market',
      createdAt: now,
    });
  }

  if (typeof input.expenseChangePct === 'number' && input.expenseChangePct >= 15) {
    alerts.push({
      id: 'expense-rise',
      severity: 'warning',
      title: 'Expense increase detected',
      message: `Recorded farm expenses are ${input.expenseChangePct}% above the comparison period.`,
      action: 'Review expenses',
      source: 'finance',
      createdAt: now,
    });
  }

  return alerts;
}
