import process from "node:process";
import Table from "cli-table3";
import stringWidth from "string-width";

export type TableAlign = "left" | "right" | "center";
export type TableRow = Array<string | number>;

export interface RenderTableOptions {
  aligns?: TableAlign[];
  footer?: TableRow;
  compactHeaders?: string[];
  compactAligns?: TableAlign[];
  compactThreshold?: number;
  forceCompact?: boolean;
  dateFormatter?: (value: string) => string;
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getCompactIndices(headers: string[], compactHeaders: string[]): number[] {
  return compactHeaders.map((compactHeader) => {
    const index = headers.indexOf(compactHeader);
    return index >= 0 ? index : 0;
  });
}

function filterRow(row: TableRow, indices: number[]): TableRow {
  return indices.map((index) => row[index] ?? "");
}

function computeContentWidths(rows: TableRow[], headers: string[]): number[] {
  const allRows = [headers, ...rows].map((row) => row.map((value) => String(value ?? "")));
  return headers.map((_, columnIndex) =>
    Math.max(
      ...allRows
        .map((row) => row[columnIndex] ?? "")
        .flatMap((value) => value.split("\n"))
        .map((line) => stringWidth(line)),
    ),
  );
}

function computeColumnWidths(
  widths: number[],
  aligns: TableAlign[],
  terminalWidth: number,
): number[] {
  const tableOverhead = 3 * widths.length + 1;
  const availableWidth = Math.max(terminalWidth - tableOverhead, widths.length * 8);
  const naturalWidths = widths.map((width, index) => {
    const align = aligns[index] ?? "left";
    if (align === "right") {
      return Math.max(width + 3, 10);
    }
    return Math.max(width + 2, index === 1 ? 16 : 10);
  });

  const naturalTotal = naturalWidths.reduce((sum, width) => sum + width, 0);
  if (naturalTotal <= availableWidth) {
    return naturalWidths;
  }

  const scale = availableWidth / naturalTotal;
  return naturalWidths.map((width, index) => {
    const align = aligns[index] ?? "left";
    const scaled = Math.floor(width * scale);
    if (align === "right") {
      return Math.max(scaled, 10);
    }
    return Math.max(scaled, index === 1 ? 12 : 8);
  });
}

function maybeFormatDateCell(
  row: TableRow,
  dateFormatter: ((value: string) => string) | undefined,
): TableRow {
  if (dateFormatter == null) {
    return row;
  }

  return row.map((value, index) => {
    if (index === 0 && typeof value === "string" && isDateString(value)) {
      return dateFormatter(value);
    }
    return value;
  });
}

export function formatDateCompact(dateStr: string): string {
  return `${dateStr.slice(0, 4)}\n${dateStr.slice(5)}`;
}

export function renderTable(
  headers: string[],
  rows: TableRow[],
  options: RenderTableOptions = {},
): string {
  const footer = options.footer;
  const compactThreshold = options.compactThreshold ?? 100;
  const terminalWidth =
    Number.parseInt(process.env.COLUMNS ?? "", 10) || process.stdout.columns || 120;

  const useCompact =
    options.forceCompact === true ||
    (terminalWidth < compactThreshold && options.compactHeaders != null);

  const activeHeaders = useCompact && options.compactHeaders != null ? options.compactHeaders : headers;
  const activeAligns =
    useCompact && options.compactAligns != null
      ? options.compactAligns
      : (options.aligns ?? headers.map(() => "left"));
  const compactIndices =
    useCompact && options.compactHeaders != null
      ? getCompactIndices(headers, options.compactHeaders)
      : headers.map((_, index) => index);

  const processedRows = rows.map((row) =>
    maybeFormatDateCell(filterRow(row, compactIndices), useCompact ? options.dateFormatter : undefined),
  );
  const processedFooter =
    footer == null
      ? undefined
      : maybeFormatDateCell(filterRow(footer, compactIndices), useCompact ? options.dateFormatter : undefined);

  const contentWidths = computeContentWidths(
    processedFooter != null ? [...processedRows, processedFooter] : processedRows,
    activeHeaders,
  );
  const columnWidths = computeColumnWidths(contentWidths, activeAligns, terminalWidth);

  const table = new Table({
    head: activeHeaders,
    colAligns: activeAligns,
    colWidths: columnWidths,
    wordWrap: true,
    wrapOnWordBoundary: true,
    style: {
      head: ["cyan"],
      border: [],
    },
  });

  for (const row of processedRows) {
    table.push(row);
  }

  if (processedFooter != null) {
    table.push(processedFooter);
  }

  return table.toString();
}
