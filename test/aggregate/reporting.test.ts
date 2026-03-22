import path from "node:path";
import { describe, expect, it } from "vitest";
import { aggregateDaily } from "../../src/aggregate/daily.js";
import { aggregateSessions } from "../../src/aggregate/sessions.js";
import { aggregateSummary } from "../../src/aggregate/summary.js";
import { loadSessionFile } from "../../src/codex/loader.js";
import { normalizeSession } from "../../src/codex/usage-normalizer.js";
import { createBundledPricingSource } from "../../src/pricing/bundled-snapshot.js";
import { priceEvents } from "../../src/pricing/estimate.js";

const fixtureRoot = path.resolve("test/fixtures/codex");

async function loadAll() {
  const files = [
    "2026/03/20/rollout-session-alpha.jsonl",
    "2026/03/21/rollout-session-beta.jsonl",
    "2025/09/01/rollout-legacy.jsonl",
  ];

  const normalized = await Promise.all(
    files.map(async (relativePath) => {
      const loaded = await loadSessionFile(
        path.join(fixtureRoot, "sessions", relativePath),
        relativePath,
      );
      return normalizeSession(loaded, {
        timezone: "UTC",
        fallbackModel: "gpt-5-codex",
      });
    }),
  );

  const sessions = normalized.map((entry) => entry.session);
  const events = normalized.flatMap((entry) => entry.events);
  const pricedEvents = priceEvents(events, "api", createBundledPricingSource());

  return {
    sessions,
    pricedEvents,
  };
}

describe("aggregation", () => {
  it("aggregates summary, daily buckets, and session rows", async () => {
    const { sessions, pricedEvents } = await loadAll();
    const summary = aggregateSummary(pricedEvents, sessions.length);
    const daily = aggregateDaily(pricedEvents);
    const sessionRows = aggregateSessions(sessions, pricedEvents);

    expect(summary.sessionCount).toBe(3);
    expect(summary.measurableSessionCount).toBe(2);
    expect(summary.eventCount).toBe(4);
    expect(summary.totalTokens).toBe(2750);
    expect(summary.estimatedCost).toBeCloseTo(0.0051975, 10);

    expect(daily).toHaveLength(2);
    expect(daily[0]).toMatchObject({
      bucket: "2026-03-20",
      totalTokens: 2200,
    });
    expect(daily[0]?.estimatedCost).toBeCloseTo(0.00410625, 10);
    expect(daily[1]).toMatchObject({
      bucket: "2026-03-21",
      totalTokens: 550,
    });
    expect(daily[1]?.estimatedCost).toBeCloseTo(0.00109125, 10);

    const legacyRow = sessionRows.find(
      (row) => row.sessionId === "2025/09/01/rollout-legacy.jsonl",
    );
    expect(legacyRow).toMatchObject({
      isMeasurable: false,
      totalTokens: 0,
    });
  });
});
