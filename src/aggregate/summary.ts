import { PricedUsageEvent, SummaryReport } from "../types.js";

export function aggregateSummary(
  pricedEvents: PricedUsageEvent[],
  sessionCount: number,
): SummaryReport {
  const measurableSessionCount = new Set(pricedEvents.map((event) => event.sessionId)).size;
  const warnings = new Set<string>();

  let inputTokens = 0;
  let cachedInputTokens = 0;
  let outputTokens = 0;
  let reasoningOutputTokens = 0;
  let totalTokens = 0;
  let estimatedCost = 0;

  for (const event of pricedEvents) {
    inputTokens += event.inputTokens;
    cachedInputTokens += event.cachedInputTokens;
    outputTokens += event.outputTokens;
    reasoningOutputTokens += event.reasoningOutputTokens;
    totalTokens += event.totalTokens;
    estimatedCost += event.estimatedCost ?? 0;

    for (const warning of event.warnings) {
      warnings.add(warning);
    }
  }

  return {
    sessionCount,
    measurableSessionCount,
    eventCount: pricedEvents.length,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens,
    estimatedCost,
    warnings: [...warnings].sort(),
  };
}
