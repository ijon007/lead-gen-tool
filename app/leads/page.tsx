"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Authenticated, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableTitle } from "@/components/EditableTitle";
import { EnrichmentLoading } from "@/components/EnrichmentLoading";
import { ExportButton } from "@/components/ExportButton";
import { ResultsTable } from "@/components/ResultsTable";
import { SearchForm, type LoadingStage } from "@/components/SearchForm";
import { SheetTabs } from "@/components/SheetTabs";
import { DEFAULT_TABLE_COLUMNS } from "@/constants";
import { searchPlacesAction, enrichLeadsAction } from "@/lib/actions";
import type {
  Lead,
  SearchParams,
  TableColumnConfig,
} from "@/types";
import { Id } from "@/convex/_generated/dataModel";

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Convex queries and mutations
  const sheets = useQuery(api.sheets.list);
  const storeUser = useMutation(api.users.store);
  const createSheet = useMutation(api.sheets.create);
  const updateSheet = useMutation(api.sheets.update);
  const deleteSheet = useMutation(api.sheets.remove);
  const createBatchLeads = useMutation(api.leads.createBatch);
  const updateLead = useMutation(api.leads.update);

  // Ensure user is stored on mount
  useEffect(() => {
    storeUser();
  }, [storeUser]);

  const [isSearching, setIsSearching] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);

  // Get active sheet ID from URL, fallback to first sheet
  const urlSheetId = searchParams.get("sheet");
  const activeSheetId = useMemo(() => {
    if (!sheets) return null;
    if (urlSheetId && sheets.some((s) => s._id === urlSheetId)) {
      return urlSheetId;
    }
    return sheets[0]?._id || null;
  }, [urlSheetId, sheets]);

  // Sync URL if needed
  useEffect(() => {
    if (sheets && activeSheetId && urlSheetId !== activeSheetId) {
      router.replace(`${pathname}?sheet=${activeSheetId}`);
    }
  }, [sheets, activeSheetId, urlSheetId, router, pathname]);

  // Get leads for active sheet
  const leads = useQuery(
    api.leads.listBySheet,
    activeSheetId ? { sheetId: activeSheetId as Id<"sheets"> } : "skip"
  );

  const activeSheet = useMemo(() => {
    if (!sheets || !activeSheetId) return null;
    return sheets.find((s) => s._id === activeSheetId) || null;
  }, [sheets, activeSheetId]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.map((lead) => ({
      id: lead._id,
      businessName: lead.businessName,
      category: lead.category,
      location: lead.location,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      address: lead.address,
      description: lead.description,
      status: lead.status,
      rating: lead.rating,
      googleMapsUri: lead.googleMapsUri,
      instagram: lead.instagram,
      facebook: lead.facebook,
      linkedIn: lead.linkedIn,
      x: lead.x,
      notes: lead.notes,
    }));
  }, [leads]);

  const hasSearched = useMemo(() => {
    return activeSheet
      ? filteredLeads.length > 0 || activeSheet.searchParams !== null
      : false;
  }, [activeSheet, filteredLeads]);

  // Create default sheet if none exist
  useEffect(() => {
    if (sheets && sheets.length === 0) {
      createSheet({
        name: "Generation 1",
        searchParams: null,
        columns: DEFAULT_TABLE_COLUMNS,
      }).then((sheetId) => {
        router.replace(`${pathname}?sheet=${sheetId}`);
      });
    }
  }, [sheets, createSheet, router, pathname]);

  const handleUpdateLead = useCallback(
    async (id: string, field: keyof Lead, value: string) => {
      const updates: Record<string, string | number | undefined> = {};
      updates[field] = value;
      await updateLead({ leadId: id as Id<"leads">, ...updates });
    },
    [updateLead]
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: string) => {
      await updateLead({ leadId: id as Id<"leads">, status });
    },
    [updateLead]
  );

  const handleSearch = useCallback(
    async (params: SearchParams, leads?: Lead[]) => {
      if (!activeSheetId || !activeSheet) return;

      let leadsToSave = leads;

      // If no leads provided, perform search
      if (!leadsToSave) {
        setLoadingStage("search");
        const searchResult = await searchPlacesAction(
          params.category,
          params.location
        );

        if ("error" in searchResult) {
          console.error("Search error:", searchResult.error);
          setLoadingStage(null);
          setIsSearching(false);
          return;
        }

        leadsToSave = searchResult.leads;

        // Enrich leads
        if (leadsToSave.length > 0) {
          setLoadingStage("enrich");
          const enrichResult = await enrichLeadsAction(
            leadsToSave,
            activeSheet.columns
          );

          if ("error" in enrichResult) {
            console.error("Enrichment error:", enrichResult.error);
            // Continue with unenriched leads
          } else {
            leadsToSave = enrichResult.leads;
          }
        }
      }

      // Update sheet with search params
      await updateSheet({
        sheetId: activeSheetId as Id<"sheets">,
        searchParams: params,
      });

      // Save leads if we have any
      if (leadsToSave && leadsToSave.length > 0) {
        // Convert leads to Convex format (remove id)
        const leadsToInsert = leadsToSave.map((lead) => {
          const { id, ...rest } = lead;
          return rest;
        });

        await createBatchLeads({
          sheetId: activeSheetId as Id<"sheets">,
          leads: leadsToInsert,
        });
      }

      setLoadingStage(null);
    },
    [activeSheetId, activeSheet, updateSheet, createBatchLeads]
  );

  const handleSelectSheet = useCallback(
    (id: string) => {
      router.replace(`${pathname}?sheet=${id}`);
    },
    [router, pathname]
  );

  const handleAddSheet = useCallback(async () => {
    if (!sheets) return;
    const sheetId = await createSheet({
      name: `Generation ${sheets.length + 1}`,
      searchParams: null,
      columns: DEFAULT_TABLE_COLUMNS,
    });
    router.replace(`${pathname}?sheet=${sheetId}`);
  }, [sheets, createSheet, router, pathname]);

  const handleRenameSheet = useCallback(
    async (id: string, name: string) => {
      await updateSheet({ sheetId: id as Id<"sheets">, name });
    },
    [updateSheet]
  );

  const handleDuplicateSheet = useCallback(
    async (id: string) => {
      const source = sheets?.find((s) => s._id === id);
      if (!source || !leads) return;

      const sourceLeads = leads.filter((l) => l.sheetId === id);
      const newSheetId = await createSheet({
        name: `${source.name} (copy)`,
        searchParams: source.searchParams,
        columns: source.columns,
      });

      if (sourceLeads.length > 0) {
        const leadsToInsert = sourceLeads.map((lead) => {
          const { _id, _creationTime, sheetId, userId, ...rest } = lead;
          return rest;
        });
        await createBatchLeads({
          sheetId: newSheetId,
          leads: leadsToInsert,
        });
      }

      router.replace(`${pathname}?sheet=${newSheetId}`);
    },
    [sheets, leads, createSheet, createBatchLeads, router, pathname]
  );

  const handleDeleteSheet = useCallback(
    async (id: string) => {
      if (!sheets || sheets.length <= 1) return;
      await deleteSheet({ sheetId: id as Id<"sheets"> });
      const remaining = sheets.filter((s) => s._id !== id);
      if (activeSheetId === id && remaining[0]) {
        router.replace(`${pathname}?sheet=${remaining[0]._id}`);
      }
    },
    [sheets, activeSheetId, deleteSheet, router, pathname]
  );

  const handleColumnsChange = useCallback(
    async (columns: TableColumnConfig[]) => {
      if (!activeSheetId) return;
      await updateSheet({
        sheetId: activeSheetId as Id<"sheets">,
        columns,
      });
    },
    [activeSheetId, updateSheet]
  );

  if (!sheets || !activeSheet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Convert sheets to the format expected by SheetTabs
  const sheetsRecord = useMemo(() => {
    if (!sheets) return {};
    const record: Record<string, { id: string; name: string }> = {};
    for (const sheet of sheets) {
      record[sheet._id] = {
        id: sheet._id,
        name: sheet.name,
      };
    }
    return record;
  }, [sheets]);

  const sheetOrder = useMemo(() => {
    if (!sheets) return [];
    return sheets.map((s) => s._id);
  }, [sheets]);

  return (
    <div className="min-h-screen px-4 py-2 transition-all duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl transition-all duration-300">
        <SheetTabs
          activeSheetId={activeSheetId || ""}
          onAddSheet={handleAddSheet}
          onDeleteSheet={handleDeleteSheet}
          onDuplicateSheet={handleDuplicateSheet}
          onRenameSheet={handleRenameSheet}
          onSelectSheet={handleSelectSheet}
          sheetOrder={sheetOrder}
          sheets={sheetsRecord}
        />
        {hasSearched && (
          <header className="mb-6 transition-all duration-300">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <EditableTitle
                key={activeSheetId}
                name={activeSheet.name}
                onSave={(newName) =>
                  handleRenameSheet(activeSheetId || "", newName)
                }
              />
              <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-end sm:justify-end sm:gap-3">
                <SearchForm
                  columns={activeSheet.columns}
                  onLoadingChange={setIsSearching}
                  onLoadingStageChange={setLoadingStage}
                  onSearch={handleSearch}
                  defaultCategory={activeSheet.searchParams?.category || ""}
                  defaultLocation={activeSheet.searchParams?.location || ""}
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
            <EnrichmentLoading stage={loadingStage} />
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
                onLoadingStageChange={setLoadingStage}
                onSearch={handleSearch}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Authenticated>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      }>
        <PageContent />
      </Suspense>
    </Authenticated>
  );
}
