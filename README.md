# ExplainMyBigO

ExplainMyBigO is a Next.js app that analyzes code snippets and returns worst-case Big-O complexity.

## Requirements

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Fill real values in `.env`.

4. Start dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## `.env.example`

Create a `.env.example` (or copy this block into your `.env`) with:

```dotenv
# AI provider
POLLINATIONS_BASE_URL=https://gen.pollinations.ai/v1
POLLINATIONS_KEY=your_pollinations_key
POLLINATIONS_MODEL=nova-fast

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# CAPTCHA session behavior
# Number of analyze requests allowed after one successful CAPTCHA verification
CAPTCHA_SESSION_REQUESTS=5
# Session TTL in minutes
CAPTCHA_SESSION_TTL_MIN=60

# Shared secret used for hashing/signing (rate-limit IDs + CAPTCHA session cookie signature)
RATE_LIMIT_HASH_SECRET=replace_with_a_long_random_secret

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

## Notes

- `RATE_LIMIT_HASH_SECRET` is required by the API route.
- If Upstash envs are missing, rate limiting is disabled in local/dev fallback.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is required in the browser for CAPTCHA rendering.
