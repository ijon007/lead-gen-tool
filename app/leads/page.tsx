"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EnrichmentLoading } from "@/components/EnrichmentLoading";
import { ExportButton } from "@/components/ExportButton";
import { QualifyLeadsDialog } from "@/components/QualifyLeadsDialog";
import { QualificationProgressBanner } from "@/components/QualificationProgressBanner";
import { ResultsTable } from "@/components/ResultsTable";
import { SearchForm, type LoadingStage } from "@/components/SearchForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLeadsContext } from "@/components/leads-context";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DEFAULT_TABLE_COLUMNS } from "@/constants";
import { searchPlacesAction, enrichLeadsAction, addOneLeadAction, qualifyLeadsAction } from "@/lib/actions";
import { getExistingLeadKey } from "@/utils/leadKey";
import type { Lead, SearchParams } from "@/types";
import { Id } from "@/convex/_generated/dataModel";
import { BroomIcon, Spinner, XCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setGeneratingSheetId } = useLeadsContext();

  const currentUser = useQuery(api.users.getCurrent);
  const sheets = useQuery(
    api.sheets.list,
    currentUser !== undefined && currentUser !== null ? undefined : "skip"
  );
  const storeUser = useMutation(api.users.store);
  const createSheet = useMutation(api.sheets.create);
  const updateSheet = useMutation(api.sheets.update);
  const createBatchLeads = useMutation(api.leads.createBatch);
  const updateBatchLeads = useMutation(api.leads.updateBatch);
  const removeManyLeads = useMutation(api.leads.removeMany);

  useEffect(() => {
    if (currentUser === null) storeUser();
  }, [currentUser, storeUser]);

  const [isSearching, setIsSearching] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [searchInProgressForSheetId, setSearchInProgressForSheetId] = useState<string | null>(null);
  const [isAddingOneLead, setIsAddingOneLead] = useState(false);
  const [isGetMore, setIsGetMore] = useState(false);
  const [getMoreLimit, setGetMoreLimit] = useState<number | undefined>(undefined);
  const [qualifyDialogOpen, setQualifyDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [qualificationState, setQualificationState] = useState<{
    phase: "running" | "done";
    total: number;
    done: number;
  } | null>(null);

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
    const byCreatedAsc = [...leads].sort(
      (a, b) => a.createdAt - b.createdAt
    );
    return byCreatedAsc.map((lead) => ({
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
      qualification: lead.qualification,
    }));
  }, [leads]);

  const hasSearched = useMemo(
    () =>
      activeSheet
        ? filteredLeads.length > 0 || activeSheet.searchParams !== null
        : false,
    [activeSheet, filteredLeads]
  );

  const columnsWithQualification = useMemo(() => {
    if (!activeSheet) return [];
    const hasQualification = activeSheet.columns.some((c) => c.id === "qualification");
    if (hasQualification) return activeSheet.columns;
    const qualCol = DEFAULT_TABLE_COLUMNS.find((c) => c.id === "qualification");
    return qualCol ? [...activeSheet.columns, qualCol] : activeSheet.columns;
  }, [activeSheet]);

  const skipLeadIds = useMemo(
    () => filteredLeads.filter((l) => l.qualification === "Skip").map((l) => l.id as Id<"leads">),
    [filteredLeads]
  );
  const showCleanupButton = skipLeadIds.length > 0;

  useEffect(() => {
    if (sheets && sheets.length === 0) {
      createSheet({
        name: "Generation 1",
        searchParams: null,
        columns: DEFAULT_TABLE_COLUMNS,
      }).then((sheetId) => router.replace(`${pathname}?sheet=${sheetId}`));
    }
  }, [sheets, createSheet, router, pathname]);

  function handleSearchStart(sheetId: string, isGetMoreMode?: boolean, limit?: number) {
    setSearchInProgressForSheetId(sheetId);
    setGeneratingSheetId(sheetId);
    setIsGetMore(isGetMoreMode ?? false);
    setGetMoreLimit(limit);
  }

  function handleSearchEnd() {
    setSearchInProgressForSheetId(null);
    setGeneratingSheetId(null);
    setIsGetMore(false);
    setGetMoreLimit(undefined);
  }

  async function handleSearch(params: SearchParams, existingLeads?: Lead[], sheetIdOverride?: string) {
    const targetSheetId = sheetIdOverride ?? activeSheetId;
    const targetSheet = sheets?.find((s) => s._id === targetSheetId);
    if (!targetSheetId || !targetSheet) return;

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
        handleSearchEnd();
        return;
      }
      leadsToSave = searchResult.leads;

      if (leadsToSave.length > 0) {
        setLoadingStage("enrich");
        const enrichResult = await enrichLeadsAction(
          leadsToSave,
          targetSheet.columns
        );
        if ("error" in enrichResult) {
          console.error("Enrichment error:", enrichResult.error);
        } else {
          leadsToSave = enrichResult.leads;
        }
      }
    }

    await updateSheet({
      sheetId: targetSheetId as Id<"sheets">,
      searchParams: params,
    });

    if (leadsToSave && leadsToSave.length > 0) {
      const leadsToInsert = leadsToSave.map((lead) => {
        const { id, ...rest } = lead;
        return rest;
      });
      await createBatchLeads({
        sheetId: targetSheetId as Id<"sheets">,
        leads: leadsToInsert,
      });
    }
    setLoadingStage(null);
    handleSearchEnd();
  }

  const canAddOneLead = Boolean(
    activeSheet?.searchParams &&
      (activeSheet.searchParams.category || activeSheet.searchParams.location)
  );

  async function handleAddOneLead() {
    if (!canAddOneLead) {
      toast.error("Run a search first to add more leads");
      return;
    }
    if (!activeSheetId || !activeSheet) return;
    setIsAddingOneLead(true);
    setGeneratingSheetId(activeSheetId);
    try {
      const existingLeadKeys = filteredLeads.map(getExistingLeadKey);
      const result = await addOneLeadAction(
        activeSheet.searchParams!.category,
        activeSheet.searchParams!.location,
        existingLeadKeys,
        activeSheet.columns
      );
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const { id, ...rest } = result.lead;
      await createBatchLeads({
        sheetId: activeSheetId as Id<"sheets">,
        leads: [rest],
      });
      toast.success("Lead added");
    } finally {
      setIsAddingOneLead(false);
      setGeneratingSheetId(null);
    }
  }

  const QUALIFY_CHUNK_SIZE = 5;

  function handleQualifyRun(instructions: string) {
    if (filteredLeads.length === 0) {
      toast.error("No leads to qualify.");
      return;
    }
    const leadsToQualify = [...filteredLeads];
    const total = leadsToQualify.length;
    setQualificationState({ phase: "running", total, done: 0 });

    (async () => {
      for (let i = 0; i < total; i += QUALIFY_CHUNK_SIZE) {
        const chunk = leadsToQualify.slice(i, i + QUALIFY_CHUNK_SIZE);
        const result = await qualifyLeadsAction(chunk, instructions);
        if ("error" in result) {
          toast.error(result.error);
          setQualificationState(null);
          return;
        }
        const updates = chunk.map((lead, j) => ({
          leadId: lead.id as Id<"leads">,
          qualification: result.qualifications[j] ?? "Skip",
        }));
        await updateBatchLeads({ updates });
        setQualificationState({
          phase: "running",
          total,
          done: Math.min(i + chunk.length, total),
        });
      }
      setQualificationState({ phase: "done", total, done: total });
    })();
  }

  useEffect(() => {
    if (qualificationState?.phase !== "done") return;
    const id = setTimeout(() => setQualificationState(null), 2000);
    return () => clearTimeout(id);
  }, [qualificationState?.phase]);

  if (!sheets || !activeSheet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-4 animate-spin" weight="bold" />
      </div>
    );
  }

  const showLoadingForActiveTab = isSearching && searchInProgressForSheetId === activeSheetId;

  return (
    <div
      className={`flex h-full min-h-0 min-w-0 flex-col transition-all duration-300 ${showLoadingForActiveTab ? "overflow-hidden" : ""}`}
    >
      <div className="min-w-0 flex-1 overflow-auto transition-all duration-300">
        <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background py-1 px-1">
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <span className="block sm:hidden truncate text-sm font-semibold text-foreground">
                {activeSheet.name}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 basis-full sm:basis-0">
              <SearchForm
                columns={activeSheet.columns}
                sheetId={activeSheetId ?? ""}
                defaultCategory={activeSheet.searchParams?.category || ""}
                defaultLocation={activeSheet.searchParams?.location || ""}
                defaultLimit={(activeSheet.searchParams as SearchParams | null)?.limit || 10}
                onLoadingChange={setIsSearching}
                onLoadingStageChange={setLoadingStage}
                onSearchStart={handleSearchStart}
                onSearchEnd={handleSearchEnd}
                onSearch={handleSearch}
                existingLeads={filteredLeads}
                sheetSearchParams={activeSheet?.searchParams ?? null}
              />
            </div>
            <div className="flex shrink-0 w-full lg:w-auto flex-wrap items-center gap-1">
              {hasSearched && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQualifyDialogOpen(true)}
                >
                  <BroomIcon className="size-3" weight="bold" />
                  Qualify leads
                </Button>
              )}
              {showCleanupButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCleanupDialogOpen(true)}
                >
                  <XCircleIcon className="size-3" weight="bold" />
                  Clean up sheet
                </Button>
              )}
              <ExportButton
                columns={columnsWithQualification}
                leads={filteredLeads}
              />
            </div>
          </div>
        </header>

        <QualifyLeadsDialog
          open={qualifyDialogOpen}
          onOpenChange={setQualifyDialogOpen}
          onRun={handleQualifyRun}
        />
        {qualificationState && (
          <QualificationProgressBanner
            total={qualificationState.total}
            done={qualificationState.done}
            isComplete={qualificationState.phase === "done"}
            onDismiss={() => setQualificationState(null)}
          />
        )}
        <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove skipped leads?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove all rows marked Skip? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  removeManyLeads({ leadIds: skipLeadIds });
                  toast.success("Skipped leads removed.");
                  setCleanupDialogOpen(false);
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="py-2 px-1 transition-all duration-300">
          <div className="mx-auto w-full max-w-7xl min-w-0 transition-all duration-300">
            {showLoadingForActiveTab && !isGetMore ? (
              <main className="fade-in-0 slide-in-from-top-4 animate-in overflow-hidden duration-300">
                <EnrichmentLoading stage={loadingStage} />
              </main>
            ) : hasSearched ? (
              <main className="fade-in-0 slide-in-from-top-4 animate-in space-y-4 duration-300">
                <ResultsTable
                  leads={filteredLeads}
                  sheetId={activeSheetId ?? ""}
                  visibleColumns={columnsWithQualification}
                  onAddOneLead={handleAddOneLead}
                  isAddingOneLead={isAddingOneLead}
                  canAddOneLead={canAddOneLead}
                  isLoadingMore={isGetMore && showLoadingForActiveTab}
                  loadingMoreCount={getMoreLimit}
                  loadingStage={loadingStage}
                />
              </main>
            ) : (
              <div className="fade-in-0 animate-in py-12 text-center duration-300">
                <p className="text-muted-foreground text-sm">
                  Use the search above to generate leads for this sheet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
