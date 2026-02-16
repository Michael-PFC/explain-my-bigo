import Dexie, { type EntityTable } from "dexie";

export interface AnalysisHistoryEntry {
  id?: number;
  code: string;
  analysis: string;
  createdAt: number;
}

class ExplainMyBigODatabase extends Dexie {
  history!: EntityTable<AnalysisHistoryEntry, "id">;

  constructor() {
    super("ExplainMyBigO_DB");

    this.version(1).stores({
      history: "++id, createdAt",
    });
  }
}

export const analysisHistoryDb = new ExplainMyBigODatabase();

export async function saveAnalysisHistory(input: {
  code: string;
  analysis: string;
}) {
  await analysisHistoryDb.history.add({
    code: input.code,
    analysis: input.analysis,
    createdAt: Date.now(),
  });
}
