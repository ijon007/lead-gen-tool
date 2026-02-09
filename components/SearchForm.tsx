"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category || location) {
      onSearch({ category, location });
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
        type="submit"
        variant="default"
      >
        <MagnifyingGlass className="size-4" />
        Search
      </Button>
    </form>
  );
}
