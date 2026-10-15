import { extractCacheCreationTokensFromSteps } from 'src/engine/metadata-modules/ai/ai-billing/utils/extract-cache-creation-tokens.util';

describe('extractCacheCreationTokensFromSteps', () => {
  it('sums cache writes reported in the usage details', () => {
    expect(
      extractCacheCreationTokensFromSteps([
        { usage: { inputTokenDetails: { cacheWriteTokens: 600 } } },
        { usage: { inputTokenDetails: { cacheWriteTokens: 400 } } },
      ]),
    ).toBe(1_000);
  });

  it('reads Bedrock cache writes from provider metadata', () => {
    expect(
      extractCacheCreationTokensFromSteps([
        {
          providerMetadata: {
            bedrock: { usage: { cacheWriteInputTokens: 250 } },
          },
        },
      ]),
    ).toBe(250);
  });

  it('counts a step once when usage and provider metadata both report it', () => {
    expect(
      extractCacheCreationTokensFromSteps([
        {
          usage: { inputTokenDetails: { cacheWriteTokens: 250 } },
          providerMetadata: {
            bedrock: { usage: { cacheWriteInputTokens: 250 } },
          },
        },
      ]),
    ).toBe(250);
  });

  it('is zero for steps that report no cache writes', () => {
    expect(extractCacheCreationTokensFromSteps([{}, { usage: {} }])).toBe(0);
  });
});
