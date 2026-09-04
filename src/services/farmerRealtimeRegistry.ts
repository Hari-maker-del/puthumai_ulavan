export const FARMER_REALTIME_TABLES = [
  'farms',
  'crops',
  'expenses',
  'farmer_alerts',
  'recommendations',
  'fields',
] as const;

export type FarmerRealtimeTable =
  typeof FARMER_REALTIME_TABLES[number];

export const FARMER_REALTIME_EVENTS = [
  'INSERT',
  'UPDATE',
  'DELETE',
] as const;