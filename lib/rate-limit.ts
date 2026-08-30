/**
 * Rate Limiting for AI Endpoints
 * 
 * Uses Upstash Redis to implement sliding window rate limiting
 * Prevents abuse and controls API costs
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/nextjs";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limit configurations for different endpoints
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
  prefix: "@upstash/ratelimit/ai",
});

export const transactionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit/transactions",
});

export const budgetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 m"), // 50 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit/budgets",
});

export const exportRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 exports per minute
  analytics: true,
  prefix: "@upstash/ratelimit/exports",
});

export const freeTierRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 requests per hour for free users
  analytics: true,
  prefix: "@upstash/ratelimit/free",
});

export const premiumTierRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, "1 h"), // 200 requests per hour for premium
  analytics: true,
  prefix: "@upstash/ratelimit/premium",
});

/**
 * Rate limit result type
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when limit resets
}

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  identifier: string,
  limitType: 'ai' | 'transaction' | 'budget' | 'export' | 'free' | 'premium' = 'ai'
): Promise<RateLimitResult> {
  let ratelimit: Ratelimit;
  
  switch (limitType) {
    case 'transaction':
      ratelimit = transactionRateLimit;
      break;
    case 'budget':
      ratelimit = budgetRateLimit;
      break;
    case 'export':
      ratelimit = exportRateLimit;
      break;
    case 'free':
      ratelimit = freeTierRateLimit;
      break;
    case 'premium':
      ratelimit = premiumTierRateLimit;
      break;
    default:
      ratelimit = aiRateLimit;
  }
  
  const result = await ratelimit.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
  };
}

/**
 * Middleware helper for Next.js API routes
 */
export function createRateLimitMiddleware(
  limitType: 'ai' | 'transaction' | 'budget' | 'export' | 'free' | 'premium' = 'ai',
  getIdentifier: (request: Request) => string
) {
  return async function rateLimitMiddleware(request: Request): Promise<Response | null> {
    const identifier = getIdentifier(request);
    const result = await checkRateLimit(identifier, limitType);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            ...getRateLimitHeaders(result),
          },
        }
      );
    }
    
    return null;
  };
}

/**
 * Utility to extract user ID or IP from request
 */
export function getIdentifierFromRequest(request: Request): string {
  // Try to get user ID from headers (set by auth middleware)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  return `ip:${ip}`;
}
