import { type StepResult, type ToolSet } from 'ai';

import { countNativeWebSearchCallsFromSteps } from 'src/engine/metadata-modules/ai/ai-billing/utils/count-native-web-search-calls-from-steps.util';

const buildStep = (toolNames: string[]): StepResult<ToolSet> =>
  ({
    toolCalls: toolNames.map((toolName, index) => ({
      type: 'tool-call',
      toolCallId: `call-${index}`,
      toolName,
      input: {},
      providerExecuted: true,
    })),
  }) as unknown as StepResult<ToolSet>;

describe('countNativeWebSearchCallsFromSteps', () => {
  it('counts the web_search calls of every step', () => {
    expect(
      countNativeWebSearchCallsFromSteps([
        buildStep(['web_search', 'web_search']),
        buildStep(['web_search']),
      ]),
    ).toBe(3);
  });

  it('counts the xAI x_search calls a Grok turn runs', () => {
    expect(
      countNativeWebSearchCallsFromSteps([
        buildStep(['x_search', 'x_search', 'web_search']),
        buildStep(['x_search']),
      ]),
    ).toBe(4);
  });

  it('ignores tools Twenty executes itself', () => {
    expect(
      countNativeWebSearchCallsFromSteps([
        buildStep([
          'find_companies',
          'learn_tools',
          'execute_tool',
          'app_exa_web_search',
        ]),
      ]),
    ).toBe(0);
  });
});
