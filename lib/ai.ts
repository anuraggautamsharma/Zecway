// The swappable AI layer. Everything above this file speaks generateText /
// embedTexts; switching providers (Gemini → Claude) only changes this module.

export interface AiProvider {
  generateText(prompt: string, system?: string): Promise<string>;
  generateTextStream(prompt: string, system?: string): AsyncIterable<string>;
  embedTexts(texts: string[]): Promise<number[][]>;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GENERATION_MODEL = "gemini-2.5-flash";
const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMS = 768;

// The free tier intermittently returns 429/503 ("model overloaded") for a
// second or two; retrying absorbs those instead of failing the user's request.
async function fetchWithRetry(makeRequest: () => Promise<Response>): Promise<Response> {
  let res = await makeRequest();
  for (let attempt = 1; attempt <= 2 && (res.status === 429 || res.status === 503); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    res = await makeRequest();
  }
  return res;
}

class GeminiProvider implements AiProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    const res = await fetchWithRetry(() =>
      fetch(`${GEMINI_BASE}/models/${GENERATION_MODEL}:generateContent?key=${this.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(system
            ? { systemInstruction: { parts: [{ text: system }] } }
            : {}),
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }),
    );
    if (!res.ok) {
      throw new Error(`AI generation failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const text: string | undefined =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
    if (!text) throw new Error("AI generation returned no text");
    return text;
  }

  // Same generation, but yielded as deltas while the model writes.
  async *generateTextStream(prompt: string, system?: string): AsyncIterable<string> {
    const res = await fetchWithRetry(() =>
      fetch(
        `${GEMINI_BASE}/models/${GENERATION_MODEL}:streamGenerateContent?alt=sse&key=${this.key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(system
              ? { systemInstruction: { parts: [{ text: system }] } }
              : {}),
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      ),
    );
    if (!res.ok || !res.body) {
      throw new Error(`AI generation failed (${res.status}): ${await res.text()}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let data: {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        try {
          data = JSON.parse(payload);
        } catch {
          continue; // keep-alive or partial frame
        }
        const text = data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("");
        if (text) yield text;
      }
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const res = await fetchWithRetry(() =>
      fetch(`${GEMINI_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${this.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMS,
          })),
        }),
      }),
    );
    if (!res.ok) {
      throw new Error(`Embedding failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return data.embeddings.map((e: { values: number[] }) => e.values);
  }
}

let provider: AiProvider | null = null;

export function ai(): AiProvider {
  if (!provider) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    provider = new GeminiProvider(key);
  }
  return provider;
}

// A provider bound to a specific key — used for workspaces that bring
// their own. Falls back to the shared provider when no key is given.
export function aiWithKey(key?: string | null): AiProvider {
  if (!key) return ai();
  return new GeminiProvider(key);
}
