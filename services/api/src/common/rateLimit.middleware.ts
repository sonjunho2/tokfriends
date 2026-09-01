import type { Request, Response, NextFunction } from 'express';

const buckets = new Map<string, { tokens: number, ts: number }>();

export function rateLimit(opts: { key: (req: Request)=>string, capacity: number, refillPerSec: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = opts.key(req);
    const now = Date.now() / 1000;
    const b = buckets.get(key) || { tokens: opts.capacity, ts: now };
    // refill
    const delta = now - b.ts;
    b.tokens = Math.min(opts.capacity, b.tokens + delta * opts.refillPerSec);
    b.ts = now;
    if (b.tokens < 1) {
      return res.status(429).json({ error: 'RATE_LIMITED' });
    }
    b.tokens -= 1;
    buckets.set(key, b);
    next();
  };
}
