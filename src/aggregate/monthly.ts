import { BucketReportRow, PricedUsageEvent } from "../types.js";

function emptyBucket(bucket: string): BucketReportRow {
  return {
    bucket,
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

export function aggregateMonthly(pricedEvents: PricedUsageEvent[]): BucketReportRow[] {
  const buckets = new Map<string, BucketReportRow>();
  const sessionsByBucket = new Map<string, Set<string>>();

  for (const event of pricedEvents) {
    const bucket = event.localMonthKey;
    const row = buckets.get(bucket) ?? emptyBucket(bucket);
    row.eventCount += 1;
    row.inputTokens += event.inputTokens;
    row.cachedInputTokens += event.cachedInputTokens;
    row.outputTokens += event.outputTokens;
    row.reasoningOutputTokens += event.reasoningOutputTokens;
    row.totalTokens += event.totalTokens;
    row.estimatedCost += event.estimatedCost ?? 0;
    buckets.set(bucket, row);

    const sessionIds = sessionsByBucket.get(bucket) ?? new Set<string>();
    sessionIds.add(event.sessionId);
    sessionsByBucket.set(bucket, sessionIds);
  }

  return [...buckets.values()]
    .map((row) => ({
      ...row,
      sessionCount: sessionsByBucket.get(row.bucket)?.size ?? 0,
    }))
    .sort((left, right) => left.bucket.localeCompare(right.bucket));
}
