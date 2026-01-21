/**
 * Setup Model Options Tests
 *
 * Ensures swarm setup exposes Z.ai GLM models for coordinator, worker, and lite.
 */
import { describe, test, expect } from "bun:test";
import {
  COORDINATOR_MODELS,
  WORKER_MODELS,
  LITE_MODELS,
} from "./setup-models";

const ZHIPU_GLM_MODELS = [
  "zai-coding-plan/glm-4.5",
  "zai-coding-plan/glm-4.5-air",
  "zai-coding-plan/glm-4.5-flash",
  "zai-coding-plan/glm-4.5v",
  "zai-coding-plan/glm-4.6",
  "zai-coding-plan/glm-4.6v",
  "zai-coding-plan/glm-4.7",
  "zai-coding-plan/glm-4.7-flash",
];

describe("swarm setup model options", () => {
  test("coordinator models include Z.ai coding plan GLM options", () => {
    const values = COORDINATOR_MODELS.map((option) => option.value);
    for (const model of ZHIPU_GLM_MODELS) {
      expect(values).toContain(model);
    }
  });

  test("worker models include Z.ai coding plan GLM options", () => {
    const values = WORKER_MODELS.map((option) => option.value);
    for (const model of ZHIPU_GLM_MODELS) {
      expect(values).toContain(model);
    }
  });

  test("lite models include Z.ai coding plan GLM options", () => {
    const values = LITE_MODELS.map((option) => option.value);
    for (const model of ZHIPU_GLM_MODELS) {
      expect(values).toContain(model);
    }
  });
});
