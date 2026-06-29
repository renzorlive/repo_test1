"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Inbox, Cpu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// The five founder-critical destinations, reachable in a single tap on mobile.
const items = [
  { title: "Control", href: "/command-center", icon: LayoutDashboard },
  { title: "Missions", href: "/missions", icon: Target },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "AI", href: "/orchestrator", icon: Cpu },
  { title: "Settings", href: "/settings", icon: Settings },
];

/** Fixed bottom tab bar shown only on small screens. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
