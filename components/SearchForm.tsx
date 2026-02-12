"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { searchPlacesAction } from "@/lib/actions";
import { CATEGORIES } from "@/constants";
import type { Lead, SearchParams, TableColumnConfig } from "@/types";

export type LoadingStage = "search" | "enrich" | null;

interface SearchFormProps {
  columns: TableColumnConfig[];
  sheetId: string;
  onSearch: (params: SearchParams, leads?: Lead[], sheetId?: string) => void;
  onSearchStart?: (sheetId: string) => void;
  onSearchEnd?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onLoadingStageChange?: (stage: LoadingStage) => void;
  defaultCategory?: string;
  defaultLocation?: string;
  defaultLimit?: number;
}

export function SearchForm({
  columns,
  sheetId,
  onSearch,
  onSearchStart,
  onSearchEnd,
  onLoadingChange,
  onLoadingStageChange,
  defaultCategory = "",
  defaultLocation = "",
  defaultLimit = 10,
}: SearchFormProps) {
  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState(defaultLocation);
  const [limit, setLimit] = useState(defaultLimit);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);

  useEffect(() => {
    setLimit(defaultLimit);
  }, [defaultLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(category || location)) return;

    setLoading(true);
    onLoadingChange?.(true);
    onSearchStart?.(sheetId);
    try {
      setLoadingStage("search");
      onLoadingStageChange?.("search");
      console.log("[SearchForm] Stage: fetching places data", { category, location, limit });
      const searchResult = await searchPlacesAction(category, location, limit);

      if ("error" in searchResult) {
        console.error("[SearchForm] Search failed:", searchResult.error);
        toast.error("Search failed. See console for details.");
        onSearchEnd?.();
        return;
      }

      const { leads } = searchResult;
      console.log(
        "[SearchForm] Stage: data fetched",
        leads.length,
        "leads"
      );

      setLoadingStage("enrich");
      onLoadingStageChange?.("enrich");
      console.log("[SearchForm] Stage: enriching with AI, calling /api/ai-sdk");
      const enrichRes = await fetch("/api/ai-sdk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads, columns }),
      });

      const enrichData = await enrichRes.json();

      if (!enrichRes.ok) {
        console.error("Enrichment failed:", enrichData.error);
        toast.error(enrichData.error ?? "Enrichment failed. See console for details.");
        onSearch({ category, location, limit }, leads, sheetId);
        return;
      }

      const enrichedLeads = enrichData.leads ?? leads;
      console.log("[SearchForm] Stage: enrichment complete", enrichedLeads.length, "enriched leads");
      toast.success("Search and enrichment completed successfully");
      onSearch({ category, location, limit }, enrichedLeads, sheetId);
    } catch (err) {
      console.error("[SearchForm] Search failed:", err);
      toast.error("Search failed. See console for details.");
      onSearchEnd?.();
    } finally {
      setLoading(false);
      setLoadingStage(null);
      onLoadingStageChange?.(null);
      onLoadingChange?.(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3"
      onSubmit={handleSubmit}
    >
      <div className="flex min-w-0 max-w-40 flex-1 items-center">
        <Combobox
          itemToStringValue={(cat) => cat.label}
          items={CATEGORIES}
          onValueChange={(item) => setCategory(item?.value ?? "")}
          value={CATEGORIES.find((c) => c.value === category) ?? null}
        >
          <ComboboxInput
            className="w-full min-w-0"
            id="category"
            placeholder="Select category"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>No category found.</ComboboxEmpty>
            <ComboboxList>
              {(cat) => (
                <ComboboxItem key={cat.value} value={cat}>
                  {cat.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex min-w-0 max-w-36 flex-1 items-center">
        <Input
          id="location"
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
          type="text"
          value={location}
        />
      </div>

      <div className="flex min-w-0 items-center">
        <Input
          className="w-20"
          id="limit"
          max={50}
          min={1}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 1 && value <= 50) {
              setLimit(value);
            } else if (e.target.value === "") {
              setLimit(10);
            }
          }}
          placeholder="Leads"
          type="number"
          value={limit}
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
