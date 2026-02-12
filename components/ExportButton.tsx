"use client";

import { Download } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { Lead, TableColumnConfig } from "@/types";
import { exportToCsv } from "@/utils/csv";

interface ExportButtonProps {
  leads: Lead[];
  columns: TableColumnConfig[];
  disabled?: boolean;
}

export function ExportButton({ leads, columns, disabled }: ExportButtonProps) {
  const handleExport = () => {
    exportToCsv(leads, columns);
  };

  return (
    <Button
      disabled={disabled || leads.length === 0}
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="text-xs w-full lg:w-auto"
    >
      <Download className="size-3" weight="bold" />
      Export CSV
    </Button>
  );
}
