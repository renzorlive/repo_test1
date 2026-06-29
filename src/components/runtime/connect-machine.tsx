"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check, Loader2, MonitorSmartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface RegisterResult {
  token: string;
  host: { id: string; name: string };
}

/**
 * Register a machine and reveal the one-time agent token + connect command.
 * The remote `rnz-agent` uses the token to authenticate every callback.
 */
export function ConnectMachine({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<RegisterResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    hostname: "",
    os: "",
    cpuCores: "8",
    memoryMb: "16384",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await apiClient<RegisterResult>(
        `/api/workspaces/${workspaceId}/runtime/hosts`,
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            hostname: form.hostname || form.name,
            os: form.os || "Unknown",
            cpuCores: Number(form.cpuCores),
            memoryMb: Number(form.memoryMb),
            runtimeType: "CLAUDE_CODE",
          }),
        },
      );
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register machine");
    } finally {
      setPending(false);
    }
  }

  const command = result
    ? `npx @rnz/agent connect --token ${result.token}`
    : "";

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Connect a machine
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Connect a machine</h3>
        </div>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{result.host.name}</span>{" "}
              registered. Run this on the machine to bring it online:
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950 p-3">
              <code className="flex-1 overflow-x-auto font-mono text-xs text-zinc-100 scrollbar-thin">
                {command}
              </code>
              <Button size="icon" variant="ghost" onClick={copy} aria-label="Copy">
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The token authenticates every callback. Keep it secret — it is
              shown only once.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null);
                setOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="Andrei's MacBook Pro" required />
              <Field label="Hostname" value={form.hostname} onChange={(v) => set("hostname", v)} placeholder="andrei-mbp.local" />
              <Field label="OS" value={form.os} onChange={(v) => set("os", v)} placeholder="macOS 15.1" />
              <Field label="CPU cores" value={form.cpuCores} onChange={(v) => set("cpuCores", v)} type="number" />
              <Field label="Memory (MB)" value={form.memoryMb} onChange={(v) => set("memoryMb", v)} type="number" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={pending || form.name.length < 2}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Register machine
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
