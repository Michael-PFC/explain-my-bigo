"use client";

import { useLiveQuery } from "dexie-react-hooks";

import type { AnalysisHistoryEntry } from "@/lib/analysis-history-db";
import { analysisHistoryDb } from "@/lib/analysis-history-db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HistoryPanelProps {
  onUseEntry: (entry: AnalysisHistoryEntry) => void;
}

function summarize(text: string, maxLength = 140) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function getWorstCaseTimeSummary(analysis: string) {
  const match = analysis.match(
    /Worst-Case Time Complexity:\s*(?:\r?\n\s*-\s*)?(O\([^\n\r]+\))/i,
  );

  if (!match?.[1]) {
    return "Unknown";
  }

  return `${match[1].trim()}`;
}

export function HistoryPanel({ onUseEntry }: HistoryPanelProps) {
  const entries = useLiveQuery(async () => {
    return analysisHistoryDb.history
      .orderBy("createdAt")
      .reverse()
      .limit(10)
      .toArray();
  }, []);

  return (
    <Card size="sm" className="mb-1">
      <CardHeader>
        <CardTitle>Local history</CardTitle>
        <CardDescription>Last 10 requests saved.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!entries || entries.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No history yet. Run your first analysis.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Button
                key={entry.id}
                type="button"
                variant="outline"
                onClick={() => onUseEntry(entry)}
                className="h-auto w-full justify-start overflow-hidden rounded border px-3 py-2 text-left"
              >
                <div className="w-full min-w-0 space-y-1">
                  <p className="text-muted-foreground text-[11px]">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground shrink-0">
                      Input:
                    </span>
                    <span className="block min-w-0 truncate">
                      {summarize(entry.code)}
                    </span>
                  </p>
                  <p className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground shrink-0">
                      Worst-Case Time Complexity:
                    </span>
                    <span className="block min-w-0 truncate">
                      {getWorstCaseTimeSummary(entry.analysis)}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Click to load this response
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
