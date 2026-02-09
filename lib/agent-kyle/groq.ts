import { stripMarkdownCodeFence } from "@/lib/agent-kyle/sanitize";
import type { GroqCompletionResult } from "@/lib/agent-kyle/types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.AGENT_KYLE_MODEL || "llama-3.1-8b-instant";
const DEFAULT_TIMEOUT_MS = Number(process.env.AGENT_KYLE_REQUEST_TIMEOUT_MS || 20000);

interface GroqChatResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout)
  };
}

function parseUsage(response: GroqChatResponse) {
  const promptTokens = Number(response.usage?.prompt_tokens || 0);
  const completionTokens = Number(response.usage?.completion_tokens || 0);
  const totalTokens = Number(response.usage?.total_tokens || promptTokens + completionTokens);
  return {
    promptTokens,
    completionTokens,
    totalTokens
  };
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function createGroqJsonCompletion(input: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}): Promise<GroqCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model = input.model || DEFAULT_MODEL;
  const { signal, cleanup } = timeoutSignal(DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: input.systemPrompt
          },
          {
            role: "user",
            content: input.userPrompt
          }
        ]
      }),
      signal,
      cache: "no-store"
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq request failed (${response.status}): ${text.slice(0, 320)}`);
    }

    const payload = (await response.json()) as GroqChatResponse;
    const rawContent = payload.choices?.[0]?.message?.content;
    const content = stripMarkdownCodeFence(rawContent || "");

    if (!content) {
      throw new Error("Groq response did not include message content");
    }

    return {
      model: payload.model || model,
      content,
      usage: parseUsage(payload)
    };
  } finally {
    cleanup();
  }
}

export function estimateTokenCount(input: string): number {
  return Math.max(1, Math.ceil(input.length / 4));
}
