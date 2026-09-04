export type AppRole = 'farmer' | 'officer' | 'admin';

export function canAccessAdmin(role: AppRole | null | undefined): boolean {
  return role === 'admin';
}

export function canAccessOfficer(role: AppRole | null | undefined): boolean {
  return role === 'admin' || role === 'officer';
}
