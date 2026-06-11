import { NextResponse } from "next/server";
import { workspaceAi, KEY_REJECTED } from "@/lib/workspace-ai";
import { createClient } from "@/lib/supabase/server";

const NO_ANSWER =
  "The graph doesn't contain anything about this yet. Add the relevant documents and ask again.";

const AI_BUSY =
  "The AI service is briefly overloaded — please try again in a few seconds.";

const aiError = (e: unknown, ownKey: boolean) =>
  ownKey && /\((400|401|403)\)/.test(String(e)) ? KEY_REJECTED : AI_BUSY;

const SYSTEM = `You are Zecway, a company's knowledge assistant. Answer the question using ONLY the numbered sources provided. After every claim, cite its source like [1] or [2]. Be direct and concise. If the sources do not contain the answer, say exactly: "${NO_ANSWER}" Never invent facts that are not in the sources.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: {
    workspace_id?: string;
    question?: string;
    sources?: string[];
    days?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const workspaceId = body.workspace_id;
  const question = body.question?.trim();
  if (!workspaceId || !question) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const srcFilter =
    Array.isArray(body.sources) && body.sources.length > 0 ? body.sources : null;
  const afterTs =
    typeof body.days === "number" && body.days > 0
      ? new Date(Date.now() - body.days * 86400 * 1000).toISOString()
      : null;

  const { provider, ownKey } = await workspaceAi(supabase, workspaceId);

  // Retrieval is permission-filtered in the database: match_chunks verifies
  // membership and only returns chunks this user's principals may see.
  let embedding: number[];
  try {
    [embedding] = await provider.embedTexts([question]);
  } catch (e) {
    console.error("ask: embedding failed:", e);
    return NextResponse.json({ error: aiError(e, ownKey) }, { status: 503 });
  }
  const { data: matches, error: matchError } = await supabase.rpc("match_chunks", {
    ws: workspaceId,
    query_embedding: JSON.stringify(embedding),
    user_principals: [user.email],
    src_filter: srcFilter,
    after_ts: afterTs,
  });
  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }

  type Match = {
    chunk_id: string;
    document_id: string;
    content: string;
    title: string;
    url: string | null;
    similarity: number;
  };
  const chunks = (matches ?? []) as Match[];

  const citations: { n: number; title: string; url: string | null; document_id: string }[] =
    [];

  // One citation number per document, in retrieval order
  const docNumbers = new Map<string, number>();
  for (const c of chunks) {
    if (!docNumbers.has(c.document_id)) {
      docNumbers.set(c.document_id, docNumbers.size + 1);
      citations.push({
        n: docNumbers.size,
        title: c.title,
        url: c.url,
        document_id: c.document_id,
      });
    }
  }
  const sources = chunks
    .map((c) => `[${docNumbers.get(c.document_id)}] ${c.title}\n${c.content}`)
    .join("\n\n---\n\n");

  // Stream the answer as NDJSON lines: {type:"delta"} while the model writes,
  // then {type:"done"} carrying only the citations the answer actually used.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      let answer = "";
      try {
        if (chunks.length === 0) {
          answer = NO_ANSWER;
          send({ type: "delta", text: NO_ANSWER });
        } else {
          for await (const delta of provider.generateTextStream(
            `Sources:\n\n${sources}\n\nQuestion: ${question}`,
            SYSTEM,
          )) {
            answer += delta;
            send({ type: "delta", text: delta });
          }
        }
        const used = answer.includes(NO_ANSWER)
          ? []
          : citations.filter((c) => answer.includes(`[${c.n}]`));
        send({ type: "done", citations: used });
        await supabase.from("queries").insert({
          workspace_id: workspaceId,
          user_id: user.id,
          question,
          answer,
          citations: used,
        });
      } catch (e) {
        console.error("ask: generation failed:", e);
        send({ type: "error", error: aiError(e, ownKey) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
