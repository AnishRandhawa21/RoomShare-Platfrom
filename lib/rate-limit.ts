/**
 * Production In-Memory Sliding Window Rate Limiter
 * Guards sensitive server actions and endpoints against abuse, brute forcing, and spam.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Remove timestamps older than 1 hour
      record.timestamps = record.timestamps.filter((t) => now - t < 3600000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Checks whether an action key exceeds the allowed rate limit.
 *
 * @param key Unique identifier (e.g., `auth:192.168.1.1` or `review:usr_123`)
 * @param maxRequests Maximum number of permitted actions in the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((time) => now - time < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  // Record current request timestamp
  record.timestamps.push(now);

  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Rate limit helpers for key application flows
 */
export const rateLimiters = {
  // 5 authentication attempts per 15 minutes
  auth: (identifier: string) =>
    checkRateLimit(`auth:${identifier}`, 5, 15 * 60 * 1000),

  // 5 reviews per hour per user
  review: (userId: string) =>
    checkRateLimit(`review:${userId}`, 5, 60 * 60 * 1000),

  // 5 reports per hour per user/IP
  report: (identifier: string) =>
    checkRateLimit(`report:${identifier}`, 5, 60 * 60 * 1000),

  // 10 contact / owner enquiries per hour per identifier
  enquiry: (identifier: string) =>
    checkRateLimit(`enquiry:${identifier}`, 10, 60 * 60 * 1000),

  // 10 roommate interest applications per hour per user
  roommateInterest: (userId: string) =>
    checkRateLimit(`interest:${userId}`, 10, 60 * 60 * 1000),
};
