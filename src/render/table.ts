type TableAlign = "left" | "right";

export interface RenderTableOptions {
  aligns?: TableAlign[];
  footer?: string[];
}

function repeatCell(char: string, width: number): string {
  return char.repeat(width + 2);
}

function padCell(value: string, width: number, align: TableAlign): string {
  return align === "right" ? value.padStart(width) : value.padEnd(width);
}

function renderBorder(widths: number[]): string {
  return `+${widths.map((width) => repeatCell("-", width)).join("+")}+`;
}

function renderRow(row: string[], widths: number[], aligns: TableAlign[]): string {
  const cells = widths.map((width, index) => {
    const value = row[index] ?? "";
    const align = aligns[index] ?? "left";
    return ` ${padCell(value, width, align)} `;
  });

  return `|${cells.join("|")}|`;
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
      header.length,
      ...sourceRows.map((row) => row[index]?.length ?? 0),
    ),
  );
  const aligns = headers.map((_, index) => options.aligns?.[index] ?? "left");
  const border = renderBorder(widths);

  const lines = [
    border,
    renderRow(headers, widths, headers.map(() => "left")),
    border,
    ...rows.map((row) => renderRow(row, widths, aligns)),
  ];

  if (footer) {
    lines.push(border);
    lines.push(renderRow(footer, widths, aligns));
  }

  lines.push(border);
  return lines.join("\n");
}
