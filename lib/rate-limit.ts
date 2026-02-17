import { Redis } from "@upstash/redis";
import { createHash, createHmac } from "crypto";

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

function normalizeIpForRateLimit(ip: string): string {
  const value = ip.trim().toLowerCase();

  if (!value || value === "unknown") {
    return "unknown";
  }

  if (value.includes(":")) {
    const segments = value.split(":");
    return segments.slice(0, 4).join(":");
  }

  const octets = value.split(".");
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.${octets[2]}.0`;
  }

  return value;
}

function getRateLimitClientKey(ip: string): string {
  const normalizedIp = normalizeIpForRateLimit(ip);
  const secret = process.env.RATE_LIMIT_HASH_SECRET;

  if (secret && secret.trim().length > 0) {
    return createHmac("sha256", secret)
      .update(normalizedIp)
      .digest("hex")
      .slice(0, 40);
  }

  return createHash("sha256").update(normalizedIp).digest("hex").slice(0, 40);
}

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

  const clientKey = getRateLimitClientKey(ip || "unknown");
  const blockKey = `rl:block:${clientKey}`;
  const minuteKey = `rl:cnt:1m:${clientKey}`;
  const dayKey = `rl:cnt:1d:${clientKey}`;
  const strikeKey = `rl:strike:${clientKey}`;

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
