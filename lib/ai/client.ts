import OpenAI from "openai";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

let cachedClient: OpenAI | null = null;
let warned = false;

function getClient(): OpenAI | null {
  const key = process.env.NVIDIA_NIM_API_KEY;
  if (!key) {
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

export async function complete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; retry?: boolean; timeoutMs?: number } = {}
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const timeoutMs = opts.timeoutMs ?? 6_000;

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
      if (process.env.NODE_ENV !== "production") {
        console.warn("[ai] completion failed:", (err as Error).message);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  let out = await attempt();
  if (!out && opts.retry !== false) out = await attempt();
  return out;
}

export function aiEnabled(): boolean {
  return !!process.env.NVIDIA_NIM_API_KEY;
}
