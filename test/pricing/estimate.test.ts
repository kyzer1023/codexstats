import { describe, expect, it } from "vitest";
import { createBundledPricingSource } from "../../src/pricing/bundled-snapshot.js";
import { priceEvents } from "../../src/pricing/estimate.js";
import { NormalizedUsageEvent } from "../../src/types.js";

describe("priceEvents", () => {
  it("uses non-cached and cached input pricing correctly", () => {
    const source = createBundledPricingSource();
    const events: NormalizedUsageEvent[] = [
      {
        sessionId: "s1",
        timestamp: "2026-03-20T01:00:00.000Z",
        localDateKey: "2026-03-20",
        localMonthKey: "2026-03",
        model: "gpt-5-codex",
        canonicalModel: "gpt-5-codex",
        source: "cli",
        inputTokens: 1000,
        cachedInputTokens: 200,
        outputTokens: 100,
        reasoningOutputTokens: 40,
        totalTokens: 1100,
        isFallbackModel: false,
        warnings: [],
      },
    ];

    const priced = priceEvents(events, "api", source);
    expect(priced[0]?.estimatedCost).toBeCloseTo(0.002025, 10);
    expect(priced[0]?.pricingVersion).toBe("openai-pricing-2026-03-23");
  });
});
