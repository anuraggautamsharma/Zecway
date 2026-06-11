// Standard content column for document-style pages. Chat and the agent
// builder go full-bleed instead.
export default function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-10">{children}</div>
  );
}
