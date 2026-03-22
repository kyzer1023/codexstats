import { PricedUsageEvent, SourceReportRow } from "../types.js";

function emptySourceRow(source: string): SourceReportRow {
  return {
    source,
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

export function aggregateSources(pricedEvents: PricedUsageEvent[]): SourceReportRow[] {
  const rows = new Map<string, SourceReportRow>();
  const sessionsBySource = new Map<string, Set<string>>();

  for (const event of pricedEvents) {
    const row = rows.get(event.source) ?? emptySourceRow(event.source);
    row.eventCount += 1;
    row.inputTokens += event.inputTokens;
    row.cachedInputTokens += event.cachedInputTokens;
    row.outputTokens += event.outputTokens;
    row.reasoningOutputTokens += event.reasoningOutputTokens;
    row.totalTokens += event.totalTokens;
    row.estimatedCost += event.estimatedCost ?? 0;
    rows.set(event.source, row);

    const sessions = sessionsBySource.get(event.source) ?? new Set<string>();
    sessions.add(event.sessionId);
    sessionsBySource.set(event.source, sessions);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      sessionCount: sessionsBySource.get(row.source)?.size ?? 0,
    }))
    .sort((left, right) => right.estimatedCost - left.estimatedCost);
}
