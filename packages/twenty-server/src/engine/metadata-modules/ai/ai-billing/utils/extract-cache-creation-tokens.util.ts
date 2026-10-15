type ProviderMetadataLike = Record<string, Record<string, unknown> | undefined>;

type CacheCreationStep = {
  usage?: { inputTokenDetails?: { cacheWriteTokens?: number } };
  providerMetadata?: ProviderMetadataLike;
};

// AI SDK v7 reports writes in usage.inputTokenDetails.cacheWriteTokens;
// Bedrock also nests them in provider metadata, so take the larger per step
export const extractCacheCreationTokensFromSteps = (
  steps: CacheCreationStep[],
): number => {
  return steps.reduce((sum, step) => {
    return (
      sum +
      Math.max(
        extractCacheCreationTokens(step.providerMetadata),
        step.usage?.inputTokenDetails?.cacheWriteTokens ?? 0,
      )
    );
  }, 0);
};

export const extractCacheCreationTokens = (
  providerMetadata: ProviderMetadataLike | undefined,
): number => {
  const anthropicMeta = providerMetadata?.anthropic as
    | Record<string, unknown>
    | undefined;
  const bedrockUsage = (providerMetadata?.bedrock as Record<string, unknown>)
    ?.usage as Record<string, unknown> | undefined;

  return (
    (anthropicMeta?.cacheCreationInputTokens as number | undefined) ??
    (bedrockUsage?.cacheWriteInputTokens as number | undefined) ??
    0
  );
};
