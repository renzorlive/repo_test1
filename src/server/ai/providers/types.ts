import type { AiCapabilityKind, AiProviderType } from "@/types";
import type { PromptMessage } from "@/server/ai/types";

/**
 * Provider Adapter Interface.
 *
 * This is the ONLY contract the execution engine knows about. Concrete
 * providers (OpenAI, Anthropic, Gemini, Ollama, OpenRouter, local models) will
 * implement `AiProviderAdapter` in a later sprint. Business logic must never
 * import a vendor SDK directly — it goes through this interface.
 */

export interface ProviderExecuteRequest {
  /** Provider model id, e.g. "gpt-4o" / "claude-opus-4-8". */
  model: string;
  messages: PromptMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Opaque routing/metadata (execution id, capability, etc.). */
  metadata?: Record<string, unknown>;
}

export interface ProviderTokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ProviderExecuteResult {
  content: string;
  structured?: unknown;
  finishReason?: string;
  model?: string;
  confidence?: number;
  usage: ProviderTokenUsage;
  raw?: unknown;
}

export interface AiProviderAdapter {
  /** The provider family this adapter serves. */
  readonly type: AiProviderType;
  /** Whether this adapter can satisfy a required capability. */
  supports(capability: AiCapabilityKind): boolean;
  /** Run a single completion. Implemented by future provider packages. */
  execute(request: ProviderExecuteRequest): Promise<ProviderExecuteResult>;
}
