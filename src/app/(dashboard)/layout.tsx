import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

/**
 * Authenticated application shell: persistent sidebar (desktop) + sticky top
 * nav + bottom tab bar (mobile). The middleware guarantees the user is signed
 * in. The content region adds bottom padding on mobile so it clears the tab bar.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-7xl space-y-8 p-4 pb-24 lg:p-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
