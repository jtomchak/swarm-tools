/**
 * LLM Integration Tests
 *
 * Tests LLM providers with actual API calls.
 * Requires API keys in environment variables.
 *
 * These tests are skipped if API keys are not available.
 */

import { describe, expect, test } from "bun:test";
import { generateText } from "ai";
import { zhipu, zhipuZAI, zhipuCoding, anthropic, getModel } from "../llm/providers";

describe("LLM Integration Tests", () => {
  describe("Anthropic Provider", () => {
    test("can call Anthropic API", async () => {
      const hasKey = !!process.env.ANTHROPIC_API_KEY || !!process.env.AI_GATEWAY_API_KEY;
      if (!hasKey) {
        console.log("Skipping Anthropic test - no API key");
        return;
      }

      const { text } = await generateText({
        model: anthropic("claude-haiku-4-5"),
        prompt: "Say 'hello' in exactly one word",
        maxOutputTokens: 10,
      });

      expect(text).toBeDefined();
      expect(text.toLowerCase()).toContain("hello");
    });
  });

  describe("Zhipu (Z.ai) Provider", () => {
    test("can call Zhipu API", async () => {
      const hasKey = !!process.env.ZHIPU_API_KEY;
      if (!hasKey) {
        console.log("Skipping Zhipu test - no API key");
        return;
      }

      const { text } = await generateText({
        model: zhipu("glm-4-flash"),
        prompt: "Say 'hello' in exactly one word",
        maxOutputTokens: 10,
      });

      expect(text).toBeDefined();
      expect(text.toLowerCase()).toContain("hello");
    });

    test("can call Z.ai international endpoint", async () => {
      const hasKey = !!process.env.ZHIPU_API_KEY;
      if (!hasKey) {
        console.log("Skipping Z.ai test - no API key");
        return;
      }

      const { text } = await generateText({
        model: zhipuZAI("glm-4-flash"),
        prompt: "Say 'hello' in exactly one word",
        maxOutputTokens: 10,
      });

      expect(text).toBeDefined();
      expect(text.toLowerCase()).toContain("hello");
    });

    test("can call Z.ai coding endpoint", async () => {
      const hasKey = !!process.env.ZHIPU_API_KEY;
      if (!hasKey) {
        console.log("Skipping Z.ai coding test - no API key");
        return;
      }

      const { text } = await generateText({
        model: zhipuCoding("glm-4-flash"),
        prompt: "Write a simple 'hello world' in JavaScript",
        maxOutputTokens: 100,
      });

      expect(text).toBeDefined();
      expect(text.toLowerCase()).toContain("hello");
      expect(text.toLowerCase()).toContain("world");
    });

    test("can use Zhipu through getModel() helper", async () => {
      const hasKey = !!process.env.ZHIPU_API_KEY;
      if (!hasKey) {
        console.log("Skipping getModel test - no Zhipu API key");
        return;
      }

      const model = getModel("glm-4.7");
      const { text } = await generateText({
        model,
        prompt: "Say 'hello' in exactly one word",
        maxOutputTokens: 10,
      });

      expect(text).toBeDefined();
      expect(text.toLowerCase()).toContain("hello");
    });

    test("can use Z.ai coding through getModel() helper", async () => {
      const hasKey = !!process.env.ZHIPU_API_KEY;
      if (!hasKey) {
        console.log("Skipping getModel coding test - no Zhipu API key");
        return;
      }

      const model = getModel("zhipu-coding/glm-4.7");
      const { text } = await generateText({
        model,
        prompt: "Write a simple 'hello world' in JavaScript",
        maxOutputTokens: 100,
      });

      expect(text).toBeDefined();
      expect(text.toLowerCase()).toContain("hello");
      expect(text.toLowerCase()).toContain("world");
    });
  });

  describe("OpenAI Provider", () => {
    test("requires @ai-sdk/openai to be installed", async () => {
      expect(() => getModel("openai/gpt-4o")).toThrow(
        "OpenAI provider not available",
      );
    });
  });
});
