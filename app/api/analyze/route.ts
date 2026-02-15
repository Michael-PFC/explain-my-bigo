import { NextResponse } from "next/server";

import { SYSTEM_PROMPT } from "@/components/explain-my-bigo/prompt";
import type {
  AnalyzeErrorBody,
  AnalyzeLanguage,
  AnalyzeRequestBody,
  AnalyzeResponseBody,
} from "@/components/explain-my-bigo/types";

const VALID_LANGUAGES: ReadonlySet<AnalyzeLanguage> = new Set([
  "auto",
  "python",
  "javascript",
  "java",
  "cpp",
  "pseudocode",
  "other",
]);

const MOCK_ANALYSIS = `Worst-Case Time Complexity:
- O(n^2)

Worst-Case Space Complexity:
- Auxiliary: O(1)
- Total: O(n)

Key Assumptions:
- Input size is n elements.
- Primitive operations are O(1).
- Hash collisions and I/O costs are excluded.

Reasoning (short):
- The dominant work comes from nested iteration over n items.
- Constant-time bookkeeping does not change asymptotic growth.
- No recursion stack or dynamic structures dominate auxiliary memory.
- Input storage contributes to total space.

Confidence:
- Level: Medium
- Because: The snippet may omit constraints that affect bounds.

Missing context:
- None`;

function isAnalyzeLanguage(value: unknown): value is AnalyzeLanguage {
  return (
    typeof value === "string" && VALID_LANGUAGES.has(value as AnalyzeLanguage)
  );
}

export async function POST(request: Request) {
  void SYSTEM_PROMPT;

  let body: Partial<AnalyzeRequestBody>;

  try {
    body = (await request.json()) as Partial<AnalyzeRequestBody>;
  } catch {
    const errorBody: AnalyzeErrorBody = { error: "Invalid JSON payload." };
    return NextResponse.json(errorBody, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const language = body.language;

  if (code.length === 0) {
    const errorBody: AnalyzeErrorBody = { error: "Code is required." };
    return NextResponse.json(errorBody, { status: 400 });
  }

  if (!isAnalyzeLanguage(language)) {
    const errorBody: AnalyzeErrorBody = { error: "Invalid language." };
    return NextResponse.json(errorBody, { status: 400 });
  }

  const responseBody: AnalyzeResponseBody = {
    analysis: MOCK_ANALYSIS,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
