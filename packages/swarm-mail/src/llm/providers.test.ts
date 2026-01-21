/**
 * LLM Providers Tests
 *
 * Tests for centralized LLM provider setup.
 */

import { describe, expect, test } from "bun:test";
import {
  anthropic,
  zhipu,
  zhipuZAI,
  zhipuCoding,
  openai,
  getModel,
  isModelAvailable,
  ANTHROPIC_MODELS,
  ZHIPU_MODELS,
  OPENAI_MODELS,
} from "../llm/providers";

describe("LLM Providers", () => {
  describe("Provider Instances", () => {
    test("Anthropic provider is defined", () => {
      expect(anthropic).toBeDefined();
      expect(typeof anthropic).toBe("function");
    });

    test("Zhipu provider is defined", () => {
      expect(zhipu).toBeDefined();
      expect(typeof zhipu).toBe("function");
    });

    test("Zhipu ZAI provider is defined", () => {
      expect(zhipuZAI).toBeDefined();
      expect(typeof zhipuZAI).toBe("function");
    });

    test("Zhipu Coding provider is defined", () => {
      expect(zhipuCoding).toBeDefined();
      expect(typeof zhipuCoding).toBe("function");
    });

    test("OpenAI provider loads when dependency is installed", async () => {
      let openaiAvailable = false;
      try {
        await import("@ai-sdk/openai");
        openaiAvailable = true;
      } catch {
        // OpenAI provider is optional
      }

      if (!openaiAvailable) {
        return;
      }

      expect(openai).toBeDefined();
      expect(typeof openai).toBe("function");
    });
  });

  describe("Model Constants", () => {
    test("Anthropic model constants are defined", () => {
      expect(ANTHROPIC_MODELS.CLAUDE_SONNET_4_5).toBe("claude-sonnet-4-5");
      expect(ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5).toBe("claude-haiku-4-5");
      expect(ANTHROPIC_MODELS.CLAUDE_OPUS_4_5).toBe("claude-opus-4-5");
    });

    test("Zhipu model constants are defined", () => {
      expect(ZHIPU_MODELS.GLM_4_7).toBe("glm-4.7");
      expect(ZHIPU_MODELS.GLM_4_PLUS).toBe("glm-4-plus");
      expect(ZHIPU_MODELS.GLM_4_AIR).toBe("glm-4-air");
      expect(ZHIPU_MODELS.GLM_4_FLASH).toBe("glm-4-flash");
      expect(ZHIPU_MODELS.GLM_3_TURBO).toBe("glm-3-turbo");
    });

    test("OpenAI model constants are defined", () => {
      expect(OPENAI_MODELS.GPT_4O).toBe("gpt-4o");
      expect(OPENAI_MODELS.GPT_4_TURBO).toBe("gpt-4-turbo");
      expect(OPENAI_MODELS.GPT_3_5_TURBO).toBe("gpt-3.5-turbo");
    });
  });

  describe("getModel() helper", () => {
    test("returns Anthropic model with prefix", () => {
      const model = getModel("anthropic/claude-sonnet-4-5");
      expect(model).toBeDefined();
    });

    test("returns Anthropic model without prefix (default)", () => {
      const model = getModel("claude-sonnet-4-5");
      expect(model).toBeDefined();
    });

    test("returns Zhipu model with zhipu/ prefix", () => {
      const model = getModel("zhipu/glm-4.7");
      expect(model).toBeDefined();
    });

    test("returns Zhipu model without prefix", () => {
      const model = getModel("glm-4.7");
      expect(model).toBeDefined();
    });

    test("routes unprefixed Zhipu models to Zhipu provider", () => {
      const model = getModel("glm-4.7") as {
        config?: {
          provider?: string;
        };
      };

      expect(model.config?.provider).toBe("zhipu.chat");
    });

    test("returns Zhipu ZAI model with zhipu-zai/ prefix", () => {
      const model = getModel("zhipu-zai/glm-4.7");
      expect(model).toBeDefined();
    });

    test("returns Zhipu coding model with zhipu-coding/ prefix", () => {
      const model = getModel("zhipu-coding/glm-4.7");
      expect(model).toBeDefined();
    });

    test("OpenAI availability matches installed provider", async () => {
      let openaiAvailable = false;
      try {
        await import("@ai-sdk/openai");
        openaiAvailable = true;
      } catch {
        // OpenAI provider is optional
      }

      if (!openaiAvailable) {
        expect(() => getModel("openai/gpt-4o")).toThrow(
          "OpenAI provider not available",
        );
        return;
      }

      const model = getModel("openai/gpt-4o");
      expect(model).toBeDefined();
    });
  });

  describe("isModelAvailable() helper", () => {
    test("checks Anthropic model availability", () => {
      // This depends on environment, just check function works
      expect(() => isModelAvailable("anthropic/claude-sonnet-4-5")).not.toThrow();
    });

    test("checks Zhipu model availability", () => {
      expect(() => isModelAvailable("zhipu/glm-4.7")).not.toThrow();
      expect(() => isModelAvailable("glm-4.7")).not.toThrow();
    });

    test("checks Zhipu ZAI model availability", () => {
      expect(() => isModelAvailable("zhipu-zai/glm-4.7")).not.toThrow();
    });

    test("checks Zhipu coding model availability", () => {
      expect(() => isModelAvailable("zhipu-coding/glm-4.7")).not.toThrow();
    });

    test("checks OpenAI model availability", () => {
      expect(() => isModelAvailable("openai/gpt-4o")).not.toThrow();
    });
  });
});
