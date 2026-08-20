export interface FarmReportData {
  farmerName: string;
  farmName?: string;
  crop?: string;
  season?: string;
  expenses?: number;
  expectedYield?: number;
  estimatedRevenue?: number;
  estimatedProfit?: number;
  notes?: string;
}

export function buildFarmReportText(data: FarmReportData): string {
  return [
    'PUTHUMAI UZHAVAN — FARM SEASON REPORT',
    '',
    `Farmer: ${data.farmerName}`,
    `Farm: ${data.farmName || 'Not specified'}`,
    `Crop: ${data.crop || 'Not specified'}`,
    `Season: ${data.season || 'Not specified'}`,
    '',
    `Expenses: ${data.expenses ?? 'Not available'}`,
    `Expected yield: ${data.expectedYield ?? 'Not available'}`,
    `Estimated revenue: ${data.estimatedRevenue ?? 'Not available'}`,
    `Estimated profit: ${data.estimatedProfit ?? 'Not available'}`,
    '',
    data.notes || 'Generated from the data currently available in Puthumai Uzhavan.',
  ].join('\n');
}
