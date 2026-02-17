import { useEffect, useMemo, useRef } from "react";

import type {
  AnalyzeErrorBody,
  AnalyzeRequestBody,
  AnalyzeResponseBody,
} from "@/components/explain-my-bigo/types";
import {
  saveAnalysisHistory,
  type AnalysisHistoryEntry,
} from "@/lib/analysis-history-db";

import { useExplainMyBigOState } from "./use-explain-my-bigo-state";
import { parseAnalysisSections } from "./utils";

const EXAMPLE_SNIPPET = `def contains_duplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`;

const PLACEHOLDER = `Enter your code here and click the Analyze button.`;

export function useExplainMyBigOViewModel() {
  const [state, dispatch] = useExplainMyBigOState();
  const { code, status, analysis, errorMessage, isHistoryOpen } = state;

  const abortControllerRef = useRef<AbortController | null>(null);

  const canAnalyze = code.trim().length > 0;
  const sections = useMemo(() => parseAnalysisSections(analysis), [analysis]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  function onCodeChange(value: string) {
    dispatch({ type: "setCode", payload: value });
  }

  function onHistoryOpenChange(open: boolean) {
    dispatch({ type: "setHistoryOpen", payload: open });
  }

  function loadExample() {
    dispatch({ type: "setCode", payload: EXAMPLE_SNIPPET });
  }

  function loadHistoryEntry(entry: AnalysisHistoryEntry) {
    dispatch({ type: "historyLoaded", payload: entry });
  }

  function clearInput() {
    abortControllerRef.current?.abort();
    dispatch({ type: "clearInput" });
  }

  async function runAnalysis() {
    if (!canAnalyze) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    dispatch({ type: "analysisStarted" });

    const payload: AnalyzeRequestBody = {
      code,
      language: "auto",
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Too many requests right now. Please wait a moment and try again.",
          );
        }

        const errorData = (await response.json().catch(() => ({
          error: "Failed to analyze code.",
        }))) as AnalyzeErrorBody;

        throw new Error(errorData.error || "Failed to analyze code.");
      }

      const data = (await response.json()) as AnalyzeResponseBody;
      void saveAnalysisHistory({
        code,
        analysis: data.analysis,
      });

      dispatch({ type: "analysisSucceeded", payload: data.analysis });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      dispatch({
        type: "analysisFailed",
        payload:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  async function copyResult() {
    if (!analysis) {
      return;
    }

    try {
      await navigator.clipboard.writeText(analysis);
    } catch {
      dispatch({
        type: "analysisFailed",
        payload: "Could not copy result. Please copy manually.",
      });
    }
  }

  return {
    code,
    status,
    analysis,
    errorMessage,
    isHistoryOpen,
    canAnalyze,
    sections,
    placeholder: PLACEHOLDER,
    runAnalysis,
    clearInput,
    copyResult,
    loadExample,
    loadHistoryEntry,
    onCodeChange,
    onHistoryOpenChange,
  };
}
