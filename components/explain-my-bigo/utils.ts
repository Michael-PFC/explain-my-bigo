import type {
  AnalysisSection,
  AnalyzeLanguage,
} from "@/components/explain-my-bigo/types";

export type EditorRuntimeLanguage =
  | "python"
  | "typescript"
  | "java"
  | "cpp"
  | "text";

export function parseAnalysisSections(text: string): AnalysisSection[] {
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

export function resolveEditorLanguage(
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

import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

export function getLanguageExtension(language: EditorRuntimeLanguage) {
  if (language === "python") return python();
  if (language === "typescript") return javascript({ typescript: true });
  if (language === "java") return java();
  if (language === "cpp") return cpp();
  return [];
}
