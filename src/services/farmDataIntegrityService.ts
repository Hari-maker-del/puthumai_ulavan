export interface FarmIntegrityResult {
  valid: boolean;
  issues: string[];
}

export function validateFarmRecord(record: Record<string, unknown>): FarmIntegrityResult {
  const issues: string[] = [];

  if (!record) return { valid: false, issues: ['Farm record is missing.'] };

  if ('area' in record && record.area != null && Number(record.area) < 0) {
    issues.push('Farm area cannot be negative.');
  }

  if ('planting_date' in record && record.planting_date) {
    const date = new Date(String(record.planting_date));
    if (Number.isNaN(date.getTime())) issues.push('Planting date is invalid.');
    if (date.getTime() > Date.now()) issues.push('Planting date cannot be in the future.');
  }

  return { valid: issues.length === 0, issues };
}
