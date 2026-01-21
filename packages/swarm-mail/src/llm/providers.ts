/**
 * LLM Provider Configurations
 *
 * Centralized provider setup for Vercel AI SDK v6.
 * Supports Anthropic, Zhipu (Z.ai), and custom providers.
 *
 * @module llm/providers
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import {
  zhipu as zhipuDefault,
  createZhipu as createZhipuProvider,
  type ZhipuProvider,
} from "zhipu-ai-provider";

/**
 * Model type for getModel() return value
 *
 * Using `any` to work around AI SDK version conflicts between
 * different @ai-sdk/* packages. The actual model objects
 * are properly typed when used with generateText() and other
 * AI SDK functions.
 */
type LanguageModelAny = any;

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Zhipu (Z.ai) API Configuration
 *
 * Zhipu provides GLM models via both Chinese (bigmodel.cn) and
 * international (z.ai) endpoints. The community provider supports
 * both with simple configuration.
 *
 * Documentation: https://docs.z.ai/api-reference/introduction
 * Community Provider: https://github.com/Xiang-CH/zhipu-ai-provider
 */
export const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";

/**
 * Anthropic API Configuration
 */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY || "";

/**
 * OpenAI API Configuration (for OpenAI models only)
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// ============================================================================
// Provider Instances
// ============================================================================

/**
 * Anthropic provider instance
 *
 * Models available: claude-sonnet-4-5, claude-haiku-4-5, claude-opus-4-5
 *
 * @example
 * ```typescript
 * import { anthropic, generateText } from "ai";
 *
 * const result = await generateText({
 *   model: anthropic("claude-sonnet-4-5"),
 *   prompt: "Hello"
 * });
 * ```
 */
export const anthropic = createAnthropic({
  apiKey: ANTHROPIC_API_KEY,
});

/**
 * Zhipu (Z.ai) provider instance
 *
 * Uses Chinese endpoint (bigmodel.cn) by default.
 * For international Z.ai infrastructure, use `zhipuZAI` provider below.
 *
 * Models available:
 * - glm-4.7: Latest GLM-4 model
 * - glm-4-plus: Enhanced GLM-4
 * - glm-4-air: Cost-optimized GLM-4
 * - glm-4-flash: Fast GLM-4
 * - glm-3-turbo: Previous generation, fast
 *
 * @example
 * ```typescript
 * import { zhipu, generateText } from "ai";
 *
 * const result = await generateText({
 *   model: zhipu("glm-4.7"),
 *   prompt: "Hello"
 * });
 * ```
 */
export const zhipu = zhipuDefault;

/**
 * Zhipu (Z.ai) international endpoint provider
 *
 * Uses international Z.ai infrastructure (api.z.ai) instead of
 * Chinese bigmodel.cn endpoint.
 *
 * For general API scenarios.
 *
 * @example
 * ```typescript
 * import { zhipuZAI, generateText } from "ai";
 *
 * const result = await generateText({
 *   model: zhipuZAI("glm-4.7"),
 *   prompt: "Hello"
 * });
 * ```
 */
export const zhipuZAI: ZhipuProvider = createZhipuProvider({
  baseURL: "https://api.z.ai/api/paas/v4",
  apiKey: ZHIPU_API_KEY,
});

/**
 * Zhipu (Z.ai) coding endpoint provider
 *
 * Uses dedicated coding endpoint optimized for coding scenarios.
 * The Coding API endpoint is only for coding scenarios and is not
 * applicable to general API scenarios.
 *
 * @example
 * ```typescript
 * import { zhipuCoding, generateText } from "ai";
 *
 * const result = await generateText({
 *   model: zhipuCoding("glm-4.7"),
 *   prompt: "Write a React component"
 * });
 * ```
 */
export const zhipuCoding: ZhipuProvider = createZhipuProvider({
  baseURL: "https://api.z.ai/api/coding/paas/v4",
  apiKey: ZHIPU_API_KEY,
});

/**
 * OpenAI provider instance
 *
 * Models available: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.
 *
 * Note: This requires installing @ai-sdk/openai separately if you need OpenAI models.
 *
 * @example
 * ```typescript
 * import { openai, generateText } from "ai";
 *
 * const result = await generateText({
 *   model: openai("gpt-4o"),
 *   prompt: "Hello"
 * });
 * ```
 *
 * To use OpenAI models, install the provider:
 * ```bash
 * bun add @ai-sdk/openai
 * ```
 *
 * Then import and use:
 * ```typescript
 * import { createOpenAI } from "@ai-sdk/openai";
 * export const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * ```
 */
export const openai = await (async (): Promise<LanguageModelAny | null> => {
  try {
    const { createOpenAI } = await import("@ai-sdk/openai");
    return createOpenAI({ apiKey: OPENAI_API_KEY });
  } catch {
    return null;
  }
})();

