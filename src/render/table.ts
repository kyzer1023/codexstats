export function renderTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return "(no data)";
  }

  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );

  const renderRow = (row: string[]): string =>
    row
      .map((cell, index) => cell.padEnd(widths[index] ?? cell.length))
      .join("  ")
      .trimEnd();

  const separator = widths.map((width) => "-".repeat(width)).join("  ");

  return [renderRow(headers), separator, ...rows.map(renderRow)].join("\n");
}
