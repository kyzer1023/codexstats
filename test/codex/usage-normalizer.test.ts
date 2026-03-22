import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSessionFile } from "../../src/codex/loader.js";
import { normalizeSession } from "../../src/codex/usage-normalizer.js";

const fixtureRoot = path.resolve("test/fixtures/codex");

describe("normalizeSession", () => {
  it("recovers deltas from cumulative totals and prefers direct last_token_usage", async () => {
    const absolutePath = path.join(
      fixtureRoot,
      "sessions/2026/03/20/rollout-session-alpha.jsonl",
    );
    const loaded = await loadSessionFile(
      absolutePath,
      "2026/03/20/rollout-session-alpha.jsonl",
    );

    const normalized = normalizeSession(loaded, {
      timezone: "UTC",
      fallbackModel: "gpt-5-codex",
    });

    expect(normalized.events).toHaveLength(3);
    expect(normalized.events[0]).toMatchObject({
      inputTokens: 1000,
      cachedInputTokens: 200,
      outputTokens: 100,
      totalTokens: 1100,
      model: "gpt-5-codex",
      isFallbackModel: false,
      localDateKey: "2026-03-20",
    });
    expect(normalized.events[1]).toMatchObject({
      inputTokens: 600,
      cachedInputTokens: 50,
      outputTokens: 60,
      totalTokens: 660,
    });
    expect(normalized.events[2]).toMatchObject({
      inputTokens: 400,
      cachedInputTokens: 100,
      outputTokens: 40,
      totalTokens: 440,
    });
    expect(normalized.session.warnings).toEqual([]);
  });

  it("falls back to the configured model and marks legacy sessions as unmeasurable", async () => {
    const betaPath = path.join(
      fixtureRoot,
      "sessions/2026/03/21/rollout-session-beta.jsonl",
    );
    const betaLoaded = await loadSessionFile(
      betaPath,
      "2026/03/21/rollout-session-beta.jsonl",
    );
    const betaNormalized = normalizeSession(betaLoaded, {
      timezone: "UTC",
      fallbackModel: "gpt-5-codex",
    });

    expect(betaNormalized.events).toHaveLength(1);
    expect(betaNormalized.events[0]).toMatchObject({
      model: "gpt-5-codex",
      isFallbackModel: true,
    });
    expect(betaNormalized.session.warnings).toContain("malformed-json-line:2");

    const legacyPath = path.join(
      fixtureRoot,
      "sessions/2025/09/01/rollout-legacy.jsonl",
    );
    const legacyLoaded = await loadSessionFile(
      legacyPath,
      "2025/09/01/rollout-legacy.jsonl",
    );
    const legacyNormalized = normalizeSession(legacyLoaded, {
      timezone: "UTC",
      fallbackModel: "gpt-5-codex",
    });

    expect(legacyNormalized.events).toHaveLength(0);
    expect(legacyNormalized.session.warnings).toContain("unmeasurable-session");
  });
});
