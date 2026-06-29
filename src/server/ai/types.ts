/**
 * Provider-agnostic types for the AI Orchestrator.
 *
 * Nothing here references a vendor SDK. The Context Builder, Prompt Builder and
 * Execution Engine speak only these shapes; concrete providers implement the
 * adapter interface (see `providers/types.ts`) against them.
 */

/** A single assembled context section (one logical block of grounding). */
export interface ContextSection {
  key: string;
  title: string;
  content: string;
  tokensEstimated: number;
}

/** The structured context package returned by the Context Builder. */
export interface ContextPackage {
  workspace: { id: string; name: string };
  project?: { id: string; key: string; name: string } | null;
  mission?: { id: string; title: string; status: string } | null;
  sections: ContextSection[];
  totalTokensEstimated: number;
  generatedAt: string;
}

/** A provider-agnostic chat message. */
export interface PromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** The versioned prompt package produced by the Prompt Builder. */
export interface PromptPackage {
  version: number;
  systemInstructions: string;
  userRequest: string;
  constraints: string[];
  outputFormat?: string;
  messages: PromptMessage[];
  contextPackage: ContextPackage;
  tokensEstimated: number;
  hash: string;
}
