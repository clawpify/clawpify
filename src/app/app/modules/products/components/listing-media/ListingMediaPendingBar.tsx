import { createPortal } from "react-dom";
import {
  landingOrangeBubbleClassName,
  landingOrangeBubbleStyle,
  landingWhiteBubbleClassName,
} from "../../../../../landing/components/Button";
import { copy } from "../../../../utils/copy";

function fillCount(s: string, count: number) {
  return s.replaceAll("{count}", String(count));
}

const SURFACE =
  "rounded-lg border border-zinc-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.12),0_1px_3px_rgba(15,23,42,0.08)]";

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
      className={`animate-pending-bar-in fixed bottom-6 left-1/2 z-[320] flex w-[min(90vw,28rem)] flex-wrap items-center justify-center gap-3 px-4 py-3 text-sm text-zinc-800 ${SURFACE}`}
    >
      <p className="min-w-0 flex-1 text-center font-medium sm:text-left">
        {count === 1
          ? copy.products.detailMediaPendingSummaryOne
          : fillCount(copy.products.detailMediaPendingSummaryMany, count)}
      </p>
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className={[
            landingWhiteBubbleClassName,
            "landing-sans-copy inline-flex min-h-9 items-center justify-center px-4 py-2 text-sm",
          ].join(" ")}
        >
          <span className="relative z-[2]">{copy.products.detailMediaPendingCancel}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className={[
            landingOrangeBubbleClassName,
            "landing-sans-copy inline-flex min-h-9 items-center justify-center px-4 py-2 text-sm",
          ].join(" ")}
          style={landingOrangeBubbleStyle}
        >
          <span className="relative z-[2]">{copy.products.detailMediaPendingSave}</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
