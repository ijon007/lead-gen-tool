import type { Lead, TableColumnConfig } from "@/types";

export function exportToCsv(leads: Lead[], columns: TableColumnConfig[]): void {
  if (leads.length === 0) {
    return;
  }

  const visibleColumns = columns.filter((col) => col.visible);

  const headers = visibleColumns.map((col) => col.label).join(",");

  const rows = leads.map((lead) => {
    return visibleColumns
      .map((col) => {
        const value = lead[col.id as keyof Lead] || "";
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });

  const csvContent = [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `leads-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
