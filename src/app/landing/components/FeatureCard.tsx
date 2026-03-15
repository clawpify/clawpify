type FeatureCardProps = {
  label?: string;
  title: string;
  description?: string;
  compact?: boolean;
};

export function FeatureCard({ label, title, description, compact }: FeatureCardProps) {
  if (compact && description) {
    return (
      <div className="flex w-full flex-col gap-3 p-6 md:p-8">
        {label && (
          <span className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-zinc-500">
            {label}
          </span>
        )}
        <h3 className="text-lg font-semibold leading-snug text-zinc-900 md:text-xl lg:text-2xl">
          {title}
        </h3>
        <p className="text-[0.75rem] leading-relaxed text-zinc-600 md:text-[0.8rem]">
          {description}
        </p>
      </div>
    );
  }

  if (description) {
    return (
      <div className="flex w-full flex-col gap-3 border border-zinc-100 bg-zinc-50/50 p-6 transition hover:border-zinc-200 hover:bg-zinc-50">
        {label && (
          <span className="font-mono self-start border border-zinc-300 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-widest text-zinc-600">
            {label}
          </span>
        )}
        <h3 className="text-sm font-semibold leading-snug text-zinc-900 sm:text-base">
          {title}
        </h3>
        <p className="text-[0.75rem] leading-relaxed text-zinc-600">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-square flex w-full items-center justify-center rounded-none border border-zinc-100 bg-zinc-50/50 p-5 transition hover:border-zinc-200 hover:bg-zinc-50">
      <h3 className="font-mono text-center text-sm font-normal uppercase tracking-wider text-zinc-900 sm:text-base">
        {title}
      </h3>
    </div>
  );
}
