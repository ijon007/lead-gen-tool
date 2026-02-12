import { DEFAULT_TABLE_COLUMNS } from "@/constants";

const LEAD_FIELD_IDS = [
  "businessName",
  "category",
  "location",
  "email",
  "phone",
  "website",
  "address",
  "description",
  "status",
  "rating",
  "googleMapsUri",
  "instagram",
  "facebook",
  "linkedIn",
  "x",
  "notes",
  "qualification",
] as const;

type LeadFieldId = (typeof LEAD_FIELD_IDS)[number];

const HEADER_TO_FIELD: Map<string, LeadFieldId> = new Map();
for (const id of LEAD_FIELD_IDS) {
  HEADER_TO_FIELD.set(id.toLowerCase(), id);
  HEADER_TO_FIELD.set(id, id);
}
for (const col of DEFAULT_TABLE_COLUMNS) {
  if (LEAD_FIELD_IDS.includes(col.id as LeadFieldId)) {
    HEADER_TO_FIELD.set(col.label.toLowerCase(), col.id as LeadFieldId);
    HEADER_TO_FIELD.set(col.label, col.id as LeadFieldId);
  }
}

function normalizeHeader(header: string): string {
  return header.trim();
}

function mapHeaderToField(header: string): LeadFieldId | null {
  const n = normalizeHeader(header);
  return (HEADER_TO_FIELD.get(n) ?? HEADER_TO_FIELD.get(n.toLowerCase()) ?? null) as LeadFieldId | null;
}

export interface ParsedLeadRow {
  businessName: string;
  category: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description?: string;
  status?: string;
  rating?: number;
  googleMapsUri?: string;
  instagram?: string;
  facebook?: string;
  linkedIn?: string;
  x?: string;
  notes?: string;
  qualification?: "High" | "Low" | "Skip";
}

const REQUIRED: LeadFieldId[] = [
  "businessName",
  "category",
  "location",
  "email",
  "phone",
  "website",
  "address",
];

const QUALIFICATION_VALUES = new Set(["High", "Low", "Skip"]);

function rowToLead(
  row: Record<string, string>,
  columnMap: Map<number, LeadFieldId>
): ParsedLeadRow {
  const lead: ParsedLeadRow = {
    businessName: "",
    category: "",
    location: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  };
  for (const [colIndex, fieldId] of columnMap) {
    const raw = row[colIndex] ?? row[String(colIndex)] ?? "";
    const value = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
    if (fieldId === "rating") {
      const num = Number(value);
      if (!Number.isNaN(num)) lead.rating = num;
    } else if (fieldId === "qualification" && QUALIFICATION_VALUES.has(value)) {
      lead.qualification = value as "High" | "Low" | "Skip";
    } else if (REQUIRED.includes(fieldId)) {
      (lead as Record<string, string>)[fieldId] = value;
    } else if (value) {
      (lead as Record<string, unknown>)[fieldId] = value;
    }
  }
  return lead;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[String(j)] = cells[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          if (line[i] === '"') {
            cell += '"';
            i++;
          } else break;
        } else {
          cell += line[i];
          i++;
        }
      }
      result.push(cell);
      if (line[i] === ",") i++;
    } else {
      let end = line.indexOf(",", i);
      if (end === -1) end = line.length;
      result.push(line.slice(i, end).replace(/^"|"$/g, "").replace(/""/g, '"'));
      i = end + (end < line.length ? 1 : 0);
    }
  }
  return result;
}

async function getFirstSheetRows(data: ArrayBuffer): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(data, { type: "array" });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return [];
  const json = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (json.length < 2) return [];
  const headers = (json[0] ?? []).map((h) => String(h ?? "").trim());
  const rows: Record<string, string>[] = [];
  const headerRow: Record<string, string> = {};
  for (let j = 0; j < headers.length; j++) {
    headerRow[String(j)] = headers[j] ?? "";
  }
  rows.push(headerRow);
  for (let i = 1; i < json.length; i++) {
    const cells = (json[i] ?? []) as string[];
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[String(j)] = String(cells[j] ?? "").trim();
    }
    rows.push(row);
  }
  return rows;
}

async function parseFileToRows(file: File): Promise<Record<string, string>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    return await getFirstSheetRows(buf);
  }
  const text = await file.text();
  return parseCsv(text);
}

export interface ParseImportResult {
  leads: ParsedLeadRow[];
  matchedColumns: string[];
  skippedColumns: string[];
}

export async function parseImportFile(file: File): Promise<ParseImportResult> {
  const rows = await parseFileToRows(file);
  if (rows.length < 2) {
    return { leads: [], matchedColumns: [], skippedColumns: [] };
  }
  const headerRow = rows[0]!;
  const indices = Object.keys(headerRow)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const columnMap = new Map<number, LeadFieldId>();
  const matchedColumns: string[] = [];
  const skippedColumns: string[] = [];
  for (const j of indices) {
    const header = String(headerRow[String(j)] ?? "").trim();
    const fieldId = mapHeaderToField(header);
    if (fieldId) {
      columnMap.set(j, fieldId);
      matchedColumns.push(header);
    } else if (header) {
      skippedColumns.push(header);
    }
  }
  const dataRows = rows.slice(1);
  const leads = dataRows.map((row) => rowToLead(row, columnMap));
  return { leads, matchedColumns, skippedColumns };
}
