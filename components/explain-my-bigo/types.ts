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
  token?: string;
}

export interface AnalyzeResponseBody {
  analysis: string;
}

export type AnalyzeErrorCode =
  | "captcha_required"
  | "captcha_verification_failed";

export interface AnalyzeErrorBody {
  error: string;
  errorCode?: AnalyzeErrorCode;
}

export interface AnalysisSection {
  heading: string;
  lines: string[];
}
