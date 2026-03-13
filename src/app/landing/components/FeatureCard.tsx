export function FeatureCard({ title }: { title: string }) {
  return (
    <div className="aspect-square flex w-full items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 transition hover:border-zinc-200 hover:bg-zinc-50">
      <h3 className="font-mono text-center text-base font-normal uppercase tracking-wider text-zinc-900 sm:text-lg">
        {title}
      </h3>
    </div>
  );
}
