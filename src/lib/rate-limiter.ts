import { type NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry> = new Map();
  config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.resetTime < now) {
        this.cache.delete(key);
      }
    }
  }

  private generateKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  check(identifier: string, endpoint: string = 'default'): { allowed: boolean; remaining: number; resetIn: number } {
    const key = this.generateKey(identifier, endpoint);
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || entry.resetTime < now) {
      this.cache.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetIn: this.config.windowMs,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  reset(identifier: string, endpoint: string = 'default') {
    const key = this.generateKey(identifier, endpoint);
    this.cache.delete(key);
  }
}

export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});

export const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

export const orderLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
});

export function getClientIdentifier(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}
