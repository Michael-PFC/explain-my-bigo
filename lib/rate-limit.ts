import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

type RateLimitResult =
  | { allowed: true; remainingMinute: number; remainingDay: number }
  | {
      allowed: false;
      retryAfterSec: number;
      reason: "blocked" | "limit_exceeded";
    };

const LIMIT_PER_MINUTE = 20;
const LIMIT_PER_DAY = 1000;

function blockDurationFromStrikes(strikes: number) {
  if (strikes <= 1) return 60; // 1 min
  if (strikes === 2) return 5 * 60; // 5 min
  if (strikes === 3) return 30 * 60; // 30 min
  return 24 * 60 * 60; // 24h
}

export async function enforceRateLimit(ip: string): Promise<RateLimitResult> {
  if (!redis) {
    // Sem Redis configurado: não bloqueia em dev/local
    return {
      allowed: true,
      remainingMinute: LIMIT_PER_MINUTE,
      remainingDay: LIMIT_PER_DAY,
    };
  }

  const safeIp = ip || "unknown";
  const blockKey = `rl:block:${safeIp}`;
  const minuteKey = `rl:cnt:1m:${safeIp}`;
  const dayKey = `rl:cnt:1d:${safeIp}`;
  const strikeKey = `rl:strike:${safeIp}`;

  const currentBlockTtl = await redis.ttl(blockKey);
  if (typeof currentBlockTtl === "number" && currentBlockTtl > 0) {
    return {
      allowed: false,
      retryAfterSec: currentBlockTtl,
      reason: "blocked",
    };
  }

  const minuteCount = Number(await redis.incr(minuteKey));
  if (minuteCount === 1) await redis.expire(minuteKey, 60);

  const dayCount = Number(await redis.incr(dayKey));
  if (dayCount === 1) await redis.expire(dayKey, 86400);

  if (minuteCount > LIMIT_PER_MINUTE || dayCount > LIMIT_PER_DAY) {
    const strikes = Number(await redis.incr(strikeKey));
    if (strikes === 1) await redis.expire(strikeKey, 86400);

    const blockSec = blockDurationFromStrikes(strikes);
    await redis.set(blockKey, "1", { ex: blockSec });

    return {
      allowed: false,
      retryAfterSec: blockSec,
      reason: "limit_exceeded",
    };
  }

  return {
    allowed: true,
    remainingMinute: Math.max(0, LIMIT_PER_MINUTE - minuteCount),
    remainingDay: Math.max(0, LIMIT_PER_DAY - dayCount),
  };
}
