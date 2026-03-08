export function FeatureCard({ title }: { title: string }) {
  return (
    <div className="aspect-square flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300">
      <h3 className="font-mono text-center text-base font-semibold uppercase tracking-wider text-zinc-900 sm:text-lg">
        {title}
      </h3>
    </div>
  );
}
