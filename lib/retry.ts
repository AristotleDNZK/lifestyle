function getErrorText(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export function isTransientNetworkError(error: unknown) {
  const text = getErrorText(error);

  return [
    "fetch failed",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
    "ECONNRESET",
    "UND_ERR_CONNECT_TIMEOUT",
  ].some((token) => text.includes(token));
}

export async function retryAsync<T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
) {
  const retries = options?.retries ?? 2;
  const delayMs = options?.delayMs ?? 400;
  const shouldRetry = options?.shouldRetry ?? isTransientNetworkError;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}
