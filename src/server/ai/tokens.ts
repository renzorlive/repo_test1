/**
 * Rough, provider-neutral token estimation.
 *
 * Real token counts depend on each provider's tokenizer; until adapters are
 * implemented we approximate with the common ~4-characters-per-token heuristic.
 * Centralized so the estimate can be swapped for a real tokenizer in one place.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/** Estimate cost in the model's currency from token counts + per-1k pricing. */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  inputCostPer1k: number,
  outputCostPer1k: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1000) * inputCostPer1k;
  const outputCost = (outputTokens / 1000) * outputCostPer1k;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}
