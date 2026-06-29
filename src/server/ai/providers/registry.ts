import type { AiProviderType } from "@/types";
import type { AiProviderAdapter } from "./types";

/**
 * Provider Adapter Registry.
 *
 * A process-wide map of provider type → adapter. It is intentionally EMPTY:
 * no provider is implemented yet (by design). Future provider packages call
 * `registerProviderAdapter(adapter)` at startup; the execution engine then
 * resolves an adapter at dispatch time. When none is registered the engine
 * gracefully dispatches the execution to an external worker instead of failing.
 */
const adapters = new Map<AiProviderType, AiProviderAdapter>();

export function registerProviderAdapter(adapter: AiProviderAdapter): void {
  adapters.set(adapter.type, adapter);
}

export function getProviderAdapter(
  type: AiProviderType,
): AiProviderAdapter | undefined {
  return adapters.get(type);
}

export function hasProviderAdapter(type: AiProviderType): boolean {
  return adapters.has(type);
}

export function listProviderAdapters(): AiProviderType[] {
  return [...adapters.keys()];
}
