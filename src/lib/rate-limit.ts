interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting login attempts
const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Check whether a given key has exceeded the allowed attempts.
 * @param key Identifier (e.g., email or IP)
 * @param limit Max allowed attempts in the window (default 5)
 * @param windowMs Window duration in milliseconds (default 15 minutes)
 */
export function checkRateLimit(
  key: string,
  limit = 5
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: limit,
      retryAfterSeconds: 0,
    }
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    }
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterSeconds: 0,
  }
}

/**
 * Record a failed attempt for a given key.
 */
export function recordFailedAttempt(
  key: string,
  windowMs = 15 * 60 * 1000
): void {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
  } else {
    entry.count += 1
  }
}

/**
 * Reset rate limit count upon successful login.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Clear all rate limit entries (for testing).
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear()
}
