export type PricingMode = "api" | "oauth-estimate";

export interface CliOptions {
  codexHome: string | undefined;
  since: string | undefined;
  until: string | undefined;
  session: string | undefined;
  model: string | undefined;
  source: string | undefined;
  pricing: PricingMode;
  json: boolean;
  compact: boolean;
  offline: boolean;
  timezone: string;
  locale: string;
  fallbackModel: string;
}

export interface RawLogEntry {
  timestamp?: string;
  type?: string;
  payload?: unknown;
  [key: string]: unknown;
}

export interface LoadedSessionFile {
  sessionId: string;
  relativePath: string;
  absolutePath: string;
  entries: RawLogEntry[];
  warnings: string[];
}

export interface SessionMetadataRecord {
  sessionId: string;
  relativePath: string;
  absolutePath: string;
  source: string;
  cwd: string | undefined;
  originator: string | undefined;
  createdAt: string | undefined;
  warnings: string[];
}

export interface UsageSnapshot {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
}

export interface NormalizedUsageEvent extends UsageSnapshot {
  sessionId: string;
  timestamp: string;
  localDateKey: string;
  localMonthKey: string;
  model: string;
  canonicalModel: string;
  source: string;
  isFallbackModel: boolean;
  warnings: string[];
}

export interface SessionReportRow extends UsageSnapshot {
  sessionId: string;
  source: string;
  createdAt: string | undefined;
  eventCount: number;
  estimatedCost: number;
  isMeasurable: boolean;
  fallbackEventCount: number;
  warnings: string[];
}

export interface BucketReportRow extends UsageSnapshot {
  bucket: string;
  sessionCount: number;
  eventCount: number;
  estimatedCost: number;
}

export interface ModelReportRow extends UsageSnapshot {
  model: string;
  sessionCount: number;
  eventCount: number;
  estimatedCost: number;
}

export interface SourceReportRow extends UsageSnapshot {
  source: string;
  sessionCount: number;
  eventCount: number;
  estimatedCost: number;
}

export interface SummaryReport {
  sessionCount: number;
  measurableSessionCount: number;
  eventCount: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  warnings: string[];
}

export interface ModelPricing {
  model: string;
  inputPerMillionUsd: number;
  cachedInputPerMillionUsd: number;
  outputPerMillionUsd: number;
  sourceUrl: string;
}

export interface PricingLookupResult {
  pricing: ModelPricing | null;
  version: string;
}

export interface PricedUsageEvent extends NormalizedUsageEvent {
  pricingMode: PricingMode;
  pricingVersion: string;
  estimatedCost: number | null;
}

export interface CommandContext {
  options: CliOptions;
  sessions: SessionMetadataRecord[];
  events: NormalizedUsageEvent[];
  pricedEvents: PricedUsageEvent[];
}

export interface CommandOutput<T = unknown> {
  data: T;
  text: string;
}
