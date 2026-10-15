import { type AiSdkPackage } from 'twenty-shared/ai';
import { isDefined } from 'twenty-shared/utils';

import { NATIVE_MODEL_TOOLS_BY_SDK_PACKAGE } from 'src/engine/metadata-modules/ai/ai-models/constants/native-model-tools-by-sdk-package.const';
import { type NativeModelTools } from 'src/engine/metadata-modules/ai/ai-models/types/native-model-tools.type';

const NATIVE_MODEL_TOOLS: Record<AiSdkPackage, NativeModelTools> =
  NATIVE_MODEL_TOOLS_BY_SDK_PACKAGE;

// every provider-executed search tool is billed per call, not only web_search
const NATIVE_SEARCH_TOOL_NAMES = new Set<string>(
  Object.values(NATIVE_MODEL_TOOLS).flatMap((nativeTools) =>
    Object.values(nativeTools)
      .filter(isDefined)
      .map((nativeTool) => nativeTool.directToolName),
  ),
);

export const countNativeWebSearchCallsFromSteps = (
  steps: { toolCalls: { toolName: string }[] }[],
): number =>
  steps.reduce(
    (count, step) =>
      count +
      step.toolCalls.filter((toolCall) =>
        NATIVE_SEARCH_TOOL_NAMES.has(toolCall.toolName),
      ).length,
    0,
  );
