import Link from "next/link";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-zinc-100 lg:flex">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 30% 20%, rgba(99,102,241,0.45) 0%, transparent 60%), radial-gradient(50% 50% at 80% 80%, rgba(16,185,129,0.25) 0%, transparent 60%)",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">{siteConfig.name}</span>
        </Link>
        <div className="relative max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            The execution platform for AI-native teams.
          </h2>
          <p className="text-zinc-400">{siteConfig.description}</p>
        </div>
        <p className="relative text-sm text-zinc-500">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
