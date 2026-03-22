import {
  BucketReportRow,
  ModelReportRow,
  PricedUsageEvent,
  SessionReportRow,
  SourceReportRow,
  SummaryReport,
} from "../types.js";
import { renderTable } from "./table.js";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function formatCurrency(value: number): string {
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }

  return `$${value.toFixed(6)}`;
}

export function renderSummaryText(summary: SummaryReport): string {
  const lines = [
    `Sessions: ${summary.sessionCount} (${summary.measurableSessionCount} measurable)`,
    `Events: ${summary.eventCount}`,
    `Input: ${formatNumber(summary.inputTokens)}`,
    `Cached input: ${formatNumber(summary.cachedInputTokens)}`,
    `Output: ${formatNumber(summary.outputTokens)}`,
    `Reasoning output: ${formatNumber(summary.reasoningOutputTokens)}`,
    `Total: ${formatNumber(summary.totalTokens)}`,
    `Estimated cost: ${formatCurrency(summary.estimatedCost)}`,
  ];

  if (summary.warnings.length > 0) {
    lines.push(`Warnings: ${summary.warnings.join(", ")}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderBucketText(
  rows: BucketReportRow[],
  bucketHeader: string,
): string {
  return `${renderTable(
    [bucketHeader, "Sessions", "Events", "Input", "Cached", "Output", "Total", "Cost"],
    rows.map((row) => [
      row.bucket,
      formatNumber(row.sessionCount),
      formatNumber(row.eventCount),
      formatNumber(row.inputTokens),
      formatNumber(row.cachedInputTokens),
      formatNumber(row.outputTokens),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
    ]),
  )}\n`;
}

export function renderSessionText(rows: SessionReportRow[]): string {
  return `${renderTable(
    ["Session", "Source", "Events", "Total", "Cost", "Status"],
    rows.map((row) => [
      row.sessionId,
      row.source,
      formatNumber(row.eventCount),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
      row.isMeasurable ? "measurable" : "unmeasurable",
    ]),
  )}\n`;
}

export function renderModelText(rows: ModelReportRow[]): string {
  return `${renderTable(
    ["Model", "Sessions", "Events", "Total", "Cost"],
    rows.map((row) => [
      row.model,
      formatNumber(row.sessionCount),
      formatNumber(row.eventCount),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
    ]),
  )}\n`;
}

export function renderSourceText(rows: SourceReportRow[]): string {
  return `${renderTable(
    ["Source", "Sessions", "Events", "Total", "Cost"],
    rows.map((row) => [
      row.source,
      formatNumber(row.sessionCount),
      formatNumber(row.eventCount),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
    ]),
  )}\n`;
}

export function renderEventsText(rows: PricedUsageEvent[]): string {
  return `${renderTable(
    ["Timestamp", "Session", "Model", "Input", "Cached", "Output", "Total", "Cost"],
    rows.map((row) => [
      row.timestamp,
      row.sessionId,
      row.canonicalModel,
      formatNumber(row.inputTokens),
      formatNumber(row.cachedInputTokens),
      formatNumber(row.outputTokens),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost ?? 0),
    ]),
  )}\n`;
}
