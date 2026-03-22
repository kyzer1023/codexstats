import pc from "picocolors";
import {
  BucketReportRow,
  ModelReportRow,
  ModelUsageSummary,
  PricedUsageEvent,
  SessionReportRow,
  SourceReportRow,
  SummaryReport,
} from "../types.js";
import { formatDateCompact, renderTable } from "./table.js";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function sumValues<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function splitUsageTokens(usage: {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
}): {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheReadTokens: number;
} {
  const cacheReadTokens = Math.min(usage.cachedInputTokens, usage.inputTokens);
  const inputTokens = Math.max(usage.inputTokens - cacheReadTokens, 0);
  const outputTokens = Math.max(usage.outputTokens, 0);
  const reasoningTokens = Math.max(
    0,
    Math.min(usage.reasoningOutputTokens, outputTokens),
  );

  return {
    inputTokens,
    outputTokens,
    reasoningTokens,
    cacheReadTokens,
  };
}

function formatModels(models: Record<string, ModelUsageSummary>): string {
  const names = Object.entries(models)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([model, usage]) => `- ${usage.isFallback ? `${model} (fallback)` : model}`);

  return names.length > 0 ? names.join("\n") : "-";
}

export function renderTitleBox(title: string): string {
  const width = title.length + 2;
  const top = `┌${"─".repeat(width)}┐`;
  const middle = `│ ${title} │`;
  const bottom = `└${"─".repeat(width)}┘`;
  return `${top}\n${middle}\n${bottom}\n`;
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
  forceCompact = false,
): string {
  const totals = rows.reduce(
    (accumulator, row) => {
      const split = splitUsageTokens(row);
      accumulator.inputTokens += split.inputTokens;
      accumulator.outputTokens += split.outputTokens;
      accumulator.reasoningTokens += split.reasoningTokens;
      accumulator.cacheReadTokens += split.cacheReadTokens;
      accumulator.totalTokens += row.totalTokens;
      accumulator.estimatedCost += row.estimatedCost;
      return accumulator;
    },
    {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    },
  );

  return `${renderTable(
    [
      bucketHeader,
      "Models",
      "Input",
      "Output",
      "Reasoning",
      "Cache Read",
      "Total Tokens",
      "Cost (USD)",
    ],
    rows.map((row) => {
      const split = splitUsageTokens(row);
      return [
        row.bucket,
        formatModels(row.models),
        formatNumber(split.inputTokens),
        formatNumber(split.outputTokens),
        formatNumber(split.reasoningTokens),
        formatNumber(split.cacheReadTokens),
        formatNumber(row.totalTokens),
        formatCurrency(row.estimatedCost),
      ];
    }),
    {
      aligns: ["left", "left", "right", "right", "right", "right", "right", "right"],
      compactHeaders: [bucketHeader, "Models", "Input", "Output", "Cost (USD)"],
      compactAligns: ["left", "left", "right", "right", "right"],
      compactThreshold: 100,
      forceCompact,
      dateFormatter: formatDateCompact,
      footer: [
        pc.yellow("Total"),
        "",
        pc.yellow(formatNumber(totals.inputTokens)),
        pc.yellow(formatNumber(totals.outputTokens)),
        pc.yellow(formatNumber(totals.reasoningTokens)),
        pc.yellow(formatNumber(totals.cacheReadTokens)),
        pc.yellow(formatNumber(totals.totalTokens)),
        pc.yellow(formatCurrency(totals.estimatedCost)),
      ],
    },
  )}\n`;
}

