type TableAlign = "left" | "right";

export interface RenderTableOptions {
  aligns?: TableAlign[];
  footer?: string[];
}

function getCellLines(value: string): string[] {
  return value.split("\n");
}

function padCell(value: string, width: number, align: TableAlign): string {
  return align === "right" ? value.padStart(width) : value.padEnd(width);
}

function renderBorder(
  widths: number[],
  left: string,
  join: string,
  right: string,
): string {
  return `${left}${widths.map((width) => "─".repeat(width + 2)).join(join)}${right}`;
}

function renderLogicalRow(
  row: string[],
  widths: number[],
  aligns: TableAlign[],
): string[] {
  const cells = widths.map((_, index) => getCellLines(row[index] ?? ""));
  const lineCount = Math.max(...cells.map((cell) => cell.length), 1);
  const lines: string[] = [];

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
    const rendered = widths.map((width, columnIndex) => {
      const align = aligns[columnIndex] ?? "left";
      const value = cells[columnIndex]?.[lineIndex] ?? "";
      return ` ${padCell(value, width, align)} `;
    });
    lines.push(`│${rendered.join("│")}│`);
  }

  return lines;
}

export function renderTable(
  headers: string[],
  rows: string[][],
  options: RenderTableOptions = {},
): string {
  const footer = options.footer;
  const sourceRows = footer ? [...rows, footer] : rows;

  if (sourceRows.length === 0) {
    return "(no data)";
  }

  const widths = headers.map((header, index) =>
    Math.max(
      ...[header, ...sourceRows.map((row) => row[index] ?? "")]
        .flatMap((value) => getCellLines(value))
        .map((line) => line.length),
    ),
  );

  const aligns = headers.map((_, index) => options.aligns?.[index] ?? "left");
  const topBorder = renderBorder(widths, "┌", "┬", "┐");
  const middleBorder = renderBorder(widths, "├", "┼", "┤");
  const bottomBorder = renderBorder(widths, "└", "┴", "┘");

  const lines = [
    topBorder,
    ...renderLogicalRow(headers, widths, headers.map(() => "left")),
    middleBorder,
    ...rows.flatMap((row) => renderLogicalRow(row, widths, aligns)),
  ];

  if (footer) {
    lines.push(middleBorder);
    lines.push(...renderLogicalRow(footer, widths, aligns));
  }

  lines.push(bottomBorder);
  return lines.join("\n");
}
