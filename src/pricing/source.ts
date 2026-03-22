import { ModelPricing, PricingLookupResult } from "../types.js";

export interface PricingSource {
  getPricing(model: string): PricingLookupResult;
  getVersion(): string;
}

export class StaticPricingSource implements PricingSource {
  readonly #version: string;
  readonly #pricingByModel: Map<string, ModelPricing>;

  constructor(version: string, pricing: ModelPricing[]) {
    this.#version = version;
    this.#pricingByModel = new Map(pricing.map((entry) => [entry.model, entry]));
  }

  getPricing(model: string): PricingLookupResult {
    return {
      pricing: this.#pricingByModel.get(model) ?? null,
      version: this.#version,
    };
  }

  getVersion(): string {
    return this.#version;
  }
}
