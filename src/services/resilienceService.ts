export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 4000,
};

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === policy.maxAttempts) break;
      const delay = Math.min(policy.baseDelayMs * 2 ** (attempt - 1), policy.maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
