export interface FarmDigitalTwin {
  farmId?: string;
  farmerId?: string;
  crop?: string;
  cropStage?: string;
  plantingDate?: string;
  areaAcres?: number;
  soilType?: string;
  irrigation?: string;
  weatherStatus?: string;
  marketStatus?: string;
  expenseTotal?: number;
  estimatedRevenue?: number;
  updatedAt: string;
}

export function buildFarmDigitalTwin(input: Omit<FarmDigitalTwin, 'updatedAt'>): FarmDigitalTwin {
  return { ...input, updatedAt: new Date().toISOString() };
}

export function twinCompleteness(twin: FarmDigitalTwin): number {
  const fields: Array<keyof FarmDigitalTwin> = [
    'crop', 'cropStage', 'plantingDate', 'areaAcres', 'soilType',
    'irrigation', 'weatherStatus', 'marketStatus', 'expenseTotal',
  ];
  const available = fields.filter(key => twin[key] !== undefined && twin[key] !== null && twin[key] !== '').length;
  return Math.round((available / fields.length) * 100);
}
