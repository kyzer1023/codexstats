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

function sumValues<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

export function renderSummaryText(summary: SummaryReport): string {
  const rows = [
    ["Sessions", formatNumber(summary.sessionCount)],
    ["Measurable sessions", formatNumber(summary.measurableSessionCount)],
    ["Events", formatNumber(summary.eventCount)],
    ["Input", formatNumber(summary.inputTokens)],
    ["Cached input", formatNumber(summary.cachedInputTokens)],
    ["Output", formatNumber(summary.outputTokens)],
    ["Reasoning output", formatNumber(summary.reasoningOutputTokens)],
    ["Total tokens", formatNumber(summary.totalTokens)],
    ["Estimated cost", formatCurrency(summary.estimatedCost)],
    ["Warnings", summary.warnings.length > 0 ? summary.warnings.join(", ") : "-"],
  ];

  return `${renderTable(["Metric", "Value"], rows, {
    aligns: ["left", "right"],
  })}\n`;
}

export function renderBucketText(
  rows: BucketReportRow[],
  bucketHeader: string,
): string {
  return `${renderTable(
    [bucketHeader, "Sessions", "Events", "Input", "Cached", "Output", "Total", "Cost (USD)"],
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
    {
      aligns: ["left", "right", "right", "right", "right", "right", "right", "right"],
      footer: [
        "TOTAL",
        formatNumber(sumValues(rows, (row) => row.sessionCount)),
        formatNumber(sumValues(rows, (row) => row.eventCount)),
        formatNumber(sumValues(rows, (row) => row.inputTokens)),
        formatNumber(sumValues(rows, (row) => row.cachedInputTokens)),
        formatNumber(sumValues(rows, (row) => row.outputTokens)),
        formatNumber(sumValues(rows, (row) => row.totalTokens)),
        formatCurrency(sumValues(rows, (row) => row.estimatedCost)),
      ],
    },
  )}\n`;
}

export function renderSessionText(rows: SessionReportRow[]): string {
  return `${renderTable(
    ["Session", "Source", "Events", "Total", "Cost (USD)", "Status"],
    rows.map((row) => [
      row.sessionId,
      row.source,
      formatNumber(row.eventCount),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
      row.isMeasurable ? "measurable" : "unmeasurable",
    ]),
    {
      aligns: ["left", "left", "right", "right", "right", "left"],
      footer: [
        "TOTAL",
        `${sumValues(rows, (row) => (row.isMeasurable ? 1 : 0))}/${rows.length} measurable`,
        formatNumber(sumValues(rows, (row) => row.eventCount)),
        formatNumber(sumValues(rows, (row) => row.totalTokens)),
        formatCurrency(sumValues(rows, (row) => row.estimatedCost)),
        "",
      ],
    },
  )}\n`;
}

export function renderModelText(rows: ModelReportRow[]): string {
  return `${renderTable(
    ["Model", "Sessions", "Events", "Total", "Cost (USD)"],
    rows.map((row) => [
      row.model,
      formatNumber(row.sessionCount),
      formatNumber(row.eventCount),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
    ]),
    {
      aligns: ["left", "right", "right", "right", "right"],
      footer: [
        "TOTAL",
        formatNumber(sumValues(rows, (row) => row.sessionCount)),
        formatNumber(sumValues(rows, (row) => row.eventCount)),
        formatNumber(sumValues(rows, (row) => row.totalTokens)),
        formatCurrency(sumValues(rows, (row) => row.estimatedCost)),
      ],
    },
  )}\n`;
}

export function renderSourceText(rows: SourceReportRow[]): string {
  return `${renderTable(
    ["Source", "Sessions", "Events", "Total", "Cost (USD)"],
    rows.map((row) => [
      row.source,
      formatNumber(row.sessionCount),
      formatNumber(row.eventCount),
      formatNumber(row.totalTokens),
      formatCurrency(row.estimatedCost),
    ]),
    {
      aligns: ["left", "right", "right", "right", "right"],
      footer: [
        "TOTAL",
        formatNumber(sumValues(rows, (row) => row.sessionCount)),
        formatNumber(sumValues(rows, (row) => row.eventCount)),
        formatNumber(sumValues(rows, (row) => row.totalTokens)),
        formatCurrency(sumValues(rows, (row) => row.estimatedCost)),
      ],
    },
  )}\n`;
}

export function renderEventsText(rows: PricedUsageEvent[]): string {
  return `${renderTable(
    ["Timestamp", "Session", "Model", "Input", "Cached", "Output", "Total", "Cost (USD)"],
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
    {
      aligns: ["left", "left", "left", "right", "right", "right", "right", "right"],
      footer: [
        "TOTAL",
        "",
        "",
        formatNumber(sumValues(rows, (row) => row.inputTokens)),
        formatNumber(sumValues(rows, (row) => row.cachedInputTokens)),
        formatNumber(sumValues(rows, (row) => row.outputTokens)),
        formatNumber(sumValues(rows, (row) => row.totalTokens)),
        formatCurrency(sumValues(rows, (row) => row.estimatedCost ?? 0)),
      ],
    },
  )}\n`;
}
