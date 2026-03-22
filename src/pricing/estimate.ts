import {
  NormalizedUsageEvent,
  PricingMode,
  PricedUsageEvent,
} from "../types.js";
import { toCanonicalModel } from "./model-map.js";
import { PricingSource } from "./source.js";

function estimateCostForEvent(
  event: NormalizedUsageEvent,
  source: PricingSource,
): { cost: number | null; pricingVersion: string; warnings: string[]; canonicalModel: string } {
  const canonicalModel = toCanonicalModel(event.model);
  const lookup = source.getPricing(canonicalModel);
  const warnings = [...event.warnings];

  if (!lookup.pricing) {
    warnings.push("unknown-model-pricing");
    return {
      cost: null,
      pricingVersion: lookup.version,
      warnings,
      canonicalModel,
    };
  }

  const nonCachedInputTokens = Math.max(
    0,
    event.inputTokens - event.cachedInputTokens,
  );
  const cost =
    (nonCachedInputTokens * lookup.pricing.inputPerMillionUsd) / 1_000_000 +
    (event.cachedInputTokens * lookup.pricing.cachedInputPerMillionUsd) / 1_000_000 +
    (event.outputTokens * lookup.pricing.outputPerMillionUsd) / 1_000_000;

  return {
    cost,
    pricingVersion: lookup.version,
    warnings,
    canonicalModel,
  };
}

export function priceEvents(
  events: NormalizedUsageEvent[],
  pricingMode: PricingMode,
  source: PricingSource,
): PricedUsageEvent[] {
  return events.map((event) => {
    const estimate = estimateCostForEvent(event, source);
    return {
      ...event,
      canonicalModel: estimate.canonicalModel,
      pricingMode,
      pricingVersion: estimate.pricingVersion,
      estimatedCost: estimate.cost,
      warnings: estimate.warnings,
    };
  });
}
