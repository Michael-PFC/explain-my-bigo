/** @vitest-environment node */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
  verifyTurnstile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));

vi.mock("nextjs-turnstile", () => ({
  verifyTurnstile: mocks.verifyTurnstile,
}));

import { POST } from "@/app/api/analyze/route";

const ORIGINAL_ENV = { ...process.env };

function makeRequest(body: unknown, cookie?: string) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "x-forwarded-for": "203.0.113.10",
  });

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new NextRequest("http://localhost:3000/api/analyze", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.RATE_LIMIT_HASH_SECRET = "test-secret";
    process.env.POLLINATIONS_KEY = "pollinations-key";
    process.env.POLLINATIONS_BASE_URL = "https://provider.example";
    process.env.POLLINATIONS_MODEL = "nova-fast";

    mocks.enforceRateLimit.mockResolvedValue({
      allowed: true,
      remainingMinute: 10,
      remainingDay: 900,
    });

    mocks.verifyTurnstile.mockResolvedValue(true);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "Worst-Case Time Complexity:\n- O(n)",
              },
            },
          ],
        }),
      }),
    );
  });

  it("returns 500 when RATE_LIMIT_HASH_SECRET is missing", async () => {
    delete process.env.RATE_LIMIT_HASH_SECRET;

    const response = await POST(
      makeRequest({ code: "print(1)", language: "python", token: "ok" }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Server is missing RATE_LIMIT_HASH_SECRET.",
    });
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit blocks request", async () => {
    mocks.enforceRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSec: 120,
      reason: "blocked",
    });

    const response = await POST(
      makeRequest({ code: "print(1)", language: "python", token: "ok" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests. You are temporarily blocked. Try again later.",
    });
  });

  it("returns captcha_required when token is missing and no session exists", async () => {
    const response = await POST(
      makeRequest({ code: "print(1)", language: "python" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "CAPTCHA token is required.",
      errorCode: "captcha_required",
    });
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
  });

  it("returns captcha_verification_failed when turnstile validation fails", async () => {
    mocks.verifyTurnstile.mockResolvedValue(false);

    const response = await POST(
      makeRequest({ code: "print(1)", language: "python", token: "invalid" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "CAPTCHA verification failed.",
      errorCode: "captcha_verification_failed",
    });
    expect(mocks.verifyTurnstile).toHaveBeenCalledWith("invalid");
  });

  it("returns analysis and sets captcha session cookie on success", async () => {
    const response = await POST(
      makeRequest({ code: "print(1)", language: "python", token: "valid" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      analysis: "Worst-Case Time Complexity:\n- O(n)",
    });

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("captcha_session=");
    expect(mocks.verifyTurnstile).toHaveBeenCalledWith("valid");

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://provider.example/chat/completions");
    expect(options.method).toBe("POST");
  });

  it("allows a follow-up request without token when captcha session cookie is present", async () => {
    const firstResponse = await POST(
      makeRequest({ code: "print(1)", language: "python", token: "valid" }),
    );
    const cookieHeader = firstResponse.headers.get("set-cookie");

    expect(cookieHeader).toBeTruthy();

    const sessionCookie = cookieHeader!.split(";")[0];

    const secondResponse = await POST(
      makeRequest({ code: "print(2)", language: "python" }, sessionCookie),
    );

    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual({
      analysis: "Worst-Case Time Complexity:\n- O(n)",
    });

    expect(mocks.verifyTurnstile).toHaveBeenCalledTimes(1);
  });

  it("persists captcha session cookie even when provider is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const response = await POST(
      makeRequest({ code: "print(1)", language: "python", token: "valid" }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Could not reach analysis provider.",
    });

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("captcha_session=");
  });
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});
