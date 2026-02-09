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
import type { SearchParams } from "@/types";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  defaultCategory?: string;
  defaultLocation?: string;
}

export function SearchForm({
  onSearch,
  defaultCategory = "",
  defaultLocation = "",
}: SearchFormProps) {
  const [category, setCategory] = useState(defaultCategory);
  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(category || location)) return;

    setLoading(true);
    try {
      const result = await searchPlacesAction(category, location);

      if ("leads" in result) {
        const { leads } = result;
        console.log(
          "Search success:",
          leads.length > 0 ? "Data fetched" : "No data",
          leads
        );
        toast.success("Search completed successfully");
        onSearch({ category, location });
      } else {
        console.error("Search failed:", result.error);
        toast.error("Search failed. See console for details.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      toast.error("Search failed. See console for details.");
    } finally {
      setLoading(false);
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
        {loading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
