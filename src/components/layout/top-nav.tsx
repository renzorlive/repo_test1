"use client";

import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";

/**
 * Sticky top navigation. Hosts global search (command palette entry point),
 * notifications, theme toggle and the user menu.
 */
export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search missions, projects, agents…"
          className="pl-9"
          aria-label="Search"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <ThemeToggle />
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