// ============================================================================
// Model Constants
// ============================================================================

/**
 * Anthropic model identifiers
 */
export const ANTHROPIC_MODELS = {
  CLAUDE_SONNET_4_5: "claude-sonnet-4-5" as const,
  CLAUDE_HAIKU_4_5: "claude-haiku-4-5" as const,
  CLAUDE_OPUS_4_5: "claude-opus-4-5" as const,
} as const;

/**
 * Zhipu (Z.ai) model identifiers
 */
export const ZHIPU_MODELS = {
  GLM_4_7: "glm-4.7" as const,
  GLM_4_PLUS: "glm-4-plus" as const,
  GLM_4_AIR: "glm-4-air" as const,
  GLM_4_FLASH: "glm-4-flash" as const,
  GLM_3_TURBO: "glm-3-turbo" as const,
} as const;

/**
 * OpenAI model identifiers
 */
export const OPENAI_MODELS = {
  GPT_4O: "gpt-4o" as const,
  GPT_4_TURBO: "gpt-4-turbo" as const,
  GPT_3_5_TURBO: "gpt-3.5-turbo" as const,
} as const;

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Supported model types
 */
export type AnthropicModel = (typeof ANTHROPIC_MODELS)[keyof typeof ANTHROPIC_MODELS];
export type ZhipuModel = (typeof ZHIPU_MODELS)[keyof typeof ZHIPU_MODELS];
export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

const ZHIPU_MODEL_VALUES = new Set(Object.values(ZHIPU_MODELS));

/**
 * All supported models
 */
export type AnyModel = AnthropicModel | ZhipuModel | OpenAIModel;

/**
 * Helper to get a model instance with the correct provider
 *
 * @param modelId - Model identifier (e.g., "anthropic/claude-sonnet-4-5", "glm-4.7", "gpt-4o", "zhipu-coding/glm-4.7")
 * @returns LanguageModel instance for use with AI SDK
 *
 * @example
 * ```typescript
 * import { getModel, generateText } from "ai";
 *
 * // Anthropic model
 * const anthropicModel = getModel("anthropic/claude-sonnet-4-5");
 *
 * // Zhipu model (no prefix needed)
 * const zhipuModel = getModel("glm-4.7");
 *
 * // Zhipu coding model (uses coding endpoint)
 * const zhipuCodingModel = getModel("zhipu-coding/glm-4.7");
 *
 * // OpenAI model (requires @ai-sdk/openai)
 * const openaiModel = getModel("openai/gpt-4o");
 * ```
 */
export function getModel(modelId: string): LanguageModelAny {
  // Zhipu Coding models (uses coding endpoint)
  if (modelId.startsWith("zhipu-coding/")) {
    return zhipuCoding(modelId.replace("zhipu-coding/", ""));
  }

  // Zhipu ZAI models (international endpoint)
  if (modelId.startsWith("zhipu-zai/")) {
    return zhipuZAI(modelId.replace("zhipu-zai/", ""));
  }

  // Zhipu models (no prefix or explicit zhipu/ prefix)
  if (
    modelId.startsWith("zhipu/") ||
    ZHIPU_MODEL_VALUES.has(modelId as ZhipuModel)
  ) {
    const model = modelId.replace("zhipu/", "");
    return zhipu(model);
  }

  // OpenAI models
  if (modelId.startsWith("openai/")) {
    if (!openai) {
      throw new Error(
        "OpenAI provider not available. Install @ai-sdk/openai: bun add @ai-sdk/openai",
      );
    }
    return openai(modelId.replace("openai/", ""));
  }

  // Anthropic models (default)
  if (modelId.startsWith("anthropic/")) {
    return anthropic(modelId.replace("anthropic/", ""));
  }

  // Try Anthropic as default if no prefix
  return anthropic(modelId);
}

/**
 * Helper to check if a model is available
 *
 * @param modelId - Model identifier
 * @returns true if model has API key configured
 */
export function isModelAvailable(modelId: string): boolean {
  // Zhipu Coding
  if (modelId.startsWith("zhipu-coding/")) {
    return !!ZHIPU_API_KEY;
  }

  // Zhipu ZAI
  if (modelId.startsWith("zhipu-zai/")) {
    return !!ZHIPU_API_KEY;
  }

  // Zhipu
  if (
    modelId.startsWith("zhipu/") ||
    ZHIPU_MODEL_VALUES.has(modelId as ZhipuModel)
  ) {
    return !!ZHIPU_API_KEY;
  }

  // OpenAI
  if (modelId.startsWith("openai/")) {
    return !!OPENAI_API_KEY;
  }

  // Anthropic (default)
  return !!ANTHROPIC_API_KEY;
}
