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

interface PollinationsMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PollinationsRequestBody {
  model: string;
  messages: PollinationsMessage[];
  temperature: number;
}

interface PollinationsResponseBody {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function isAnalyzeLanguage(value: unknown): value is AnalyzeLanguage {
  return (
    typeof value === "string" && VALID_LANGUAGES.has(value as AnalyzeLanguage)
  );
}

export async function POST(request: Request) {
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

  const apiKey = process.env.POLLINATIONS_KEY;
  const apiURL = process.env.POLLINATIONS_BASE_URL;
  const model = process.env.POLLINATIONS_MODEL || "nova-fast";

  if (!apiKey) {
    const errorBody: AnalyzeErrorBody = {
      error: "Server is missing POLLINATIONS_KEY.",
    };
    return NextResponse.json(errorBody, { status: 500 });
  }

  const userPrompt = [`Language: ${language}`, "Code:", code].join("\n\n");

  const pollinationsPayload: PollinationsRequestBody = {
    model: model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  };

  let pollinationsResponse: Response;

  try {
    pollinationsResponse = await fetch(`${apiURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(pollinationsPayload),
      cache: "no-store",
    });
  } catch {
    const errorBody: AnalyzeErrorBody = {
      error: "Could not reach analysis provider.",
    };
    return NextResponse.json(errorBody, { status: 502 });
  }

  if (!pollinationsResponse.ok) {
    if (pollinationsResponse.status === 429) {
      const errorBody: AnalyzeErrorBody = {
        error:
          "Too many requests right now. Please wait a moment and try again.",
      };
      return NextResponse.json(errorBody, { status: 429 });
    }

    const errorBody: AnalyzeErrorBody = {
      error: "Analysis provider returned an error.",
    };
    return NextResponse.json(errorBody, { status: 502 });
  }

  let pollinationsData: PollinationsResponseBody;

  try {
    pollinationsData =
      (await pollinationsResponse.json()) as PollinationsResponseBody;
  } catch {
    const errorBody: AnalyzeErrorBody = {
      error: "Invalid response from analysis provider.",
    };
    return NextResponse.json(errorBody, { status: 502 });
  }

  const analysis =
    pollinationsData.choices?.[0]?.message?.content?.trim() ?? "";

  if (!analysis) {
    const errorBody: AnalyzeErrorBody = {
      error: "Analysis provider returned an empty response.",
    };
    return NextResponse.json(errorBody, { status: 502 });
  }

  const responseBody: AnalyzeResponseBody = {
    analysis,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
