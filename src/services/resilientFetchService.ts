export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function resilientFetch<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const base = Math.max(100, options.baseDelayMs ?? 500);
  const max = Math.max(base, options.maxDelayMs ?? 8000);

  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === attempts - 1) break;
      const delay = Math.min(base * 2 ** i, max);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
