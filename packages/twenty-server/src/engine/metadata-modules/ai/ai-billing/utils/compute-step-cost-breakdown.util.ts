import { type BillingTokenUsage } from 'src/engine/metadata-modules/ai/ai-billing/types/billing-token-usage.type';
import {
  computeCostBreakdown,
  type CostBreakdown,
} from 'src/engine/metadata-modules/ai/ai-billing/utils/compute-cost-breakdown.util';
import { type AiModelCostConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-model-cost-config.type';

// AI SDK v7 reports cache writes in usage for every provider and Bedrock also
// puts them in provider metadata, so take the larger to avoid counting twice
export const computeStepCostBreakdown = (
  model: AiModelCostConfig,
  {
    usage,
    cacheCreationTokens = 0,
  }: { usage?: BillingTokenUsage; cacheCreationTokens?: number },
): CostBreakdown =>
  computeCostBreakdown(model, {
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
    reasoningTokens: usage?.outputTokenDetails?.reasoningTokens,
    cachedInputTokens: usage?.inputTokenDetails?.cacheReadTokens,
    cacheCreationTokens: Math.max(
      cacheCreationTokens,
      usage?.inputTokenDetails?.cacheWriteTokens ?? 0,
    ),
  });
