"use client"

import { useState, useMemo } from "react"
import { SearchForm } from "@/components/SearchForm"
import { ResultsTable } from "@/components/ResultsTable"
import { ExportButton } from "@/components/ExportButton"
import { ColumnCustomizer } from "@/components/ColumnCustomizer"
import { MOCK_LEADS, DEFAULT_TABLE_COLUMNS } from "@/constants"
import { Lead, SearchParams, TableColumnConfig } from "@/types"

export default function Page() {
  const [hasSearched, setHasSearched] = useState(true)
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)
  const [columns, setColumns] = useState<TableColumnConfig[]>(DEFAULT_TABLE_COLUMNS)

  const filteredLeads = useMemo(() => {
    if (!searchParams) return MOCK_LEADS
    return MOCK_LEADS.filter((lead) => {
      const categoryMatch = !searchParams.category || lead.category === searchParams.category
      const locationMatch = !searchParams.location ||
        lead.location.toLowerCase().includes(searchParams.location.toLowerCase())
      return categoryMatch && locationMatch
    })
  }, [searchParams])

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params)
    setHasSearched(true)
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        hasSearched
          ? "py-6 px-4 sm:px-6 lg:px-8"
          : "flex items-center justify-center px-4"
      }`}
    >
      <div
        className={`w-full max-w-7xl mx-auto transition-all duration-300 ${
          hasSearched ? "" : "max-w-2xl"
        }`}
      >
        {hasSearched ? (
          <>
            <header className="mb-6 transition-all duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">Lead Generator</h1>
                <div className="shrink-0">
                  <SearchForm onSearch={handleSearch} />
                </div>
              </div>
            </header>

            <main className="space-y-4 animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-end gap-2">
                <ColumnCustomizer columns={columns} onChange={setColumns} />
                <ExportButton leads={filteredLeads} columns={columns} />
              </div>
              <ResultsTable leads={filteredLeads} visibleColumns={columns} />
            </main>
          </>
        ) : (
          <div className="text-center space-y-8 animate-in fade-in-0 duration-300">
            <h1 className="text-4xl font-bold text-foreground">Lead Generator</h1>
            <p className="text-muted-foreground text-sm">
              Search for business leads by category and location
            </p>
            <div className="max-w-lg mx-auto">
              <SearchForm onSearch={handleSearch} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
