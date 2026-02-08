"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { SearchForm } from "@/components/SearchForm"
import { ResultsTable } from "@/components/ResultsTable"
import { ExportButton } from "@/components/ExportButton"
import { ColumnCustomizer } from "@/components/ColumnCustomizer"
import { SheetTabs } from "@/components/SheetTabs"
import { MOCK_LEADS, DEFAULT_TABLE_COLUMNS } from "@/constants"
import { Lead, SearchParams, TableColumnConfig, SheetState } from "@/types"
import { EditableTitle } from "@/components/EditableTitle"

function createDefaultSheet(): SheetState {
  const id = crypto.randomUUID()
  return {
    id,
    name: "Generation 1",
    leads: MOCK_LEADS,
    searchParams: null,
    columns: DEFAULT_TABLE_COLUMNS,
  }
}

// Create default sheet once for initialization
let defaultSheetInstance: SheetState | null = null
function getDefaultSheet(): SheetState {
  if (!defaultSheetInstance) {
    defaultSheetInstance = createDefaultSheet()
  }
  return defaultSheetInstance
}

export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize with one default sheet
  const [sheets, setSheets] = useState<Record<string, SheetState>>(() => {
    const defaultSheet = getDefaultSheet()
    return { [defaultSheet.id]: defaultSheet }
  })
  const [sheetOrder, setSheetOrder] = useState<string[]>(() => {
    const defaultSheet = getDefaultSheet()
    return [defaultSheet.id]
  })
  // Get active sheet ID from URL, fallback to first sheet
  const urlSheetId = searchParams.get("sheet")
  const activeSheetId = useMemo(() => {
    if (urlSheetId && sheets[urlSheetId]) {
      return urlSheetId
    }
    return sheetOrder[0] || ""
  }, [urlSheetId, sheets, sheetOrder])

  // Sync URL if needed
  useEffect(() => {
    if (!urlSheetId || !sheets[urlSheetId]) {
      const firstSheetId = sheetOrder[0]
      if (firstSheetId) {
        router.replace(`${pathname}?sheet=${firstSheetId}`)
      }
    }
  }, [urlSheetId, sheets, sheetOrder, router, pathname])

  const activeSheet = sheets[activeSheetId]

  const filteredLeads = useMemo(() => {
    if (!activeSheet) return []
    const { leads, searchParams: sheetSearchParams } = activeSheet
    if (!sheetSearchParams) return leads
    return leads.filter((lead) => {
      const categoryMatch =
        !sheetSearchParams.category || lead.category === sheetSearchParams.category
      const locationMatch =
        !sheetSearchParams.location ||
        lead.location.toLowerCase().includes(sheetSearchParams.location.toLowerCase())
      return categoryMatch && locationMatch
    })
  }, [activeSheet])

  const hasSearched = useMemo(() => {
    return activeSheet ? activeSheet.leads.length > 0 || activeSheet.searchParams !== null : false
  }, [activeSheet])

  const handleUpdateLead = useCallback(
    (id: string, field: keyof Lead, value: string) => {
      if (!activeSheet) return
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          leads: prev[activeSheetId].leads.map((lead) =>
            lead.id === id ? { ...lead, [field]: value } : lead
          ),
        },
      }))
    },
    [activeSheetId, activeSheet]
  )

  const handleUpdateStatus = useCallback(
    (id: string, status: string) => {
      if (!activeSheet) return
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          leads: prev[activeSheetId].leads.map((lead) =>
            lead.id === id ? { ...lead, status } : lead
          ),
        },
      }))
    },
    [activeSheetId, activeSheet]
  )

  const handleSearch = useCallback(
    (params: SearchParams) => {
      if (!activeSheet) return
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          searchParams: params,
        },
      }))
    },
    [activeSheetId, activeSheet]
  )

  const handleSelectSheet = useCallback(
    (id: string) => {
      router.replace(`${pathname}?sheet=${id}`)
    },
    [router, pathname]
  )

  const handleAddSheet = useCallback(() => {
    const newSheet: SheetState = {
      id: crypto.randomUUID(),
      name: `Generation ${sheetOrder.length + 1}`,
      leads: [],
      searchParams: null,
      columns: DEFAULT_TABLE_COLUMNS,
    }
    setSheets((prev) => ({ ...prev, [newSheet.id]: newSheet }))
    setSheetOrder((prev) => [...prev, newSheet.id])
    router.replace(`${pathname}?sheet=${newSheet.id}`)
  }, [sheetOrder.length, router, pathname])

  const handleRenameSheet = useCallback((id: string, name: string) => {
    setSheets((prev) => {
      if (!prev[id]) return prev
      return {
        ...prev,
        [id]: {
          ...prev[id],
          name,
        },
      }
    })
  }, [])

  const handleColumnsChange = useCallback(
    (columns: TableColumnConfig[]) => {
      if (!activeSheet) return
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          columns,
        },
      }))
    },
    [activeSheetId, activeSheet]
  )

  if (!activeSheet) {
    return null
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        hasSearched
          ? "py-2 px-4 sm:px-6 lg:px-8"
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
            <SheetTabs
              sheets={sheets}
              sheetOrder={sheetOrder}
              activeSheetId={activeSheetId}
              onSelectSheet={handleSelectSheet}
              onAddSheet={handleAddSheet}
              onRenameSheet={handleRenameSheet}
            />
            <header className="mb-6 transition-all duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <EditableTitle
                  key={activeSheetId}
                  name={activeSheet.name}
                  onSave={(newName) => handleRenameSheet(activeSheetId, newName)}
                />
                <div className="shrink-0">
                  <SearchForm onSearch={handleSearch} />
                </div>
              </div>
            </header>

            <main className="space-y-4 animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-end gap-2">
                <ColumnCustomizer
                  columns={activeSheet.columns}
                  onChange={handleColumnsChange}
                />
                <ExportButton leads={filteredLeads} columns={activeSheet.columns} />
              </div>
              <ResultsTable
                leads={filteredLeads}
                visibleColumns={activeSheet.columns}
                onUpdateLead={handleUpdateLead}
                onUpdateStatus={handleUpdateStatus}
              />
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
