import { PricedUsageEvent, SessionMetadataRecord, SessionReportRow } from "../types.js";

function emptySessionRow(session: SessionMetadataRecord): SessionReportRow {
  const separatorIndex = session.sessionId.lastIndexOf("/");
  const directory =
    separatorIndex >= 0 ? session.sessionId.slice(0, separatorIndex) : "";
  const sessionFile =
    separatorIndex >= 0 ? session.sessionId.slice(separatorIndex + 1) : session.sessionId;

  return {
    sessionId: session.sessionId,
    source: session.source,
    createdAt: session.createdAt,
    lastActivity: session.createdAt,
    directory,
    sessionFile,
    eventCount: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    isMeasurable: false,
    fallbackEventCount: 0,
    models: {},
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
    row.lastActivity =
      row.lastActivity == null || event.timestamp > row.lastActivity
        ? event.timestamp
        : row.lastActivity;
    const modelUsage = row.models[event.canonicalModel] ?? {
      totalTokens: 0,
      isFallback: false,
    };
    modelUsage.totalTokens += event.totalTokens;
    modelUsage.isFallback ||= event.isFallbackModel;
    row.models[event.canonicalModel] = modelUsage;

    for (const warning of event.warnings) {
      if (!row.warnings.includes(warning)) {
        row.warnings.push(warning);
      }
    }
  }

  return [...rows.values()].sort((left, right) =>
    (left.lastActivity ?? left.sessionId).localeCompare(right.lastActivity ?? right.sessionId),
  );
}
