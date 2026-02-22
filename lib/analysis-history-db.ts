import Dexie, { type EntityTable } from "dexie";

const MAX_HISTORY_ENTRIES = 25;

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
  await analysisHistoryDb.transaction(
    "rw",
    analysisHistoryDb.history,
    async () => {
      await analysisHistoryDb.history.add({
        code: input.code,
        analysis: input.analysis,
        createdAt: Date.now(),
      });

      const totalCount = await analysisHistoryDb.history.count();
      const excessCount = totalCount - MAX_HISTORY_ENTRIES;

      if (excessCount <= 0) {
        return;
      }

      const idsToDelete = await analysisHistoryDb.history
        .orderBy("createdAt")
        .limit(excessCount)
        .primaryKeys();

      await analysisHistoryDb.history.bulkDelete(idsToDelete as number[]);
    },
  );
}
