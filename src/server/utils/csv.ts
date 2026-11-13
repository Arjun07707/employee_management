import "server-only";

export type CsvPrimitive = string | number | boolean | null | undefined;

/** RFC-4180 escaping: quote values containing a comma, quote or line break. */
export function escapeCsvValue(value: CsvPrimitive): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<CsvPrimitive>>,
): string {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];
  // BOM so Excel opens UTF-8 correctly.
  return `\uFEFF${lines.join("\r\n")}`;
}
