import { NextResponse } from "next/server";
import { workspaceAi, KEY_REJECTED, TRIAL_CAPPED } from "@/lib/workspace-ai";
import { createClient } from "@/lib/supabase/server";

const NO_ANSWER =
  "The graph doesn't contain anything about this yet. Add the relevant documents and ask again.";

const AI_BUSY =
  "The AI service is briefly overloaded — please try again in a few seconds.";

const aiError = (e: unknown, ownKey: boolean) =>
  ownKey && /\((400|401|403)\)/.test(String(e)) ? KEY_REJECTED : AI_BUSY;

const SYSTEM = `You are Zecway, a company's knowledge assistant, in an ongoing conversation. Answer the user's latest message using ONLY the numbered sources provided, considering the conversation so far for context. After every claim, cite its source like [1] or [2]. Be direct and concise. If the sources do not contain the answer, say exactly: "${NO_ANSWER}" Never invent facts that are not in the sources.`;

type Msg = { role: "user" | "assistant"; content: string };

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
    conversation_id?: string;
    message?: string;
    sources?: string[];
    days?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const workspaceId = body.workspace_id;
  const message = body.message?.trim();
  if (!workspaceId || !message) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const srcFilter =
    Array.isArray(body.sources) && body.sources.length > 0 ? body.sources : null;
  const afterTs =
    typeof body.days === "number" && body.days > 0
      ? new Date(Date.now() - body.days * 86400 * 1000).toISOString()
      : null;

  // Find or start the conversation (RLS guarantees it's the caller's own).
  let conversationId = body.conversation_id ?? null;
  let history: Msg[] = [];
  if (conversationId) {
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    history = (msgs ?? []) as Msg[];
  } else {
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: message.slice(0, 80),
      })
      .select("id")
      .single();
    if (error || !conv) {
      return NextResponse.json(
        { error: error?.message ?? "Could not start chat" },
        { status: 500 },
      );
    }
    conversationId = conv.id;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  // Follow-ups are often elliptical ("and for part-timers?"); fold the
  // previous user question into the retrieval text so the right chunks
  // still surface, while the model answers only the new message.
  const prevUserQ = [...history].reverse().find((m) => m.role === "user")?.content;
  const retrievalText =
    message.split(/\s+/).length < 8 && prevUserQ ? `${prevUserQ}\n${message}` : message;

  const transcript = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const { provider, ownKey, capped } = await workspaceAi(supabase, workspaceId);
  if (capped) {
    return NextResponse.json({ error: TRIAL_CAPPED }, { status: 429 });
  }

  const encoder = new TextEncoder();
  const convId = conversationId;
  const citations: { n: number; title: string; url: string | null; document_id: string }[] =
    [];
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      let answer = "";
      try {
        send({ type: "meta", conversation_id: convId });
        // retrieval happens inside the stream so the client can show the
        // search step while it runs — the receipts start before the answer
        send({ type: "searching", query: retrievalText });
        const [embedding] = await provider.embedTexts([retrievalText]);
        const { data: matches, error: matchError } = await supabase.rpc("match_chunks", {
          ws: workspaceId,
          query_embedding: JSON.stringify(embedding),
          user_principals: [user.email],
          src_filter: srcFilter,
          after_ts: afterTs,
        });
        if (matchError) throw new Error(matchError.message);

        type Match = {
          chunk_id: string;
          document_id: string;
          content: string;
          title: string;
          url: string | null;
          similarity: number;
        };
        const chunks = (matches ?? []) as Match[];

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
        const prompt =
          `Sources:\n\n${sources || "(none)"}\n\n` +
          (transcript ? `Conversation so far:\n\n${transcript}\n\n` : "") +
          `User's new message: ${message}`;

        if (chunks.length === 0) {
          answer = NO_ANSWER;
          send({ type: "delta", text: NO_ANSWER });
        } else {
          for await (const delta of provider.generateTextStream(prompt, SYSTEM)) {
            answer += delta;
            send({ type: "delta", text: delta });
          }
        }
        const used = answer.includes(NO_ANSWER)
          ? []
          : citations.filter((c) => answer.includes(`[${c.n}]`));
        send({ type: "done", citations: used });
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: answer,
          citations: used,
        });
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      } catch (e) {
        console.error("chat: generation failed:", e);
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
