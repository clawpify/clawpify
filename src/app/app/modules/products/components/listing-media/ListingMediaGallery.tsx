import {
  useCallback,
  useId,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { copy } from "../../../../utils/copy";
import { ImageIcon, PlusIcon } from "../../../../../../icons/workspace-icons";
import { AuthenticatedImg } from "../../../../../../lib/authenticatedMedia";
import { isSelectableImageFile } from "../../utils/listingMedia";
import { listingMediaEmptyHeroFrame, listingMediaHeroFrame } from "./listingMediaChrome";
import type { ListingMediaSlot } from "./listingMediaTypes";

/** Blob/data URLs are local previews — skip the auth-fetch path entirely. */
function SlotImg({ url, className, loading }: { url: string; className?: string; loading?: "lazy" | "eager" }) {
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return <img src={url} alt="" className={className} loading={loading} />;
  }
  return <AuthenticatedImg src={url} alt="" className={className} loading={loading} />;
}

function imageFilesFromInputList(files: FileList | File[]): File[] {
  return Array.from(files).filter(isSelectableImageFile);
}

function imageFilesFromDataTransfer(dt: DataTransfer): File[] {
  return imageFilesFromInputList(dt.files);
}

type Props = {
  mediaSlots: ListingMediaSlot[];
  heroIndex: number;
  onSelectHero: (i: number) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageFiles: (files: File[]) => void;
  mediaUploading?: boolean;
  /** When set, overrides empty-state headline (detail default: detailNoImages). */
  emptyHeadline?: string;
  /** When set, overrides empty drop hint when not uploading (detail: detailMediaDropHint). */
  emptyHint?: string;
  /** When set, overrides “Choose files” chip (detail: detailMediaChooseFiles). */
  chooseFilesLabel?: string;
  /** When set, region aria-label for both empty and filled states (detail: detailMediaGalleryRegionAria). */
  regionAriaLabel?: string;
  /** Corner control on each filmstrip thumb; stopPropagation so selection unchanged until remove. */
  onRemoveAt?: (index: number) => void;
};

export function ListingMediaGallery({
  mediaSlots,
  heroIndex,
  onSelectHero,
  fileInputRef,
  onImageFiles,
  mediaUploading = false,
  emptyHeadline,
  emptyHint,
  chooseFilesLabel,
  regionAriaLabel,
  onRemoveAt,
}: Props) {
  const pickInputId = useId();
  const n = mediaSlots.length;
  const heroSrc = mediaSlots[heroIndex]?.url ?? null;
  const [emptyDragOver, setEmptyDragOver] = useState(false);
  const emptyHeadlineText = emptyHeadline ?? copy.products.detailNoImages;
  
  const emptyHintText =
    emptyHint ?? copy.products.detailMediaDropHint;

  const chooseFilesText =
    chooseFilesLabel ?? copy.products.detailMediaChooseFiles;

  const regionLabel =
    regionAriaLabel ?? copy.products.detailMediaGalleryRegionAria;

  const goPrev = useCallback(() => {
    if (n > 1 && heroIndex > 0) onSelectHero(heroIndex - 1);
  }, [n, heroIndex, onSelectHero]);

  const goNext = useCallback(() => {
    if (n > 1 && heroIndex < n - 1) onSelectHero(heroIndex + 1);
  }, [n, heroIndex, onSelectHero]);

  const onHeroKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (n < 2) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [n, goPrev, goNext],
  );

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      const picked = list ? Array.from(list) : [];
      e.target.value = "";
      if (!picked.length) return;
      const passed = picked.filter(isSelectableImageFile);
      onImageFiles(passed);
    },
    [onImageFiles],
  );

  const onHeroDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEmptyDragOver(false);
      if (mediaUploading) return;
      const files = imageFilesFromDataTransfer(e.dataTransfer);
      if (files.length) onImageFiles(files);
    },
    [mediaUploading, onImageFiles],
  );

  return (
    <div className="space-y-3">
      {n === 0 ? (
        <label
          htmlFor={pickInputId}
          role="region"
          tabIndex={0}
          aria-busy={mediaUploading}
          aria-label={regionLabel}
          className={`relative mx-auto flex h-[300px] w-[300px] shrink-0 cursor-pointer flex-col outline-none transition-[border-color,background-color,opacity] focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
            mediaUploading ? "pointer-events-none opacity-60" : ""
          } ${listingMediaEmptyHeroFrame} ${
            emptyDragOver ? "border-zinc-400 bg-zinc-100" : ""
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!mediaUploading) setEmptyDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setEmptyDragOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onHeroDrop}
        >
          <div className="pointer-events-none flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <ImageIcon className="text-zinc-300" size={36} />
            <p className="text-center text-sm font-medium text-zinc-700">{emptyHeadlineText}</p>
            <p className="max-w-[220px] text-center text-xs leading-snug text-zinc-500">
              {mediaUploading ? copy.products.detailMediaUploading : emptyHintText}
            </p>
            <span className="pointer-events-none mt-1 rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              {chooseFilesText}
            </span>
          </div>
        </label>
      ) : (
        <div
          role="region"
          tabIndex={0}
          aria-label={regionLabel}
          className={`relative mx-auto h-[300px] w-[300px] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${listingMediaHeroFrame}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onHeroDrop}
          onKeyDown={onHeroKeyDown}
        >
          {heroSrc ? (
            <div className="absolute inset-0 z-0">
              <SlotImg
                url={heroSrc}
                className="absolute inset-0 size-full object-cover"
                loading="eager"
              />
            </div>
          ) : null}
        </div>
      )}

      <input
        ref={fileInputRef}
        id={pickInputId}
        type="file"
        accept="image/*"
        multiple
        disabled={mediaUploading}
        className="sr-only"
        tabIndex={-1}
        onChange={onFileInputChange}
      />
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {mediaSlots.map((slot, i) => (
          <div key={slot.key} className="relative">
            <button
              type="button"
              onClick={() => onSelectHero(i)}
              aria-current={i === heroIndex ? "true" : undefined}
              aria-label={`${copy.products.detailSectionMedia} ${i + 1}`}
              className={`relative overflow-hidden rounded-md ring-1 ring-inset transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ${
                i === heroIndex
                  ? "ring-[3px] ring-zinc-900 ring-offset-1 ring-offset-white"
                  : "ring-black/[0.06] hover:ring-zinc-300"
              }`}
            >
              <span className="block h-11 w-11 bg-zinc-100">
                <SlotImg url={slot.url} className="h-full w-full object-cover" loading="eager" />
              </span>
            </button>
            {onRemoveAt ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveAt(i);
                }}
                aria-label={copy.products.createModalRemoveImage}
                className="absolute right-0 top-0 z-10 flex h-4 min-w-[16px] items-center justify-center rounded-bl bg-zinc-900/80 px-0.5 text-[10px] font-bold leading-none text-white hover:bg-red-600"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
        <label
          htmlFor={pickInputId}
          aria-label={copy.products.detailMediaAddAria}
          className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-200/80 bg-white text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-600 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-zinc-400 ${
            mediaUploading ? "pointer-events-none opacity-45" : ""
          }`}
        >
          <PlusIcon size={18} className="pointer-events-none text-current" />
        </label>
      </div>
    </div>
  );
}
