"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "@phosphor-icons/react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const options = [
  { value: "system" as const, icon: Monitor, label: "System" },
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
] as const;

const ORDER: (typeof options)[number]["value"][] = ["system", "light", "dark"];

function getNextTheme(current: (typeof ORDER)[number]) {
  const i = ORDER.indexOf(current);
  return ORDER[(i + 1) % ORDER.length];
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = (theme ?? "system") as (typeof ORDER)[number];
  const isCollapsed = state === "collapsed";
  const currentOption = options.find((o) => o.value === current) ?? options[0];
  const CurrentIcon = currentOption.icon;

  const handleClick = () => {
    if (isCollapsed) setTheme(getNextTheme(current));
  };

  if (isCollapsed) {
    return (
      <div className="flex w-full justify-center px-0 py-1.5">
        <button
          type="button"
          onClick={handleClick}
          title={`${currentOption.label} (click to cycle)`}
          aria-label={`Theme: ${currentOption.label}. Click to cycle.`}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
            "text-sidebar-foreground hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer",
            "border border-border bg-sidebar-accent/50"
          )}
        >
          <CurrentIcon className="size-3" weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 py-1.5">
      <span className="truncate text-xs font-medium text-sidebar-foreground">
        Theme
      </span>
      <div
        className="flex items-center rounded-full border border-border bg-sidebar-accent/50 p-0.5"
        role="radiogroup"
        aria-label="Theme"
      >
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            aria-checked={current === value}
            role="radio"
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer",
              current === value &&
                "bg-background text-sidebar-foreground shadow-sm ring-1 ring-border"
            )}
          >
            <Icon className="size-3" weight="bold" />
          </button>
        ))}
      </div>
    </div>
  );
}
