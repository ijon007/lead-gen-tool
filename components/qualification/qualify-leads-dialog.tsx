"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

interface QualifyLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRun: (instructions: string) => void;
}

export function QualifyLeadsDialog({
  open,
  onOpenChange,
  onRun,
}: QualifyLeadsDialogProps) {
  const [instructions, setInstructions] = useState("");

  function handleRun() {
    const trimmed = instructions.trim();
    if (!trimmed) {
      toast.error("Describe what a quality lead looks like.");
      return;
    }
    onRun(trimmed);
    onOpenChange(false);
    setInstructions("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>
            Qualify leads
          </DialogTitle>
          <DialogDescription>
            Describe what a quality lead looks like.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="qualify-instructions">Criteria</Label>
          <Textarea
            id="qualify-instructions"
            placeholder="e.g. Cafes with a physical location, no digital menu yet, active on Instagram"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="min-h-[100px] resize-y text-sm"
          />
        </div>
        <DialogFooter className="flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleRun}>
            <CheckCircleIcon className="size-3" weight="bold" />
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
