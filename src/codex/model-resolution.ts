export interface ModelResolutionInput {
  directModel: string | undefined;
  hintModel: string | undefined;
  fallbackModel: string | undefined;
}

export interface ModelResolution {
  model: string | undefined;
  isFallbackModel: boolean;
  warnings: string[];
}

export function resolveModel({
  directModel,
  hintModel,
  fallbackModel,
}: ModelResolutionInput): ModelResolution {
  const resolvedModel = normalizeModelName(directModel) ?? normalizeModelName(hintModel);
  if (resolvedModel) {
    return {
      model: resolvedModel,
      isFallbackModel: false,
      warnings: [],
    };
  }

  const fallback = normalizeModelName(fallbackModel);
  if (fallback) {
    return {
      model: fallback,
      isFallbackModel: true,
      warnings: ["fallback-model"],
    };
  }

  return {
    model: undefined,
    isFallbackModel: false,
    warnings: ["missing-model"],
  };
}

export function normalizeModelName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
