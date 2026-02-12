"use client";

import * as React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
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
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const footerRef = React.useRef<HTMLDivElement>(null);

  const handleFooterClick = (e: React.MouseEvent) => {
    const button = footerRef.current?.querySelector("button");
    if (button && !(e.target as HTMLElement).closest("button")) {
      button.click();
    }
  };

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
        <div
          ref={footerRef}
          role="button"
          tabIndex={0}
          onClick={handleFooterClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              footerRef.current?.querySelector("button")?.click();
            }
          }}
          className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
        >
          <UserButton userProfileMode="modal" />
          <span className="truncate text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {email}
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
