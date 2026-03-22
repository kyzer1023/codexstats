import { PRICING_SNAPSHOT_VERSION } from "../config.js";
import { ModelPricing } from "../types.js";
import { StaticPricingSource } from "./source.js";

const OFFICIAL_CODING_MODEL_PRICING: ModelPricing[] = [
  {
    model: "gpt-5",
    inputPerMillionUsd: 1.25,
    cachedInputPerMillionUsd: 0.125,
    outputPerMillionUsd: 10,
    sourceUrl: "https://openai.com/api/pricing/",
  },
  {
    model: "gpt-5-codex",
    inputPerMillionUsd: 1.25,
    cachedInputPerMillionUsd: 0.125,
    outputPerMillionUsd: 10,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5-codex",
  },
  {
    model: "gpt-5.1-codex",
    inputPerMillionUsd: 1.25,
    cachedInputPerMillionUsd: 0.125,
    outputPerMillionUsd: 10,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.1-codex",
  },
  {
    model: "gpt-5.1-codex-mini",
    inputPerMillionUsd: 0.25,
    cachedInputPerMillionUsd: 0.025,
    outputPerMillionUsd: 2,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.1-codex-mini",
  },
  {
    model: "gpt-5.2-codex",
    inputPerMillionUsd: 1.75,
    cachedInputPerMillionUsd: 0.175,
    outputPerMillionUsd: 14,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.2-codex",
  },
  {
    model: "gpt-5.3-codex",
    inputPerMillionUsd: 1.75,
    cachedInputPerMillionUsd: 0.175,
    outputPerMillionUsd: 14,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.3-codex",
  },
  {
    model: "gpt-5-mini",
    inputPerMillionUsd: 0.25,
    cachedInputPerMillionUsd: 0.025,
    outputPerMillionUsd: 2,
    sourceUrl: "https://openai.com/api/pricing/",
  },
  {
    model: "gpt-5.4",
    inputPerMillionUsd: 2.5,
    cachedInputPerMillionUsd: 0.25,
    outputPerMillionUsd: 15,
    sourceUrl: "https://openai.com/api/pricing/",
  },
  {
    model: "codex-mini-latest",
    inputPerMillionUsd: 1.5,
    cachedInputPerMillionUsd: 0.375,
    outputPerMillionUsd: 6,
    sourceUrl: "https://developers.openai.com/api/docs/models/codex-mini-latest",
  },
];

export function createBundledPricingSource(): StaticPricingSource {
  return new StaticPricingSource(PRICING_SNAPSHOT_VERSION, OFFICIAL_CODING_MODEL_PRICING);
}
