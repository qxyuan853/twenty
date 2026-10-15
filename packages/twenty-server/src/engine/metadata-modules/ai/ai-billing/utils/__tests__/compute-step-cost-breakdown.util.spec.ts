import { computeStepCostBreakdown } from 'src/engine/metadata-modules/ai/ai-billing/utils/compute-step-cost-breakdown.util';
import { type AiModelCostConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-model-cost-config.type';

const MODEL_COST_CONFIG: AiModelCostConfig = {
  modelId: 'test-model',
  inputCostPerMillionTokens: 1,
  outputCostPerMillionTokens: 2,
  cachedInputCostPerMillionTokens: 0.5,
  cacheCreationCostPerMillionTokens: 3,
  longContextCost: {
    inputCostPerMillionTokens: 10,
    outputCostPerMillionTokens: 20,
    cacheCreationCostPerMillionTokens: 30,
    thresholdTokens: 200_000,
  },
};

describe('computeStepCostBreakdown', () => {
  it('applies the long-context rate only when the step itself crosses the threshold', () => {
    const stepUnderThreshold = computeStepCostBreakdown(MODEL_COST_CONFIG, {
      usage: { inputTokens: 150_000, outputTokens: 1_000 },
    });
    const stepOverThreshold = computeStepCostBreakdown(MODEL_COST_CONFIG, {
      usage: { inputTokens: 300_000, outputTokens: 2_000 },
    });

    expect(2 * stepUnderThreshold.totalCostInDollars).toBeCloseTo(0.304);
    expect(stepOverThreshold.totalCostInDollars).toBeCloseTo(3.04);
  });

  it('reads cache reads and reasoning tokens from the usage details', () => {
    const breakdown = computeStepCostBreakdown(MODEL_COST_CONFIG, {
      usage: {
        inputTokens: 100_000,
        outputTokens: 10_000,
        inputTokenDetails: { cacheReadTokens: 40_000 },
        outputTokenDetails: { reasoningTokens: 4_000 },
      },
    });

    expect(breakdown.inputCostInDollars).toBeCloseTo(0.08);
    expect(breakdown.outputCostInDollars).toBeCloseTo(0.02);
    expect(breakdown.tokenCounts).toMatchObject({
      adjustedInputTokens: 60_000,
      cachedInputTokens: 40_000,
      reasoningTokens: 4_000,
    });
  });

  it('prices cache creation tokens at the cache creation rate', () => {
    const breakdown = computeStepCostBreakdown(MODEL_COST_CONFIG, {
      usage: { inputTokens: 100_000, outputTokens: 0 },
      cacheCreationTokens: 100_000,
    });

    expect(breakdown.totalCostInDollars).toBeCloseTo(0.3);
    expect(breakdown.tokenCounts.adjustedInputTokens).toBe(0);
  });

  it('prices cache writes reported in the usage details at the cache creation rate', () => {
    // OpenAI GPT-5.6+ (cache_write_tokens) and @ai-sdk/anthropic v4
    // (cache_creation_input_tokens) report writes only in the usage details
    const breakdown = computeStepCostBreakdown(MODEL_COST_CONFIG, {
      usage: {
        inputTokens: 100_000,
        outputTokens: 0,
        inputTokenDetails: {
          cacheReadTokens: 10_000,
          cacheWriteTokens: 90_000,
        },
      },
    });

    expect(breakdown.totalCostInDollars).toBeCloseTo(0.275);
    expect(breakdown.tokenCounts).toMatchObject({
      adjustedInputTokens: 0,
      cachedInputTokens: 10_000,
      cacheCreationTokens: 90_000,
    });
  });

  it('does not count cache writes twice when usage and provider metadata both report them', () => {
    const breakdown = computeStepCostBreakdown(MODEL_COST_CONFIG, {
      usage: {
        inputTokens: 100_000,
        outputTokens: 0,
        inputTokenDetails: { cacheWriteTokens: 60_000 },
      },
      cacheCreationTokens: 60_000,
    });

    expect(breakdown.totalCostInDollars).toBeCloseTo(0.22);
    expect(breakdown.tokenCounts.adjustedInputTokens).toBe(40_000);
  });

  it('costs nothing for a step without usage', () => {
    expect(
      computeStepCostBreakdown(MODEL_COST_CONFIG, {}).totalCostInDollars,
    ).toBe(0);
  });
});
