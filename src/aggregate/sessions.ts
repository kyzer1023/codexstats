import { PricedUsageEvent, SessionMetadataRecord, SessionReportRow } from "../types.js";

function emptySessionRow(session: SessionMetadataRecord): SessionReportRow {
  return {
    sessionId: session.sessionId,
    source: session.source,
    createdAt: session.createdAt,
    eventCount: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    isMeasurable: false,
    fallbackEventCount: 0,
    warnings: [...new Set(session.warnings)].sort(),
  };
}

export function aggregateSessions(
  sessions: SessionMetadataRecord[],
  pricedEvents: PricedUsageEvent[],
): SessionReportRow[] {
  const rows = new Map<string, SessionReportRow>(
    sessions.map((session) => [session.sessionId, emptySessionRow(session)]),
  );

  for (const event of pricedEvents) {
    const row = rows.get(event.sessionId);
    if (!row) {
      continue;
    }

    row.eventCount += 1;
    row.inputTokens += event.inputTokens;
    row.cachedInputTokens += event.cachedInputTokens;
    row.outputTokens += event.outputTokens;
    row.reasoningOutputTokens += event.reasoningOutputTokens;
    row.totalTokens += event.totalTokens;
    row.estimatedCost += event.estimatedCost ?? 0;
    row.isMeasurable = true;
    row.fallbackEventCount += event.isFallbackModel ? 1 : 0;

    for (const warning of event.warnings) {
      if (!row.warnings.includes(warning)) {
        row.warnings.push(warning);
      }
    }
  }

  return [...rows.values()].sort((left, right) =>
    left.sessionId.localeCompare(right.sessionId),
  );
}
