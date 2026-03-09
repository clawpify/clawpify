export function AuditLoading({
  message = "Querying ChatGPT web search. This may take 30–60 seconds.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      <p className="text-sm text-zinc-600">{message}</p>
    </div>
  );
}
