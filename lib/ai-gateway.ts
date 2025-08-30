import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"

const VERCEL_AI_GATEWAY_KEY = "vck_3RIzfRn16bJXCGuERO3sESjv3HvSi2JkhdDgptAfcbGeNNcomv2xTJQy"
const VERCEL_AI_GATEWAY_URL = "https://gateway.ai.vercel.app"

export const aiModels = {
  // OpenAI models with function calling support
  "gpt-4o": openai("gpt-4o", {
    baseURL: `${VERCEL_AI_GATEWAY_URL}/openai/v1`,
    apiKey: VERCEL_AI_GATEWAY_KEY,
  }),
  "gpt-4o-mini": openai("gpt-4o-mini", {
    baseURL: `${VERCEL_AI_GATEWAY_URL}/openai/v1`,
    apiKey: VERCEL_AI_GATEWAY_KEY,
  }),

  // Anthropic models with function calling support - using compatible version
  "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-20240620", {
    baseURL: `${VERCEL_AI_GATEWAY_URL}/anthropic/v1`,
    apiKey: VERCEL_AI_GATEWAY_KEY,
  }),

  // Google models with function calling support - using stable version
  "gemini-1.5-pro": google("gemini-1.5-pro", {
    baseURL: `${VERCEL_AI_GATEWAY_URL}/google/v1`,
    apiKey: VERCEL_AI_GATEWAY_KEY,
  }),
}

export type AIModelKey = keyof typeof aiModels

export const defaultModel: AIModelKey = "gpt-4o"

export const modelCapabilities = {
  "gpt-4o": {
    functionCalling: true,
    maxTokens: 4096,
    description: "Most capable OpenAI model with excellent function calling",
  },
  "gpt-4o-mini": {
    functionCalling: true,
    maxTokens: 4096,
    description: "Fast and efficient OpenAI model with function calling",
  },
  "claude-3-5-sonnet": {
    functionCalling: true,
    maxTokens: 4096,
    description: "Anthropic's most capable model with excellent reasoning",
  },
  "gemini-1.5-pro": {
    functionCalling: true,
    maxTokens: 8192,
    description: "Google's capable model with built-in tool use",
  },
}
