"use client";

import type { AnalysisSection } from "@/components/explain-my-bigo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AnalysisOutputStatus = "idle" | "loading" | "success" | "error";

interface AnalysisOutputProps {
  status: AnalysisOutputStatus;
  sections: AnalysisSection[];
  errorMessage: string;
  canAnalyze: boolean;
  onCopyResult: () => void;
  onTryAgain: () => void;
}

export function AnalysisOutput({
  status,
  sections,
  errorMessage,
  canAnalyze,
  onCopyResult,
  onTryAgain,
}: AnalysisOutputProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Output</CardTitle>
          <Badge variant="outline">Worst-case only</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-scroll">
        {status === "idle" && (
          <p className="text-muted-foreground text-sm">
            Paste code and click Analyze.
          </p>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm">
            <div className="border-muted-foreground size-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground">
              Estimating worst-case complexity…
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
            <Button onClick={onTryAgain} disabled={!canAnalyze}>
              Try again
            </Button>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={onCopyResult}>
                Copy result
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              {sections.map((section) => (
                <Card key={section.heading} size="sm">
                  <CardHeader>
                    <CardTitle className="font-mono text-xs">
                      {section.heading}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="font-mono text-xs whitespace-pre-wrap">
                      {section.lines.join("\n")}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
