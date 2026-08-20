export interface OfflineOperation {
  id: string;
  idempotencyKey: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

const KEY = 'puthumai-ulavan:offline-operations';

function read(): OfflineOperation[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function write(items: OfflineOperation[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueueOfflineOperation(
  input: Omit<OfflineOperation, 'id' | 'createdAt' | 'attempts'>,
): OfflineOperation {
  const items = read();
  const existing = items.find(item => item.idempotencyKey === input.idempotencyKey);
  if (existing) return existing;

  const operation: OfflineOperation = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  items.push(operation);
  write(items);
  return operation;
}

export function getOfflineOperations(): OfflineOperation[] {
  return read();
}

export function removeOfflineOperation(id: string) {
  write(read().filter(item => item.id !== id));
}

export function markOfflineAttempt(id: string) {
  write(read().map(item => item.id === id ? { ...item, attempts: item.attempts + 1 } : item));
}
