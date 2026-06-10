// File → markdown → chunks. Uploads are visible to the whole workspace via
// the sentinel principal; connector-sourced content will carry real
// per-document principals instead.

export const WORKSPACE_PRINCIPAL = "__workspace__";

const MAX_CHUNK_CHARS = 1600;

// Split markdown on paragraph boundaries into chunks of at most
// MAX_CHUNK_CHARS, hard-splitting only paragraphs that alone exceed it.
export function chunkMarkdown(markdown: string): string[] {
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (para.length > MAX_CHUNK_CHARS) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < para.length; i += MAX_CHUNK_CHARS) {
        chunks.push(para.slice(i, i + MAX_CHUNK_CHARS));
      }
      continue;
    }
    if (current && current.length + para.length + 2 > MAX_CHUNK_CHARS) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Title: first markdown heading if there is one, else the file name.
export function titleFromMarkdown(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#{1,6}\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback.replace(/\.(md|markdown|txt)$/i, "");
}
