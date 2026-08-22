// Minimal RFC4180-ish CSV parser — handles quoted fields (needed since origin/
// destination labels routinely contain commas, e.g. "Port of Los Angeles, CA, USA")
// and doubled-quote escaping. No external dependency for a fixed, small format.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < lines.length; i++) {
    const char = lines[i];

    if (inQuotes) {
      if (char === '"') {
        if (lines[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Final field/row if the text doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function csvRowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;
  return dataRows.map((r) => Object.fromEntries(header.map((col, i) => [col.trim(), (r[i] ?? "").trim()])));
}
