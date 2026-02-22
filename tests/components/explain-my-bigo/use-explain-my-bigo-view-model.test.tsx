import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: {
    code: "",
    status: "idle" as "idle" | "loading" | "success" | "error",
    analysis: "",
    errorMessage: "",
    isHistoryOpen: false,
  },
  dispatch: vi.fn(),
  parseSections: vi.fn(),
  saveHistory: vi.fn(),
}));

vi.mock("@/components/explain-my-bigo/use-explain-my-bigo-state", () => ({
  useExplainMyBigOState: () => [mocks.state, mocks.dispatch],
}));

vi.mock("@/components/explain-my-bigo/utils", () => ({
  parseAnalysisSections: mocks.parseSections,
}));

vi.mock("@/lib/analysis-history-db", () => ({
  saveAnalysisHistory: mocks.saveHistory,
}));

import { useExplainMyBigOViewModel } from "@/components/explain-my-bigo/use-explain-my-bigo-view-model";

type HookResult<T> = {
  result: { readonly current: T };
  rerender: () => void;
  unmount: () => void;
};

function renderHook<T>(hook: () => T): HookResult<T> {
  let current!: T;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function TestComponent() {
    current = hook();
    return null;
  }

  act(() => {
    root.render(<TestComponent />);
  });

  return {
    result: {
      get current() {
        return current;
      },
    },
    rerender() {
      act(() => {
        root.render(<TestComponent />);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function resetState(
  overrides?: Partial<{
    code: string;
    status: "idle" | "loading" | "success" | "error";
    analysis: string;
    errorMessage: string;
    isHistoryOpen: boolean;
  }>,
) {
  Object.assign(mocks.state, {
    code: "",
    status: "idle",
    analysis: "",
    errorMessage: "",
    isHistoryOpen: false,
    ...overrides,
  });
}

describe("useExplainMyBigOViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    mocks.parseSections.mockReturnValue([]);
    mocks.saveHistory.mockResolvedValue(undefined);

    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("returns derived values and parses sections", () => {
    resetState({ code: "print(1)", analysis: "analysis" });
    mocks.parseSections.mockReturnValue([{ heading: "h", lines: ["l"] }]);

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    expect(result.current.canAnalyze).toBe(true);
    expect(result.current.placeholder).toBe(
      "Enter your code here and click the Analyze button.",
    );
    expect(result.current.sections).toEqual([{ heading: "h", lines: ["l"] }]);
    expect(mocks.parseSections).toHaveBeenCalledWith("analysis");
  });

  it("dispatches actions for basic handlers", () => {
    const { result } = renderHook(() => useExplainMyBigOViewModel());

    result.current.onCodeChange("x=1");
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: "setCode",
      payload: "x=1",
    });

    result.current.onHistoryOpenChange(true);
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: "setHistoryOpen",
      payload: true,
    });

    result.current.loadExample();
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: "setCode",
      payload: `def contains_duplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`,
    });

    const entry = { code: "a", analysis: "b", createdAt: Date.now() };
    result.current.loadHistoryEntry(entry);
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: "historyLoaded",
      payload: entry,
    });
  });

  it("does not run analysis when code is empty", async () => {
    resetState({ code: "   " });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it("runs analysis successfully, saves history, and resets token", async () => {
    resetState({ code: "for i in arr: pass" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ analysis: "O(n)" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    act(() => {
      result.current.setToken("token-123");
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/analyze");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body as string)).toEqual({
      code: "for i in arr: pass",
      language: "auto",
      token: "token-123",
    });

    expect(mocks.dispatch).toHaveBeenNthCalledWith(1, {
      type: "analysisStarted",
    });
    expect(mocks.dispatch).toHaveBeenNthCalledWith(2, {
      type: "analysisSucceeded",
      payload: "O(n)",
    });

    expect(mocks.saveHistory).toHaveBeenCalledWith({
      code: "for i in arr: pass",
      analysis: "O(n)",
    });

    expect(result.current.token).toBeNull();
    expect(result.current.turnstileKey).toBe(1);
    expect(result.current.isCaptchaInteractionRequired).toBe(false);
  });

  it("handles 429 response with friendly message", async () => {
    resetState({ code: "x" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn(),
      }),
    );

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mocks.dispatch).toHaveBeenNthCalledWith(1, {
      type: "analysisStarted",
    });
    expect(mocks.dispatch).toHaveBeenNthCalledWith(2, {
      type: "analysisFailed",
      payload:
        "Too many requests right now. Please wait a moment and try again.",
    });
  });

  it("marks CAPTCHA interaction required on captcha error response", async () => {
    resetState({ code: "x" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: "Captcha required",
          errorCode: "captcha_required",
        }),
      }),
    );

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(result.current.isCaptchaInteractionRequired).toBe(true);
    expect(mocks.dispatch).toHaveBeenNthCalledWith(2, {
      type: "analysisFailed",
      payload: "Captcha required",
    });
  });

  it("blocks analysis when CAPTCHA interaction is required but token is missing", async () => {
    resetState({ code: "x" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: "Captcha required",
        errorCode: "captcha_required",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.runAnalysis();
    });

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.dispatch).toHaveBeenLastCalledWith({
      type: "analysisFailed",
      payload: "Please complete the CAPTCHA.",
    });
  });

  it("ignores AbortError in runAnalysis catch block", async () => {
    resetState({ code: "x" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    );

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.runAnalysis();
    });

    expect(mocks.dispatch).toHaveBeenCalledTimes(1);
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: "analysisStarted" });
  });

  it("clearInput aborts in-flight request, clears token, increments turnstile, and dispatches", async () => {
    resetState({ code: "x" });

    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn().mockImplementation((_url, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;
      return new Promise(() => {});
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    act(() => {
      result.current.setToken("abc");
    });

    await act(async () => {
      void result.current.runAnalysis();
    });

    act(() => {
      result.current.clearInput();
    });

    expect(capturedSignal?.aborted).toBe(true);
    expect(result.current.token).toBeNull();
    expect(result.current.turnstileKey).toBe(1);
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: "clearInput" });
  });

  it("copyResult writes analysis to clipboard", async () => {
    resetState({ analysis: "Final analysis text" });
    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.copyResult();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Final analysis text",
    );
  });

  it("copyResult dispatches an error when clipboard write fails", async () => {
    resetState({ analysis: "Final analysis text" });
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("no permission")),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      await result.current.copyResult();
    });

    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: "analysisFailed",
      payload: "Could not copy result. Please copy manually.",
    });
  });

  it("aborts active request on unmount cleanup", async () => {
    resetState({ code: "x" });

    let capturedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, init?: RequestInit) => {
        capturedSignal = init?.signal as AbortSignal;
        return new Promise(() => {});
      }),
    );

    const hook = renderHook(() => useExplainMyBigOViewModel());

    await act(async () => {
      void hook.result.current.runAnalysis();
    });

    hook.unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
