import React, { useState, type ChangeEvent, type RefObject } from "react";
import { copy } from "../../../../utils/copy";

/** Design-only: file/drop handlers reset input; persistence comes in phase 2. */
function noopFiles(e: ChangeEvent<HTMLInputElement>) {
  e.target.value = "";
}

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export function ListingMediaDropzoneEmpty({ fileInputRef }: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`relative flex aspect-square w-[286px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200/90 bg-zinc-50/60 px-4 py-8 transition-colors ${
        dragOver ? "border-zinc-300 bg-zinc-100/80" : ""
      }`}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={noopFiles}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label={copy.products.detailMediaAddAria}
        className="text-sm font-medium text-zinc-700 underline-offset-4 transition hover:text-zinc-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        {copy.products.detailMediaAdd}
      </button>
      <p className="text-xs text-zinc-400">{copy.products.detailMediaDropHint}</p>
    </div>
  );
}
