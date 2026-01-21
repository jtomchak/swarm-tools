---
"swarm-mail": minor
---

## Added Zhipu (Z.ai) LLM Provider Support

Integrated the official `zhipu-ai-provider` community provider for Vercel AI SDK v6, enabling use of GLM models from Z.ai.

### What Changed

- **Added Zhipu provider**: Using `zhipu-ai-provider` community package
- **Three provider instances**: 
  - `zhipu`: Chinese endpoint (bigmodel.cn)
  - `zhipuZAI`: International endpoint (api.z.ai)
  - `zhipuCoding`: Dedicated coding endpoint for GLM Coding Plan
- **Unified API**: `getModel()` helper for automatic provider selection
- **Model constants**: `ZHIPU_MODELS` for all GLM models
- **Documentation**: Updated AGENTS.md with Zhipu provider usage

### Why It Matters

Z.ai (Zhipu) provides cost-competitive GLM models with dedicated coding endpoints. The community provider integrates seamlessly with Vercel AI SDK, using the same patterns as Anthropic and OpenAI providers.

### Usage Example

```typescript
import { zhipu, zhipuZAI, zhipuCoding, generateText, getModel } from "swarm-mail";

// Chinese endpoint
await generateText({ model: zhipu("glm-4.7"), prompt: "Hello" });

// International endpoint
await generateText({ model: zhipuZAI("glm-4.7"), prompt: "Hello" });

// Coding endpoint
await generateText({ model: zhipuCoding("glm-4.7"), prompt: "Write code" });

// Auto-detection via helper
const model = getModel("glm-4.7");
await generateText({ model, prompt: "Hello" });
```

### Environment Variables

- `ZHIPU_API_KEY`: Required for Zhipu/Z.ai access
- Other providers continue to use existing keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)

### Testing

- All provider tests pass (19 pass, 0 fail)
- Typecheck passes
- Build succeeds

