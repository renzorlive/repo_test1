import { createHash } from "node:crypto";
import { estimateTokens } from "@/server/ai/tokens";
import type {
  ContextPackage,
  PromptMessage,
  PromptPackage,
} from "@/server/ai/types";

const DEFAULT_SYSTEM = [
  "You are an AI worker operating inside RNZ OS, an AI execution platform.",
  "Ground every response strictly in the provided mission context.",
  "Be precise, cite the relevant context, and respect all stated constraints.",
].join(" ");

export interface PromptBuildInput {
  version: number;
  systemInstructions?: string;
  userRequest: string;
  constraints?: string[];
  outputFormat?: string;
  context: ContextPackage;
}

function renderContext(context: ContextPackage): string {
  if (context.sections.length === 0) return "No additional context.";
  return context.sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n");
}

/**
 * The Prompt Builder. Generates a versioned, provider-agnostic prompt from
 * system instructions, mission context, the user request, constraints and the
 * desired output format. The content hash makes runs reproducible and lets the
 * platform deduplicate identical prompts. NO provider-specific logic here.
 */
export const promptBuilder = {
  build(input: PromptBuildInput): PromptPackage {
    const systemInstructions = [DEFAULT_SYSTEM, input.systemInstructions]
      .filter(Boolean)
      .join("\n\n");

    const constraints = input.constraints ?? [];

    const systemContent = [
      systemInstructions,
      "# Context",
      renderContext(input.context),
    ].join("\n\n");

    const userContent = [
      "# Request",
      input.userRequest,
      constraints.length
        ? `# Constraints\n${constraints.map((c) => `- ${c}`).join("\n")}`
        : "",
      input.outputFormat ? `# Output format\n${input.outputFormat}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const messages: PromptMessage[] = [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ];

    const tokensEstimated = messages.reduce(
      (sum, m) => sum + estimateTokens(m.content),
      0,
    );

    const hash = createHash("sha256")
      .update(JSON.stringify(messages))
      .digest("hex")
      .slice(0, 32);

    return {
      version: input.version,
      systemInstructions,
      userRequest: input.userRequest,
      constraints,
      outputFormat: input.outputFormat,
      messages,
      contextPackage: input.context,
      tokensEstimated,
      hash,
    };
  },
};