export function renderSessionText(rows: SessionReportRow[], forceCompact = false): string {
  const totals = rows.reduce(
    (accumulator, row) => {
      const split = splitUsageTokens(row);
      accumulator.inputTokens += split.inputTokens;
      accumulator.outputTokens += split.outputTokens;
      accumulator.reasoningTokens += split.reasoningTokens;
      accumulator.cacheReadTokens += split.cacheReadTokens;
      accumulator.totalTokens += row.totalTokens;
      accumulator.estimatedCost += row.estimatedCost;
      return accumulator;
    },
    {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    },
  );

  return `${renderTable(
    [
      "Date",
      "Directory",
      "Session",
      "Models",
      "Input",
      "Output",
      "Reasoning",
      "Cache Read",
      "Total Tokens",
      "Cost (USD)",
      "Last Activity",
    ],
    rows.map((row) => {
      const split = splitUsageTokens(row);
      return [
        row.lastActivity?.slice(0, 10) ?? row.createdAt?.slice(0, 10) ?? "-",
        row.directory || "-",
        row.sessionFile.length > 8 ? `...${row.sessionFile.slice(-8)}` : row.sessionFile,
        formatModels(row.models),
        formatNumber(split.inputTokens),
        formatNumber(split.outputTokens),
        formatNumber(split.reasoningTokens),
        formatNumber(split.cacheReadTokens),
        formatNumber(row.totalTokens),
        formatCurrency(row.estimatedCost),
        row.lastActivity ?? "-",
      ];
    }),
    {
      aligns: ["left", "left", "left", "left", "right", "right", "right", "right", "right", "right", "left"],
      compactHeaders: ["Date", "Directory", "Session", "Input", "Output", "Cost (USD)"],
      compactAligns: ["left", "left", "left", "right", "right", "right"],
      compactThreshold: 100,
      forceCompact,
      dateFormatter: formatDateCompact,
      footer: [
        "",
        "",
        pc.yellow("Total"),
        "",
        pc.yellow(formatNumber(totals.inputTokens)),
        pc.yellow(formatNumber(totals.outputTokens)),
        pc.yellow(formatNumber(totals.reasoningTokens)),
        pc.yellow(formatNumber(totals.cacheReadTokens)),
        pc.yellow(formatNumber(totals.totalTokens)),
        pc.yellow(formatCurrency(totals.estimatedCost)),
        "",
      ],
    },
  )}\n`;
}

export function renderModelText(rows: ModelReportRow[], forceCompact = false): string {
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
      compactHeaders: ["Model", "Total", "Cost (USD)"],
      compactAligns: ["left", "right", "right"],
      compactThreshold: 100,
      forceCompact,
      footer: [
        pc.yellow("Total"),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.sessionCount))),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.eventCount))),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.totalTokens))),
        pc.yellow(formatCurrency(sumValues(rows, (row) => row.estimatedCost))),
      ],
    },
  )}\n`;
}

export function renderSourceText(rows: SourceReportRow[], forceCompact = false): string {
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
      compactHeaders: ["Source", "Total", "Cost (USD)"],
      compactAligns: ["left", "right", "right"],
      compactThreshold: 100,
      forceCompact,
      footer: [
        pc.yellow("Total"),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.sessionCount))),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.eventCount))),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.totalTokens))),
        pc.yellow(formatCurrency(sumValues(rows, (row) => row.estimatedCost))),
      ],
    },
  )}\n`;
}

export function renderEventsText(rows: PricedUsageEvent[], forceCompact = false): string {
  return `${renderTable(
    ["Timestamp", "Session", "Model", "Input", "Cache Read", "Output", "Total Tokens", "Cost (USD)"],
    rows.map((row) => {
      const split = splitUsageTokens(row);
      return [
        row.timestamp,
        row.sessionId,
        row.canonicalModel,
        formatNumber(split.inputTokens),
        formatNumber(split.cacheReadTokens),
        formatNumber(split.outputTokens),
        formatNumber(row.totalTokens),
        formatCurrency(row.estimatedCost ?? 0),
      ];
    }),
    {
      aligns: ["left", "left", "left", "right", "right", "right", "right", "right"],
      compactHeaders: ["Timestamp", "Session", "Model", "Cost (USD)"],
      compactAligns: ["left", "left", "left", "right"],
      compactThreshold: 100,
      forceCompact,
      footer: [
        pc.yellow("Total"),
        "",
        "",
        pc.yellow(formatNumber(sumValues(rows, (row) => splitUsageTokens(row).inputTokens))),
        pc.yellow(formatNumber(sumValues(rows, (row) => splitUsageTokens(row).cacheReadTokens))),
        pc.yellow(formatNumber(sumValues(rows, (row) => splitUsageTokens(row).outputTokens))),
        pc.yellow(formatNumber(sumValues(rows, (row) => row.totalTokens))),
        pc.yellow(formatCurrency(sumValues(rows, (row) => row.estimatedCost ?? 0))),
      ],
    },
  )}\n`;
}
