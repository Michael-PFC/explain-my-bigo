export type AnalyzeLanguage =
  | "auto"
  | "python"
  | "javascript"
  | "java"
  | "cpp"
  | "pseudocode"
  | "other";

export interface AnalyzeRequestBody {
  code: string;
  language: AnalyzeLanguage;
  token: string;
}

export interface AnalyzeResponseBody {
  analysis: string;
}

export interface AnalyzeErrorBody {
  error: string;
}

export interface AnalysisSection {
  heading: string;
  lines: string[];
}
