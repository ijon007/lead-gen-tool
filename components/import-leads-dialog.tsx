"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileArrowUpIcon, Spinner } from "@phosphor-icons/react";
import { toast } from "sonner";
import { parseImportFile } from "@/utils/parse-import-file";
import { cn } from "@/lib/utils";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: Id<"sheets">;
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
  sheetId,
}: ImportLeadsDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const createBatchLeads = useMutation(api.leads.createBatch);

  function setFileFromInput(f: File | null) {
    if (f && !/\.(csv|xlsx|xls)$/i.test(f.name)) return;
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFileFromInput(f);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFile(null);
      setDragOver(false);
      if (inputRef.current) inputRef.current.value = "";
    }
    onOpenChange(next);
  }

  async function handleImport() {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    setImporting(true);
    try {
      const { leads, matchedColumns } = await parseImportFile(file);
      if (matchedColumns.length === 0) {
        toast.error("No columns matched. Use headers like Business Name, Email, Phone, etc.");
        return;
      }
      if (leads.length === 0) {
        toast.error("No data rows found.");
        return;
      }
      await createBatchLeads({
        sheetId,
        leads: leads.map((l) => ({
          businessName: l.businessName,
          category: l.category,
          location: l.location,
          email: l.email,
          phone: l.phone,
          website: l.website,
          address: l.address,
          description: l.description,
          status: l.status,
          rating: l.rating,
          googleMapsUri: l.googleMapsUri,
          instagram: l.instagram,
          facebook: l.facebook,
          linkedIn: l.linkedIn,
          x: l.x,
          notes: l.notes,
          qualification: l.qualification,
        })),
      });
      toast.success(`Imported ${leads.length} lead(s).`);
      handleOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Import failed. Check file format (CSV or XLSX).");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-2">
        <DialogHeader>
          <DialogTitle>Import leads</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file. Columns that match our fields (e.g. Business Name, Email, Phone) will be imported; others are ignored.
          </DialogDescription>
        </DialogHeader>
        <label
          className={cn(
            "flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors p-4",
            dragOver && "border-primary bg-primary/5",
            !dragOver && "border-input bg-input/10 hover:bg-input/20",
            file && "border-primary/50 bg-primary/5"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => setFileFromInput(e.target.files?.[0] ?? null)}
          />
          <FileArrowUpIcon
            className={cn("size-10", file ? "text-primary" : "text-muted-foreground")}
            weight="duotone"
          />
          <span className="text-muted-foreground text-center text-sm">
            {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "Drop file here or click to browse"}
          </span>
        </label>
        <DialogFooter className="flex flex-row items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            size="sm"
          >
            {importing ? (
              <Spinner className="size-3 animate-spin" weight="bold" />
            ) : (
              <FileArrowUpIcon className="size-3" weight="bold" />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
