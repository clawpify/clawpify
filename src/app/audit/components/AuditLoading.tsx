export function AuditLoading({
  message = "Querying ChatGPT web search. This may take 30–60 seconds.",
  current,
  total,
}: {
  message?: string;
  current?: number;
  total?: number;
}) {
  const showProgress = current != null && total != null && total > 0;
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      {showProgress && (
        <p className="text-sm font-medium text-zinc-900">
          Query {current} of {total}
        </p>
      )}
      <p className="text-sm text-zinc-600">{message}</p>
    </div>
  );
}
