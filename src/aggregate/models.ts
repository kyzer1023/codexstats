import { ModelReportRow, PricedUsageEvent } from "../types.js";

function emptyModelRow(model: string): ModelReportRow {
  return {
    model,
    sessionCount: 0,
    eventCount: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };
}

export function aggregateModels(pricedEvents: PricedUsageEvent[]): ModelReportRow[] {
  const rows = new Map<string, ModelReportRow>();
  const sessionsByModel = new Map<string, Set<string>>();

  for (const event of pricedEvents) {
    const model = event.canonicalModel;
    const row = rows.get(model) ?? emptyModelRow(model);
    row.eventCount += 1;
    row.inputTokens += event.inputTokens;
    row.cachedInputTokens += event.cachedInputTokens;
    row.outputTokens += event.outputTokens;
    row.reasoningOutputTokens += event.reasoningOutputTokens;
    row.totalTokens += event.totalTokens;
    row.estimatedCost += event.estimatedCost ?? 0;
    rows.set(model, row);

    const sessions = sessionsByModel.get(model) ?? new Set<string>();
    sessions.add(event.sessionId);
    sessionsByModel.set(model, sessions);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      sessionCount: sessionsByModel.get(row.model)?.size ?? 0,
    }))
    .sort((left, right) => right.estimatedCost - left.estimatedCost);
}
