"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
import { NavSheets } from "@/components/sidebar/nav-sheets";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 font-semibold text-sidebar-foreground">
          <span className="truncate">Lead Gen</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavSheets />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center p-2">
          <UserButton userProfileMode="modal" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
