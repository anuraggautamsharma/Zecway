// Per-format extractors → one markdown string. This is the front half of the
// conversion pipeline; chunking and embedding (lib/ingest.ts) are format-blind.

import mammoth from "mammoth";

export const EXTRACTABLE_EXTENSIONS = [".md", ".markdown", ".txt", ".pdf", ".docx"];

export async function extractMarkdown(file: File): Promise<string> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (ext === ".pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  }

  if (ext === ".docx") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  // .md / .markdown / .txt — already text
  return (await file.text()).trim();
}
