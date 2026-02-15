"use client";

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  placeholder as cmPlaceholder,
  EditorView,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AnalysisSection,
  AnalyzeErrorBody,
  AnalyzeLanguage,
  AnalyzeRequestBody,
  AnalyzeResponseBody,
} from "@/components/explain-my-bigo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type AnalyzeStatus = "idle" | "loading" | "success" | "error";
type EditorRuntimeLanguage = "python" | "typescript" | "java" | "cpp" | "text";

const EXAMPLE_SNIPPET = `def contains_duplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`;

function parseAnalysisSections(text: string): AnalysisSection[] {
  const lines = text.split(/\r?\n/);
  const sections: AnalysisSection[] = [];
  let currentSection: AnalysisSection | null = null;

  for (const line of lines) {
    if (line.endsWith(":")) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = { heading: line, lines: [] };
      continue;
    }

    if (!currentSection) {
      continue;
    }

    if (line.trim().length === 0 && currentSection.lines.length === 0) {
      continue;
    }

    currentSection.lines.push(line);
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function resolveEditorLanguage(
  code: string,
  language: AnalyzeLanguage,
): EditorRuntimeLanguage {
  if (language === "python") return "python";
  if (language === "javascript") return "typescript";
  if (language === "java") return "java";
  if (language === "cpp") return "cpp";
  if (language === "pseudocode" || language === "other") return "text";

  const snippet = code.trim();
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|:\s*(\r?\n)\s{2,}\S/.test(snippet)) {
    return "python";
  }
  if (
    /\bfunction\b|=>|\b(const|let|var)\b|console\.log|interface\s+\w+|type\s+\w+/.test(
      snippet,
    )
  ) {
    return "typescript";
  }
  if (
    /\bpublic\s+class\b|\bSystem\.out\.println\b|\bstatic\s+void\s+main\b/.test(
      snippet,
    )
  ) {
    return "java";
  }
  if (/^#include\s*<|\bstd::|\bprintf\s*\(|\bcout\s*<</m.test(snippet)) {
    return "cpp";
  }
  return "text";
}

function getLanguageExtension(language: EditorRuntimeLanguage) {
  if (language === "python") return python();
  if (language === "typescript") return javascript({ typescript: true });
  if (language === "java") return java();
  if (language === "cpp") return cpp();
  return [];
}

interface CodeInputEditorProps {
  value: string;
  language: AnalyzeLanguage;
  placeholder: string;
  onChange: (value: string) => void;
  onAnalyzeShortcut: () => void;
}

function CodeInputEditor({
  value,
  language,
  placeholder,
  onChange,
  onAnalyzeShortcut,
}: CodeInputEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  const onAnalyzeShortcutRef = useRef(onAnalyzeShortcut);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onAnalyzeShortcutRef.current = onAnalyzeShortcut;
  }, [onAnalyzeShortcut]);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const languageCompartment = new Compartment();

    const state = EditorState.create({
      doc: "",
      extensions: [
        lineNumbers(),
        history(),
        oneDark,
        EditorView.lineWrapping,
        cmPlaceholder(placeholder),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          {
            key: "Mod-Enter",
            run: () => {
              onAnalyzeShortcutRef.current();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            height: "18rem",
            fontSize: "12px",
          },
          ".cm-scroller": {
            fontFamily:
              "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
          ".cm-content": {
            minHeight: "18rem",
            padding: "8px 10px",
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid var(--border)",
          },
          "&.cm-focused": {
            outline: "none",
          },
        }),
        languageCompartment.of(getLanguageExtension("text")),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });

    viewRef.current = view;
    languageCompartmentRef.current = languageCompartment;

    return () => {
      view.destroy();
      viewRef.current = null;
      languageCompartmentRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    const languageCompartment = languageCompartmentRef.current;
    if (!view || !languageCompartment) {
      return;
    }

    const editorLanguage = resolveEditorLanguage(value, language);
    view.dispatch({
      effects: languageCompartment.reconfigure(
        getLanguageExtension(editorLanguage),
      ),
    });
  }, [language, value]);

  return (
    <div className="border-input focus-within:border-ring focus-within:ring-ring/50 rounded-none border bg-transparent focus-within:ring-1">
      <div ref={hostRef} />
    </div>
  );
}

export function ExplainMyBigO() {
  const [code, setCode] = useState<string>("");
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [analysis, setAnalysis] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

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
    <div className="mx-auto flex h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          ExplainMyBigO
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Worst-case time &amp; space complexity in seconds.
        </p>
      </header>

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
                placeholder={EXAMPLE_SNIPPET}
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
              <Button variant="ghost" onClick={loadExample}>
                Load example
              </Button>
            </div>
          </CardContent>
        </Card>

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
                <Button onClick={runAnalysis} disabled={!canAnalyze}>
                  Try again
                </Button>
              </div>
            )}

            {status === "success" && (
              <>
                <div className="flex items-center justify-end">
                  <Button variant="outline" onClick={copyResult}>
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
      </main>

      <footer className="text-muted-foreground mt-6 flex items-center gap-4 text-xs">
        <a href="#" className="hover:underline">
          Privacy
        </a>
        <a href="#" className="hover:underline">
          GitHub
        </a>
      </footer>
    </div>
  );
}
