"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchPlacesAction } from "@/lib/actions";
import { CATEGORIES } from "@/constants";
import type { Lead, SearchParams, TableColumnConfig } from "@/types";

interface SearchFormProps {
  columns: TableColumnConfig[];
  onSearch: (params: SearchParams, leads?: Lead[]) => void;
  defaultCategory?: string;
  defaultLocation?: string;
}

export function SearchForm({
  columns,
  onSearch,
  defaultCategory = "",
  defaultLocation = "",
}: SearchFormProps) {
  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"search" | "enrich" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(category || location)) return;

    setLoading(true);
    try {
      setLoadingStage("search");
      const searchResult = await searchPlacesAction(category, location);

      if ("error" in searchResult) {
        console.error("Search failed:", searchResult.error);
        toast.error("Search failed. See console for details.");
        return;
      }

      const { leads } = searchResult;
      console.log(
        "Search success:",
        leads.length > 0 ? "Data fetched" : "No data",
        leads.length,
        "leads"
      );

      setLoadingStage("enrich");
      const enrichRes = await fetch("/api/ai-sdk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads, columns }),
      });

      const enrichData = await enrichRes.json();

      if (!enrichRes.ok) {
        console.error("Enrichment failed:", enrichData.error);
        toast.error(enrichData.error ?? "Enrichment failed. See console for details.");
        onSearch({ category, location }, leads);
        return;
      }

      const enrichedLeads = enrichData.leads ?? leads;
      toast.success("Search and enrichment completed successfully");
      onSearch({ category, location }, enrichedLeads);
    } catch (err) {
      console.error("Search failed:", err);
      toast.error("Search failed. See console for details.");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  return (
    <form
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3"
      onSubmit={handleSubmit}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Select
          onValueChange={(value) => setCategory(value || "")}
          value={category}
        >
          <SelectTrigger className="mb-0 w-full" id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <Input
          id="location"
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
          type="text"
          value={location}
        />
      </div>

      <Button
        className="w-full shrink-0 sm:w-auto"
        disabled={loading}
        type="submit"
        variant="default"
      >
        <MagnifyingGlass className="size-4" />
        {loading
          ? loadingStage === "enrich"
            ? "Enriching with AI..."
            : "Searching..."
          : "Search"}
      </Button>
    </form>
  );
}
