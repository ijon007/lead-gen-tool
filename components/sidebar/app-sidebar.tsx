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
import { CommandIcon } from "@phosphor-icons/react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-7 items-center justify-center rounded-lg">
            <CommandIcon className="size-4" />
          </div>
          <span className="truncate">Core Point Leads</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavSheets />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center p-2 group-data-[collapsible=icon]:p-0">
          <UserButton userProfileMode="modal" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
