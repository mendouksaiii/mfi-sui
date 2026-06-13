/**
 * Retry with exponential backoff for transient network failures.
 *
 * Testnet RPC and the Walrus HTTP endpoints occasionally drop a request
 * ("fetch failed", ECONNRESET, 5xx). These are almost always transient, so a
 * few backed-off retries turn a failed cycle into a brief pause. Permanent
 * errors (a reverted Move call, a 4xx) are not retried — they re-throw on the
 * first attempt would just repeat, so we only retry on the patterns below.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TRANSIENT = /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network|timeout|503|502|504|429/i;

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT.test(msg);
}

/**
 * Run `fn`, retrying transient failures up to `tries` times with exponential
 * backoff (250ms, 500ms, 1s, …). Non-transient errors throw immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { tries = 4, base = 250, label = 'op' }: { tries?: number; base?: number; label?: string } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === tries - 1) throw err;
      const delay = base * 2 ** attempt;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ↻ ${label}: transient error (${msg.slice(0, 40)}), retry ${attempt + 1}/${tries - 1} in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}
