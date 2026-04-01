import { createPortal } from "react-dom";
import { copy } from "../../../../utils/copy";

function fillCount(s: string, count: number) {
  return s.replaceAll("{count}", String(count));
}

type Props = {
  count: number;
  disabled: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function ListingMediaPendingBar({ count, disabled, onSave, onCancel }: Props) {
  if (count < 1) return null;

  return createPortal(
    <div
      role="region"
      aria-label={copy.products.detailMediaPendingBarAria}
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[320] flex max-w-[min(90vw,28rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-lg border border-zinc-200/90 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.12),0_1px_3px_rgba(15,23,42,0.08)] sm:flex-nowrap sm:justify-between"
    >
      <p className="min-w-0 flex-1 text-center text-sm font-medium text-zinc-800 sm:text-left">
        {fillCount(copy.products.detailMediaPendingSummary, count)}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-45"
        >
          {copy.products.detailMediaPendingCancel}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-45"
        >
          {copy.products.detailMediaPendingSave}
        </button>
      </div>
    </div>,
    document.body
  );
}
