export function assertOwnedRecord<T extends Record<string, unknown>>(
  record: T | null | undefined,
  userId: string,
  ownerFields = ['user_id', 'owner_id', 'profile_id'],
): boolean {
  if (!record) return false;
  return ownerFields.some(field => record[field] === userId);
}
