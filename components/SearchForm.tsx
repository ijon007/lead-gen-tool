"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES } from "@/constants"
import { SearchParams } from "@/types"
import { MagnifyingGlass } from "@phosphor-icons/react"

interface SearchFormProps {
  onSearch: (params: SearchParams) => void
  defaultCategory?: string
  defaultLocation?: string
}

export function SearchForm({
  onSearch,
  defaultCategory = "",
  defaultLocation = "",
}: SearchFormProps) {
  const [category, setCategory] = useState(defaultCategory)
  const [location, setLocation] = useState(defaultLocation)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (category || location) {
      onSearch({ category, location })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex-1 space-y-2 min-w-0">
        <label htmlFor="category" className="text-xs font-medium text-foreground block">
          Category
        </label>
        <Select value={category} onValueChange={(value) => setCategory(value || "")}>
          <SelectTrigger id="category" className="w-full mb-0">
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

      <div className="flex-1 space-y-2 min-w-0">
        <label htmlFor="location" className="text-xs font-medium text-foreground block">
          Location
        </label>
        <Input
          id="location"
          type="text"
          placeholder="Enter location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <Button type="submit" variant="default" className="w-full sm:w-auto shrink-0">
        <MagnifyingGlass className="size-4" />
        Search
      </Button>
    </form>
  )
}
