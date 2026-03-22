import {
  LoadedSessionFile,
  NormalizedUsageEvent,
  SessionMetadataRecord,
  UsageSnapshot,
} from "../types.js";
import { toLocalDateKey, toLocalMonthKey } from "../utils/dates.js";
import { extractSessionMetadata } from "./metadata.js";
import { resolveModel } from "./model-resolution.js";
import { getNestedRecord, isRecord } from "./raw-types.js";

export interface NormalizeSessionOptions {
  timezone: string;
  fallbackModel: string;
}

export interface NormalizedSession {
  session: SessionMetadataRecord;
  events: NormalizedUsageEvent[];
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeSnapshot(value: unknown): UsageSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const inputTokens = toNumber(value.input_tokens ?? value.inputTokens);
  const cachedInputTokens = toNumber(
    value.cached_input_tokens ??
      value.cachedInputTokens ??
      value.cache_read_input_tokens ??
      value.cacheReadInputTokens,
  );
  const outputTokens = toNumber(value.output_tokens ?? value.outputTokens);
  const reasoningOutputTokens = toNumber(
    value.reasoning_output_tokens ?? value.reasoningOutputTokens,
  );
  const totalTokensRaw = value.total_tokens ?? value.totalTokens;
  const totalTokens =
    typeof totalTokensRaw === "number" && Number.isFinite(totalTokensRaw)
      ? totalTokensRaw
      : inputTokens + outputTokens;

  if (
    inputTokens === 0 &&
    cachedInputTokens === 0 &&
    outputTokens === 0 &&
    reasoningOutputTokens === 0 &&
    totalTokens === 0
  ) {
    return undefined;
  }

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens,
  };
}

function diffSnapshot(current: UsageSnapshot, previous?: UsageSnapshot): UsageSnapshot {
  if (!previous) {
    return current;
  }

  return {
    inputTokens: current.inputTokens - previous.inputTokens,
    cachedInputTokens: current.cachedInputTokens - previous.cachedInputTokens,
    outputTokens: current.outputTokens - previous.outputTokens,
    reasoningOutputTokens:
      current.reasoningOutputTokens - previous.reasoningOutputTokens,
    totalTokens: current.totalTokens - previous.totalTokens,
  };
}

function clampSnapshot(snapshot: UsageSnapshot): { snapshot: UsageSnapshot; regressed: boolean } {
  let regressed = false;
  const clamped: UsageSnapshot = { ...snapshot };

  for (const key of Object.keys(clamped) as Array<keyof UsageSnapshot>) {
    if (clamped[key] < 0) {
      clamped[key] = 0;
      regressed = true;
    }
  }

  return { snapshot: clamped, regressed };
}

function extractTokenCountPayload(entry: Record<string, unknown>): Record<string, unknown> | undefined {
  if (entry.type === "token_count") {
    return entry;
  }

  const payload = isRecord(entry.payload) ? entry.payload : undefined;
  if (payload?.type === "token_count") {
    return payload;
  }

  const nestedPayload = getNestedRecord(payload, "payload");
  if (nestedPayload?.type === "token_count") {
    return nestedPayload;
  }

  return undefined;
}

function extractUsageInfo(entry: Record<string, unknown>): {
  direct: UsageSnapshot | undefined;
  cumulative: UsageSnapshot | undefined;
  model: string | undefined;
} | null {
  const payload = extractTokenCountPayload(entry);
  if (!payload) {
    return null;
  }

  const info = getNestedRecord(payload, "info") ?? payload;
  const direct =
    normalizeSnapshot(info.last_token_usage) ?? normalizeSnapshot(info.lastTokenUsage);
  const cumulative =
    normalizeSnapshot(info.total_token_usage) ?? normalizeSnapshot(info.totalTokenUsage);
  const model =
    (typeof info.model === "string" ? info.model : undefined) ??
    (typeof payload.model === "string" ? payload.model : undefined);

  if (!direct && !cumulative) {
    return null;
  }

  return {
    direct,
    cumulative,
    model,
  };
}

function extractTurnModel(entry: Record<string, unknown>): string | undefined {
  if (entry.type !== "turn_context") {
    return undefined;
  }

  const payload = isRecord(entry.payload) ? entry.payload : entry;
  return typeof payload.model === "string" ? payload.model : undefined;
}

export function normalizeSession(
  file: LoadedSessionFile,
  options: NormalizeSessionOptions,
): NormalizedSession {
  const session = extractSessionMetadata(file);
  const events: NormalizedUsageEvent[] = [];
  let previousCumulative: UsageSnapshot | undefined;
  let currentModelHint: string | undefined;

  for (const rawEntry of file.entries) {
    const entry = isRecord(rawEntry) ? rawEntry : {};
    const turnModel = extractTurnModel(entry);
    if (turnModel) {
      currentModelHint = turnModel;
    }

    const usageInfo = extractUsageInfo(entry);
    if (!usageInfo) {
      continue;
    }

    const baseSnapshot = usageInfo.direct ?? diffSnapshot(usageInfo.cumulative!, previousCumulative);
    const { snapshot, regressed } = clampSnapshot(baseSnapshot);

    if (usageInfo.cumulative) {
      previousCumulative = usageInfo.cumulative;
    }

    const modelResolution = resolveModel({
      directModel: usageInfo.model,
      hintModel: currentModelHint,
      fallbackModel: options.fallbackModel,
    });

    if (!modelResolution.model) {
      session.warnings.push(...modelResolution.warnings);
      continue;
    }

    const timestamp =
      typeof entry.timestamp === "string"
        ? entry.timestamp
        : session.createdAt ?? new Date().toISOString();

    const warnings = [...modelResolution.warnings];
    if (regressed) {
      warnings.push("regressive-usage");
      session.warnings.push("regressive-usage");
    }

    events.push({
      sessionId: session.sessionId,
      timestamp,
      localDateKey: toLocalDateKey(timestamp, options.timezone),
      localMonthKey: toLocalMonthKey(timestamp, options.timezone),
      model: modelResolution.model,
      canonicalModel: modelResolution.model,
      source: session.source,
      inputTokens: snapshot.inputTokens,
      cachedInputTokens: snapshot.cachedInputTokens,
      outputTokens: snapshot.outputTokens,
      reasoningOutputTokens: snapshot.reasoningOutputTokens,
      totalTokens: snapshot.totalTokens,
      isFallbackModel: modelResolution.isFallbackModel,
      warnings,
    });
  }

  if (events.length === 0) {
    session.warnings.push("unmeasurable-session");
  }

  return { session, events };
}
