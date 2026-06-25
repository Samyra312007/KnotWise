import OpenAI from "openai";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

let cachedClient: OpenAI | null = null;
let warned = false;
let aiCooldownUntil = 0;

function getClient(): OpenAI | null {
  if (Date.now() < aiCooldownUntil) return null;
  const key = process.env.NVIDIA_NIM_API_KEY;
  if (!key || process.env.AI_FORCE_FALLBACK === "true") {
    if (!warned && process.env.NODE_ENV !== "production") {
      console.warn(
        "[ai] NVIDIA_NIM_API_KEY not set — using deterministic fallback for explanations and emails."
      );
      warned = true;
    }
    return null;
  }
  if (cachedClient) return cachedClient;
  cachedClient = new OpenAI({
    apiKey: key,
    baseURL: process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  });
  return cachedClient;
}

const DEFAULT_MODEL = process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.3-70b-instruct";
const RATE_LIMIT_COOLDOWN_MS = 5 * 60_000;

function noteAiFailure(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (process.env.NODE_ENV !== "production") {
    console.warn("[ai] completion failed:", message);
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    aiCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    cachedClient = null;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ai] rate limited — using template fallbacks for 5 minutes.");
    }
  }
}

export async function complete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; retry?: boolean; timeoutMs?: number } = {}
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const timeoutMs = opts.timeoutMs ?? 6_000;
  const shouldRetry = opts.retry === true;

  const attempt = async (): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await client.chat.completions.create(
        {
          model: DEFAULT_MODEL,
          messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? 320,
          stream: false,
        },
        { signal: controller.signal }
      );
      const text = resp.choices[0]?.message?.content?.trim();
      if (!text) return null;
      if (process.env.NODE_ENV !== "production") {
        const usage = resp.usage;
        if (usage) {
          console.log(
            `[ai] tokens: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens}`
          );
        }
      }
      return text;
    } catch (err) {
      noteAiFailure(err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  let out = await attempt();
  if (!out && shouldRetry) out = await attempt();
  return out;
}

export function aiEnabled(): boolean {
  if (Date.now() < aiCooldownUntil) return false;
  if (process.env.AI_FORCE_FALLBACK === "true") return false;
  return !!process.env.NVIDIA_NIM_API_KEY;
}
