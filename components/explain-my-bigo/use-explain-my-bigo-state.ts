import { useReducer } from "react";

import type { AnalysisHistoryEntry } from "@/lib/analysis-history-db";

export type AnalyzeStatus = "idle" | "loading" | "success" | "error";

type ExplainMyBigOState = {
  code: string;
  status: AnalyzeStatus;
  analysis: string;
  errorMessage: string;
  isHistoryOpen: boolean;
};

type ExplainMyBigOAction =
  | { type: "setCode"; payload: string }
  | { type: "analysisStarted" }
  | { type: "analysisSucceeded"; payload: string }
  | { type: "analysisFailed"; payload: string }
  | { type: "clearInput" }
  | { type: "historyLoaded"; payload: AnalysisHistoryEntry }
  | { type: "setHistoryOpen"; payload: boolean };

const INITIAL_STATE: ExplainMyBigOState = {
  code: "",
  status: "idle",
  analysis: "",
  errorMessage: "",
  isHistoryOpen: false,
};

function explainMyBigOReducer(
  state: ExplainMyBigOState,
  action: ExplainMyBigOAction,
): ExplainMyBigOState {
  switch (action.type) {
    case "setCode":
      return {
        ...state,
        code: action.payload,
      };
    case "analysisStarted":
      return {
        ...state,
        status: "loading",
        errorMessage: "",
      };
    case "analysisSucceeded":
      return {
        ...state,
        analysis: action.payload,
        status: "success",
      };
    case "analysisFailed":
      return {
        ...state,
        status: "error",
        errorMessage: action.payload,
      };
    case "clearInput":
      return {
        ...state,
        code: "",
        analysis: "",
        errorMessage: "",
        status: "idle",
      };
    case "historyLoaded":
      return {
        ...state,
        code: action.payload.code,
        analysis: action.payload.analysis,
        errorMessage: "",
        status: "success",
        isHistoryOpen: false,
      };
    case "setHistoryOpen":
      return {
        ...state,
        isHistoryOpen: action.payload,
      };
    default:
      return state;
  }
}

export function useExplainMyBigOState() {
  return useReducer(explainMyBigOReducer, INITIAL_STATE);
}
