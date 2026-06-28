import Link from "next/link";
import { Sparkles } from "lucide-react";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarNav } from "./sidebar-nav";
import { siteConfig } from "@/config/site";

/**
 * Desktop sidebar. On small screens it is hidden and surfaced via the
 * mobile sheet in the top navigation.
 */
export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <Link href="/command-center" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-[18px] w-[18px]" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <WorkspaceSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        <SidebarNav />
      </div>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground">
          {siteConfig.name} · v0.1.0
        </p>
      </div>
    </aside>
  );
}
