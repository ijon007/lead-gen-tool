"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { EditableTitle } from "@/components/EditableTitle";
import { EnrichmentLoading } from "@/components/EnrichmentLoading";
import { ExportButton } from "@/components/ExportButton";
import { ResultsTable } from "@/components/ResultsTable";
import { SearchForm } from "@/components/SearchForm";
import { SheetTabs } from "@/components/SheetTabs";
import { DEFAULT_TABLE_COLUMNS } from "@/constants";
import type {
  Lead,
  SearchParams,
  SheetState,
  TableColumnConfig,
} from "@/types";

function createDefaultSheet(): SheetState {
  const id = crypto.randomUUID();
  return {
    id,
    name: "Generation 1",
    leads: [],
    searchParams: null,
    columns: DEFAULT_TABLE_COLUMNS,
  };
}

// Create default sheet once for initialization
let defaultSheetInstance: SheetState | null = null;
function getDefaultSheet(): SheetState {
  if (!defaultSheetInstance) {
    defaultSheetInstance = createDefaultSheet();
  }
  return defaultSheetInstance;
}

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize with one default sheet
  const [sheets, setSheets] = useState<Record<string, SheetState>>(() => {
    const defaultSheet = getDefaultSheet();
    return { [defaultSheet.id]: defaultSheet };
  });
  const [sheetOrder, setSheetOrder] = useState<string[]>(() => {
    const defaultSheet = getDefaultSheet();
    return [defaultSheet.id];
  });
  const [isSearching, setIsSearching] = useState(false);
  // Get active sheet ID from URL, fallback to first sheet
  const urlSheetId = searchParams.get("sheet");
  const activeSheetId = useMemo(() => {
    if (urlSheetId && sheets[urlSheetId]) {
      return urlSheetId;
    }
    return sheetOrder[0] || "";
  }, [urlSheetId, sheets, sheetOrder]);

  // Sync URL if needed
  useEffect(() => {
    if (!(urlSheetId && sheets[urlSheetId])) {
      const firstSheetId = sheetOrder[0];
      if (firstSheetId) {
        router.replace(`${pathname}?sheet=${firstSheetId}`);
      }
    }
  }, [urlSheetId, sheets, sheetOrder, router, pathname]);

  const activeSheet = sheets[activeSheetId];

  const filteredLeads = useMemo(() => {
    if (!activeSheet) {
      return [];
    }
    const { leads, searchParams: sheetSearchParams } = activeSheet;
    if (!sheetSearchParams) {
      return leads;
    }
    return leads.filter((lead) => {
      const categoryMatch =
        !sheetSearchParams.category ||
        lead.category === sheetSearchParams.category;
      const locationMatch =
        !sheetSearchParams.location ||
        lead.location
          .toLowerCase()
          .includes(sheetSearchParams.location.toLowerCase());
      return categoryMatch && locationMatch;
    });
  }, [activeSheet]);

  const hasSearched = useMemo(() => {
    return activeSheet
      ? activeSheet.leads.length > 0 || activeSheet.searchParams !== null
      : false;
  }, [activeSheet]);

  const handleUpdateLead = useCallback(
    (id: string, field: keyof Lead, value: string) => {
      if (!activeSheet) {
        return;
      }
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          leads: prev[activeSheetId].leads.map((lead) =>
            lead.id === id ? { ...lead, [field]: value } : lead
          ),
        },
      }));
    },
    [activeSheetId, activeSheet]
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: string) => {
      if (!activeSheet) {
        return;
      }
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          leads: prev[activeSheetId].leads.map((lead) =>
            lead.id === id ? { ...lead, status } : lead
          ),
        },
      }));
    },
    [activeSheetId, activeSheet]
  );

  const handleSearch = useCallback(
    (params: SearchParams, leads?: Lead[]) => {
      if (!activeSheet) {
        return;
      }
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          searchParams: params,
          ...(leads && { leads }),
        },
      }));
    },
    [activeSheetId, activeSheet]
  );

  const handleSelectSheet = useCallback(
    (id: string) => {
      router.replace(`${pathname}?sheet=${id}`);
    },
    [router, pathname]
  );

  const handleAddSheet = useCallback(() => {
    const newSheet: SheetState = {
      id: crypto.randomUUID(),
      name: `Generation ${sheetOrder.length + 1}`,
      leads: [],
      searchParams: null,
      columns: DEFAULT_TABLE_COLUMNS,
    };
    setSheets((prev) => ({ ...prev, [newSheet.id]: newSheet }));
    setSheetOrder((prev) => [...prev, newSheet.id]);
    router.replace(`${pathname}?sheet=${newSheet.id}`);
  }, [sheetOrder.length, router, pathname]);

  const handleRenameSheet = useCallback((id: string, name: string) => {
    setSheets((prev) => {
      if (!prev[id]) {
        return prev;
      }
      return {
        ...prev,
        [id]: {
          ...prev[id],
          name,
        },
      };
    });
  }, []);

  const handleDuplicateSheet = useCallback(
    (id: string) => {
      const source = sheets[id];
      if (!source) {
        return;
      }
      const newSheet: SheetState = {
        id: crypto.randomUUID(),
        name: `${source.name} (copy)`,
        leads: source.leads.map((l) => ({ ...l, id: crypto.randomUUID() })),
        searchParams: source.searchParams,
        columns: source.columns.map((c) => ({ ...c })),
      };
      setSheets((prev) => ({ ...prev, [newSheet.id]: newSheet }));
      const idx = sheetOrder.indexOf(id);
      setSheetOrder((prev) =>
        idx < 0
          ? [...prev, newSheet.id]
          : [...prev.slice(0, idx + 1), newSheet.id, ...prev.slice(idx + 1)]
      );
      router.replace(`${pathname}?sheet=${newSheet.id}`);
    },
    [sheets, sheetOrder, router, pathname]
  );

  const handleDeleteSheet = useCallback(
    (id: string) => {
      if (sheetOrder.length <= 1) {
        return;
      }
      const newOrder = sheetOrder.filter((s) => s !== id);
      setSheetOrder(newOrder);
      setSheets((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (activeSheetId === id) {
        const nextActive = newOrder[0];
        if (nextActive) {
          router.replace(`${pathname}?sheet=${nextActive}`);
        }
      }
    },
    [sheetOrder, activeSheetId, router, pathname]
  );

  const handleColumnsChange = useCallback(
    (columns: TableColumnConfig[]) => {
      if (!activeSheet) {
        return;
      }
      setSheets((prev) => ({
        ...prev,
        [activeSheetId]: {
          ...prev[activeSheetId],
          columns,
        },
      }));
    },
    [activeSheetId, activeSheet]
  );

  if (!activeSheet) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-2 transition-all duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl transition-all duration-300">
        <SheetTabs
          activeSheetId={activeSheetId}
          onAddSheet={handleAddSheet}
          onDeleteSheet={handleDeleteSheet}
          onDuplicateSheet={handleDuplicateSheet}
          onRenameSheet={handleRenameSheet}
          onSelectSheet={handleSelectSheet}
          sheetOrder={sheetOrder}
          sheets={sheets}
        />
        {hasSearched && (
          <header className="mb-6 transition-all duration-300">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <EditableTitle
                key={activeSheetId}
                name={activeSheet.name}
                onSave={(newName) => handleRenameSheet(activeSheetId, newName)}
              />
              <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-end sm:justify-end sm:gap-3">
                <SearchForm
                  columns={activeSheet.columns}
                  onLoadingChange={setIsSearching}
                  onSearch={handleSearch}
                />
                <ExportButton
                  columns={activeSheet.columns}
                  leads={filteredLeads}
                />
              </div>
            </div>
          </header>
        )}

        {isSearching ? (
          <main className="fade-in-0 slide-in-from-top-4 animate-in space-y-4 duration-300">
            <EnrichmentLoading />
          </main>
        ) : hasSearched ? (
          <main className="fade-in-0 slide-in-from-top-4 animate-in space-y-4 duration-300">
            <ResultsTable
              leads={filteredLeads}
              onColumnsChange={handleColumnsChange}
              onUpdateLead={handleUpdateLead}
              onUpdateStatus={handleUpdateStatus}
              visibleColumns={activeSheet.columns}
            />
          </main>
        ) : (
          <div className="fade-in-0 animate-in space-y-8 py-12 text-center duration-300">
            <h1 className="font-bold text-4xl text-foreground">
              Lead Generator
            </h1>
            <p className="text-muted-foreground text-sm">
              Search for business leads by category and location
            </p>
            <div className="mx-auto max-w-lg">
              <SearchForm
                columns={activeSheet.columns}
                onLoadingChange={setIsSearching}
                onSearch={handleSearch}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
