"use client";

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
import { AnalysisOutput } from "./analysis-output";
import { CodeInputEditor } from "./code-input-editor";
import { HistoryPanel } from "./history-panel";
import { useExplainMyBigOViewModel } from "./use-explain-my-bigo-view-model";

export function ExplainMyBigO() {
  const {
    code,
    status,
    errorMessage,
    isHistoryOpen,
    canAnalyze,
    sections,
    placeholder,
    runAnalysis,
    clearInput,
    copyResult,
    loadExample,
    loadHistoryEntry,
    onCodeChange,
    onHistoryOpenChange,
  } = useExplainMyBigOViewModel();

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
            <CodeInputEditor
              value={code}
              language={"auto"}
              placeholder={placeholder}
              onChange={onCodeChange}
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
            <Button variant="outline" onClick={() => onHistoryOpenChange(true)}>
              History
            </Button>
            <Button variant="ghost" onClick={loadExample}>
              Load example
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isHistoryOpen} onOpenChange={onHistoryOpenChange}>
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
