"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
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
import type { Lead, SearchParams } from "@/types";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@phosphor-icons/react";

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentUser = useQuery(api.users.getCurrent);
  const sheets = useQuery(
    api.sheets.list,
    currentUser !== undefined && currentUser !== null ? undefined : "skip"
  );
  const storeUser = useMutation(api.users.store);
  const createSheet = useMutation(api.sheets.create);
  const updateSheet = useMutation(api.sheets.update);
  const createBatchLeads = useMutation(api.leads.createBatch);

  useEffect(() => {
    if (currentUser === null) storeUser();
  }, [currentUser, storeUser]);

  const [isSearching, setIsSearching] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);

  const urlSheetId = searchParams.get("sheet");
  const activeSheetId = useMemo(() => {
    if (!sheets) return null;
    if (urlSheetId && sheets.some((s) => s._id === urlSheetId)) return urlSheetId;
    return sheets[0]?._id || null;
  }, [urlSheetId, sheets]);

  useEffect(() => {
    if (sheets && activeSheetId && urlSheetId !== activeSheetId) {
      router.replace(`${pathname}?sheet=${activeSheetId}`);
    }
  }, [sheets, activeSheetId, urlSheetId, router, pathname]);

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

  const hasSearched = useMemo(
    () =>
      activeSheet
        ? filteredLeads.length > 0 || activeSheet.searchParams !== null
        : false,
    [activeSheet, filteredLeads]
  );

  useEffect(() => {
    if (sheets && sheets.length === 0) {
      createSheet({
        name: "Generation 1",
        searchParams: null,
        columns: DEFAULT_TABLE_COLUMNS,
      }).then((sheetId) => router.replace(`${pathname}?sheet=${sheetId}`));
    }
  }, [sheets, createSheet, router, pathname]);

  // Shared by SheetTabs + EditableTitle
  async function handleRenameSheet(id: string, name: string) {
    await updateSheet({ sheetId: id as Id<"sheets">, name });
  }

  // Used by both SearchForm instances (header + empty state)
  async function handleSearch(params: SearchParams, existingLeads?: Lead[]) {
    if (!activeSheetId || !activeSheet) return;

    let leadsToSave = existingLeads;

    if (!leadsToSave) {
      setLoadingStage("search");
      const searchResult = await searchPlacesAction(
        params.category,
        params.location,
        params.limit
      );
      if ("error" in searchResult) {
        console.error("Search error:", searchResult.error);
        setLoadingStage(null);
        setIsSearching(false);
        return;
      }
      leadsToSave = searchResult.leads;

      if (leadsToSave.length > 0) {
        setLoadingStage("enrich");
        const enrichResult = await enrichLeadsAction(
          leadsToSave,
          activeSheet.columns
        );
        if ("error" in enrichResult) {
          console.error("Enrichment error:", enrichResult.error);
        } else {
          leadsToSave = enrichResult.leads;
        }
      }
    }

    await updateSheet({
      sheetId: activeSheetId as Id<"sheets">,
      searchParams: params,
    });

    if (leadsToSave && leadsToSave.length > 0) {
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
  }

  if (!sheets || !activeSheet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-4 animate-spin" weight="bold" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${isSearching ? 'overflow-hidden h-screen' : ''}`}>
      <SheetTabs
        activeSheetId={activeSheetId ?? ""}
        onRenameSheet={handleRenameSheet}
        sheets={sheets}
      />
      <div className="px-4 py-2 transition-all duration-300 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl transition-all duration-300">
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
                  defaultCategory={activeSheet.searchParams?.category || ""}
                  defaultLocation={activeSheet.searchParams?.location || ""}
                  defaultLimit={(activeSheet.searchParams as SearchParams | null)?.limit || 10}
                  onLoadingChange={setIsSearching}
                  onLoadingStageChange={setLoadingStage}
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
          <main className="fade-in-0 slide-in-from-top-4 animate-in overflow-hidden duration-300">
            <EnrichmentLoading stage={loadingStage} />
          </main>
        ) : hasSearched ? (
          <main className="fade-in-0 slide-in-from-top-4 animate-in space-y-4 duration-300">
            <ResultsTable
              leads={filteredLeads}
              sheetId={activeSheetId ?? ""}
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
