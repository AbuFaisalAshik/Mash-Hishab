// In-memory sliding-window rate limiter for brute-force defense

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const limitStore = new Map<string, RateLimitRecord>();

/**
 * Check and record an attempt
 * @param key unique identifier (e.g. `login:${ip}:${email}`)
 * @param maxAttempts maximum allowed attempts in window
 * @param windowMs time window in milliseconds (e.g. 15 minutes)
 * @param blockDurationMs block duration if limit exceeded (e.g. 15 minutes)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): { allowed: boolean; retryAfterSeconds?: number; remainingAttempts?: number } {
  const now = Date.now();
  const record = limitStore.get(key);

  if (!record) {
    limitStore.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Window expired, reset
  if (now - record.firstAttempt > windowMs) {
    limitStore.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Increment
  record.count += 1;
  if (record.count > maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.count };
}

/**
 * Reset rate limit counter on successful action
 */
export function resetRateLimit(key: string): void {
  limitStore.delete(key);
}
