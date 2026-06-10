import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

const NO_ANSWER =
  "The graph doesn't contain anything about this yet. Add the relevant documents and ask again.";

const SYSTEM = `You are Zecway, a company's knowledge assistant. Answer the question using ONLY the numbered sources provided. After every claim, cite its source like [1] or [2]. Be direct and concise. If the sources do not contain the answer, say exactly: "${NO_ANSWER}" Never invent facts that are not in the sources.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { workspace_id?: string; question?: string };
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

  // Retrieval is permission-filtered in the database: match_chunks verifies
  // membership and only returns chunks this user's principals may see.
  const [embedding] = await ai().embedTexts([question]);
  const { data: matches, error: matchError } = await supabase.rpc("match_chunks", {
    ws: workspaceId,
    query_embedding: JSON.stringify(embedding),
    user_principals: [user.email],
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

  let answer = NO_ANSWER;
  let citations: { n: number; title: string; url: string | null; document_id: string }[] =
    [];

  if (chunks.length > 0) {
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

    answer = await ai().generateText(
      `Sources:\n\n${sources}\n\nQuestion: ${question}`,
      SYSTEM,
    );

    // Only surface sources the answer actually cites
    if (answer.includes(NO_ANSWER)) {
      citations = [];
    } else {
      citations = citations.filter((c) => answer.includes(`[${c.n}]`));
    }
  }

  await supabase.from("queries").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    question,
    answer,
    citations,
  });

  return NextResponse.json({ answer, citations });
}
