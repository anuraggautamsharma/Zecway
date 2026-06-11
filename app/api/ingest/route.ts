import { NextResponse } from "next/server";
import { workspaceAi, KEY_REJECTED } from "@/lib/workspace-ai";
import { extractMarkdown } from "@/lib/extract";
import { chunkMarkdown, titleFromMarkdown, WORKSPACE_PRINCIPAL } from "@/lib/ingest";
import { createClient } from "@/lib/supabase/server";

// Runs under the logged-in user's own session: RLS verifies workspace
// membership on every insert, so no service key is needed.
const MAX_FILE_BYTES = 10_000_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const form = await request.formData();
  const workspaceId = String(form.get("workspace_id") ?? "");
  const file = form.get("file");
  if (!workspaceId || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is too large (10 MB max for now)" },
      { status: 400 },
    );
  }

  let markdown: string;
  try {
    markdown = await extractMarkdown(file);
  } catch (e) {
    console.error("ingest: extraction failed:", e);
    return NextResponse.json(
      { error: "Couldn't read this file — is it a valid PDF/Word/text document?" },
      { status: 400 },
    );
  }
  if (!markdown) {
    return NextResponse.json(
      { error: "No readable text found in this file (scanned PDFs aren't supported yet)" },
      { status: 400 },
    );
  }

  // Re-uploading the same file replaces it (unique on workspace/source/source_id)
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .upsert(
      {
        workspace_id: workspaceId,
        source: "upload",
        source_id: file.name,
        title: titleFromMarkdown(markdown, file.name),
        markdown,
        author: user.email,
        permitted_principals: [WORKSPACE_PRINCIPAL],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,source,source_id" },
    )
    .select("id")
    .single();
  if (docError || !doc) {
    return NextResponse.json(
      { error: docError?.message ?? "Could not save document" },
      { status: 500 },
    );
  }

  await supabase.from("chunks").delete().eq("document_id", doc.id);

  const contents = chunkMarkdown(markdown);
  const { provider, ownKey } = await workspaceAi(supabase, workspaceId);

  let embeddings: number[][];
  try {
    embeddings = await provider.embedTexts(contents);
  } catch (e) {
    console.error("ingest: embedding failed:", e);
    return NextResponse.json(
      {
        error:
          ownKey && /\((400|401|403)\)/.test(String(e))
            ? KEY_REJECTED
            : "The AI service is briefly overloaded — please try again in a few seconds.",
      },
      { status: 503 },
    );
  }

  const { error: chunkError } = await supabase.from("chunks").insert(
    contents.map((content, idx) => ({
      workspace_id: workspaceId,
      document_id: doc.id,
      idx,
      content,
      embedding: JSON.stringify(embeddings[idx]),
      permitted_principals: [WORKSPACE_PRINCIPAL],
    })),
  );
  if (chunkError) {
    return NextResponse.json({ error: chunkError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document_id: doc.id, chunks: contents.length });
}
