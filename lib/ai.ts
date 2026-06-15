// The swappable AI layer. Everything above this file speaks generateText /
// embedTexts; switching providers only changes this module.
//
// Two jobs live here, with different rules:
//   • generation (writing/reasoning) — freely swappable per deployment/user
//   • embeddings + web grounding — the knowledge graph's foundation; must stay
//     on one consistent model so stored vectors remain comparable
// When CEREBRAS_API_KEY is set, generation runs on Cerebras (fast, generous
// free tier) while Gemini quietly keeps doing embeddings and web search — the
// two things Cerebras can't do. See HybridProvider below.

export interface AiProvider {
  generateText(prompt: string, system?: string): Promise<string>;
  generateTextStream(prompt: string, system?: string): AsyncIterable<string>;
  generateWithWebSearch(prompt: string): Promise<string>;
  embedTexts(texts: string[]): Promise<number[][]>;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Each model has its own free-tier quota bucket (per-minute AND per-day), so
// when one is rate-limited or exhausted the next keeps the product alive.
// Embeddings never fall back: stored vectors must all come from one model.
const GENERATION_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMS = 768;

// The free tier intermittently returns 429/503; brief retries absorb blips,
// and persistent limits are handled by falling through to the next model.
const RETRY_WAITS = [2000, 8000];
async function fetchWithRetry(makeRequest: () => Promise<Response>): Promise<Response> {
  let res = await makeRequest();
  for (let attempt = 0; attempt < RETRY_WAITS.length && (res.status === 429 || res.status === 503); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_WAITS[attempt]));
    res = await makeRequest();
  }
  return res;
}

async function fetchAcrossModels(
  models: string[],
  makeRequest: (model: string) => Promise<Response>,
): Promise<Response> {
  let res!: Response;
  for (const model of models) {
    res = await fetchWithRetry(() => makeRequest(model));
    if (res.status !== 429 && res.status !== 503) return res;
  }
  return res;
}

class GeminiProvider implements AiProvider {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    const res = await fetchAcrossModels(GENERATION_MODELS, (model) =>
      fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${this.key}`, {
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
    const res = await fetchAcrossModels(GENERATION_MODELS, (model) =>
      fetch(
        `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${this.key}`,
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

  // Web-grounded generation via Gemini's built-in Google Search tool.
  async generateWithWebSearch(prompt: string): Promise<string> {
    const res = await fetchAcrossModels(GENERATION_MODELS, (model) =>
      fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${this.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }),
    );
    if (!res.ok) {
      throw new Error(`Web search failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const text: string | undefined =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
    if (!text) throw new Error("Web search returned no text");
    return text;
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

// ── Cerebras: generation only (OpenAI-compatible chat completions) ──
// Extremely fast, with a generous free tier. It has no embeddings model and
// no web-search grounding, so it implements only the two generation methods;
// the rest are routed to Gemini by HybridProvider. Falls across its public
// models when one is busy, then HybridProvider falls back to Gemini.
const CEREBRAS_BASE = "https://api.cerebras.ai/v1";
const CEREBRAS_MODELS = ["gpt-oss-120b", "zai-glm-4.7"];

class CerebrasProvider {
  constructor(private key: string) {}

  private chat(model: string, prompt: string, system: string | undefined, stream: boolean) {
    return fetch(`${CEREBRAS_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.key}`,
      },
      body: JSON.stringify({
        model,
        stream,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });
  }

  async generateText(prompt: string, system?: string): Promise<string> {
    const res = await fetchAcrossModels(CEREBRAS_MODELS, (model) =>
      this.chat(model, prompt, system, false),
    );
    if (!res.ok) {
      throw new Error(`Cerebras generation failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const text: string | undefined = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Cerebras generation returned no text");
    return text;
  }

  async *generateTextStream(prompt: string, system?: string): AsyncIterable<string> {
    const res = await fetchAcrossModels(CEREBRAS_MODELS, (model) =>
      this.chat(model, prompt, system, true),
    );
    if (!res.ok || !res.body) {
      throw new Error(`Cerebras generation failed (${res.status}): ${await res.text()}`);
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
        let data: { choices?: { delta?: { content?: string } }[] };
        try {
          data = JSON.parse(payload);
        } catch {
          continue; // keep-alive or partial frame
        }
        const text = data.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  }
}

// Routes the two jobs to the right place: a generation provider writes and
// reasons; the base provider (Gemini) owns embeddings and web grounding — the
// graph's foundation, which must stay consistent regardless of generation
// model. If generation fails before producing output, it falls back to base,
// so a Cerebras outage never takes the product down.
class HybridProvider implements AiProvider {
  constructor(
    private gen: CerebrasProvider,
    private base: AiProvider,
  ) {}

  async generateText(prompt: string, system?: string): Promise<string> {
    try {
      return await this.gen.generateText(prompt, system);
    } catch (e) {
      console.error("generation provider failed, falling back to base:", e);
      return this.base.generateText(prompt, system);
    }
  }

  async *generateTextStream(prompt: string, system?: string): AsyncIterable<string> {
    let started = false;
    try {
      for await (const delta of this.gen.generateTextStream(prompt, system)) {
        started = true;
        yield delta;
      }
      return;
    } catch (e) {
      if (started) throw e; // already streaming — can't cleanly restart
      console.error("generation stream failed pre-output, falling back to base:", e);
    }
    yield* this.base.generateTextStream(prompt, system);
  }

  generateWithWebSearch(prompt: string): Promise<string> {
    return this.base.generateWithWebSearch(prompt);
  }

  embedTexts(texts: string[]): Promise<number[][]> {
    return this.base.embedTexts(texts);
  }
}

let provider: AiProvider | null = null;

export function ai(): AiProvider {
  if (!provider) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    const gemini = new GeminiProvider(key);
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    // One-line marker so logs show which engine is live (generation can be
    // swapped; embeddings + web always stay on Gemini — the graph's foundation).
    console.log(
      `[ai] generation: ${cerebrasKey ? "cerebras (gpt-oss-120b -> zai-glm-4.7)" : "gemini"}; embeddings+web: gemini`,
    );
    provider = cerebrasKey
      ? new HybridProvider(new CerebrasProvider(cerebrasKey), gemini)
      : gemini;
  }
  return provider;
}

// A provider bound to a specific key — used for workspaces that bring
// their own. Falls back to the shared provider when no key is given.
export function aiWithKey(key?: string | null): AiProvider {
  if (!key) return ai();
  return new GeminiProvider(key);
}
