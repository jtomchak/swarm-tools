/**
 * Swarm Setup Model Options
 *
 * Centralized model options used by swarm setup prompts and quick model updates.
 */

export interface ModelOption {
  value: string;
  label: string;
  hint: string;
}

const ZHIPU_MODELS: ModelOption[] = [
  {
    value: "zai-coding-plan/glm-4.7",
    label: "Z.ai GLM-4.7",
    hint: "Latest GLM model (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.7-flash",
    label: "Z.ai GLM-4.7 Flash",
    hint: "Fast variant of GLM-4.7 (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.6",
    label: "Z.ai GLM-4.6",
    hint: "Balanced capability and cost (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.6v",
    label: "Z.ai GLM-4.6v",
    hint: "GLM-4.6 variant (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.5",
    label: "Z.ai GLM-4.5",
    hint: "Reliable general-purpose model (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.5-air",
    label: "Z.ai GLM-4.5 Air",
    hint: "Cost-optimized GLM-4.5 (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.5-flash",
    label: "Z.ai GLM-4.5 Flash",
    hint: "Fast GLM-4.5 variant (coding plan)",
  },
  {
    value: "zai-coding-plan/glm-4.5v",
    label: "Z.ai GLM-4.5v",
    hint: "GLM-4.5 variant (coding plan)",
  },
];

export const COORDINATOR_MODELS: ModelOption[] = [
  {
    value: "anthropic/claude-opus-4-5",
    label: "Claude Opus 4.5",
    hint: "Most capable, best for complex orchestration (recommended)",
  },
  {
    value: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    hint: "Good balance of speed and capability",
  },
  {
    value: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    hint: "Fast and cost-effective",
  },
  ...ZHIPU_MODELS,
  {
    value: "openai/gpt-4o",
    label: "GPT-4o",
    hint: "Fast, good for most tasks",
  },
  {
    value: "openai/gpt-4-turbo",
    label: "GPT-4 Turbo",
    hint: "Powerful, more expensive",
  },
  {
    value: "google/gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    hint: "Fast and capable",
  },
  {
    value: "google/gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    hint: "More capable, larger context",
  },
];

export const WORKER_MODELS: ModelOption[] = [
  {
    value: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    hint: "Best balance of speed and capability (recommended)",
  },
  {
    value: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    hint: "Fast and cost-effective",
  },
  {
    value: "anthropic/claude-opus-4-5",
    label: "Claude Opus 4.5",
    hint: "Most capable, slower",
  },
  ...ZHIPU_MODELS,
  {
    value: "openai/gpt-4o",
    label: "GPT-4o",
    hint: "Fast, good for most tasks",
  },
  {
    value: "openai/gpt-4-turbo",
    label: "GPT-4 Turbo",
    hint: "Powerful, more expensive",
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    hint: "Fast and cheap",
  },
  {
    value: "google/gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    hint: "Fast and capable",
  },
  {
    value: "google/gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    hint: "More capable",
  },
];

export const LITE_MODELS: ModelOption[] = [
  {
    value: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    hint: "Fast and cost-effective (recommended)",
  },
  {
    value: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    hint: "More capable, slower",
  },
  ...ZHIPU_MODELS,
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    hint: "Fast and cheap",
  },
  {
    value: "google/gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    hint: "Fast and capable",
  },
];
