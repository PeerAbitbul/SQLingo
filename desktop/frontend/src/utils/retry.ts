/**
 * Retry utility for handling failed operations
 * Provides exponential backoff and configurable retry logic
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  shouldRetry: (error: any) => {
    // Default: retry on network errors, timeouts, and 5xx server errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      return true;
    }
    if (error?.response?.status >= 500 && error?.response?.status < 600) {
      return true;
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration options
 * @returns Promise with the result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === config.maxAttempts;
      if (isLastAttempt || !config.shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.delayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );

      // Call retry callback
      config.onRetry(error, attempt);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry configuration for specific scenarios
 */
export const RetryPresets = {
  // For database connections
  database: {
    maxAttempts: 3,
    delayMs: 2000,
    backoffMultiplier: 2,
    shouldRetry: (error: any) => {
      // Retry on connection errors
      const errorMsg = String(error?.message || error).toLowerCase();
      return (
        errorMsg.includes('connection') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('econnrefused') ||
        errorMsg.includes('network')
      );
    },
  } as RetryOptions,

  // For AI API calls
  aiApi: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: any) => {
      // Retry on rate limits and server errors
      const status = error?.response?.status;
      return (
        status === 429 || // Rate limit
        status === 503 || // Service unavailable
        status === 504 || // Gateway timeout
        (status >= 500 && status < 600) // Other server errors
      );
    },
  } as RetryOptions,

  // For query execution
  query: {
    maxAttempts: 2, // Only retry once for queries
    delayMs: 500,
    backoffMultiplier: 1,
    shouldRetry: (error: any) => {
      // Only retry on transient errors
      const errorMsg = String(error?.message || error).toLowerCase();
      return (
        errorMsg.includes('deadlock') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('connection lost')
      );
    },
  } as RetryOptions,
};
