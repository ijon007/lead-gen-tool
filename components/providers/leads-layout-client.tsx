"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { LeadsProvider } from "@/components/providers/leads-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function LeadsLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>
        <LeadsProvider>
          <SidebarProvider className="h-svh overflow-hidden">
            <AppSidebar />
            <SidebarInset className="min-h-0 min-w-0 border overflow-hidden">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden pt-0">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </LeadsProvider>
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Please sign in to access leads.</p>
        </div>
      </Unauthenticated>
    </>
  );
}
