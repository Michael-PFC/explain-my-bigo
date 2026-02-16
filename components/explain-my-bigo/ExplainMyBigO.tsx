"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AnalyzeErrorBody,
  AnalyzeRequestBody,
  AnalyzeResponseBody,
} from "@/components/explain-my-bigo/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { AnalysisOutput } from "./analysis-output";
import { CodeInputEditor } from "./code-input-editor";
import { HistoryPanel } from "./history-panel";
import { parseAnalysisSections } from "./utils";
import {
  saveAnalysisHistory,
  type AnalysisHistoryEntry,
} from "@/lib/analysis-history-db";

type AnalyzeStatus = "idle" | "loading" | "success" | "error";

const EXAMPLE_SNIPPET = `def contains_duplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`;
const PLACEHOLDER = `Enter your code here and click the Analyze button.`;

export function ExplainMyBigO() {
  const [code, setCode] = useState<string>("");
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [analysis, setAnalysis] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const canAnalyze = code.trim().length > 0;
  const sections = useMemo(() => parseAnalysisSections(analysis), [analysis]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function runAnalysis() {
    if (!canAnalyze) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");
    setErrorMessage("");

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
      setAnalysis(data.analysis);
      setStatus("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  function clearInput() {
    abortControllerRef.current?.abort();
    setCode("");
    setAnalysis("");
    setErrorMessage("");
    setStatus("idle");
  }

  function loadExample() {
    setCode(EXAMPLE_SNIPPET);
  }

  function loadHistoryEntry(entry: AnalysisHistoryEntry) {
    setCode(entry.code);
    setAnalysis(entry.analysis);
    setErrorMessage("");
    setStatus("success");
    setIsHistoryOpen(false);
  }

  async function copyResult() {
    if (!analysis) {
      return;
    }

    try {
      await navigator.clipboard.writeText(analysis);
    } catch {
      setStatus("error");
      setErrorMessage("Could not copy result. Please copy manually.");
    }
  }

  return (
    <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>
            Paste code and choose the closest language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto [scrollbar-gutter:stable]">
          <div className="space-y-2">
            <Label>Paste your code</Label>
            <CodeInputEditor
              value={code}
              language={"auto"}
              placeholder={PLACEHOLDER}
              onChange={setCode}
              onAnalyzeShortcut={() => {
                void runAnalysis();
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runAnalysis} disabled={!canAnalyze}>
              Analyze
            </Button>
            <Button variant="secondary" onClick={clearInput}>
              Clear
            </Button>
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
              History
            </Button>
            <Button variant="ghost" onClick={loadExample}>
              Load example
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Local history</DialogTitle>
            <DialogDescription>
              Select a previous request to load input and output.
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-4 max-h-[50vh] overflow-y-auto px-4">
            <HistoryPanel onUseEntry={loadHistoryEntry} />
          </div>
        </DialogContent>
      </Dialog>

      <AnalysisOutput
        status={status}
        errorMessage={errorMessage}
        sections={sections}
        onCopyResult={copyResult}
        onTryAgain={runAnalysis}
        canAnalyze={canAnalyze}
      />
    </main>
  );
}
