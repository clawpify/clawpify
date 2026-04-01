import { useCallback, useState, type RefObject } from "react";
import { copy } from "../../../../utils/copy";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  PlusIcon,
} from "../../../../../../icons/workspace-icons";
import { AuthenticatedImg } from "../../../../../../lib/authenticatedMedia";
import { listingMediaEmptyHeroFrame, listingMediaHeroFrame } from "./listingMediaChrome";

function fillCountTemplate(template: string, current: number, total: number) {
  return template.replaceAll("{current}", String(current)).replaceAll("{total}", String(total));
}

function imageFilesFromInputList(files: FileList | File[]): File[] {
  return Array.from(files).filter((f) => f.type.startsWith("image/"));
}

function imageFilesFromDataTransfer(dt: DataTransfer): File[] {
  return imageFilesFromInputList(dt.files);
}

type Props = {
  images: string[];
  heroIndex: number;
  heroSrc: string | null;
  onSelectHero: (i: number) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageFiles: (files: File[]) => void;
  mediaUploading?: boolean;
};

export function ListingMediaGallery({
  images,
  heroIndex,
  heroSrc,
  onSelectHero,
  fileInputRef,
  onImageFiles,
  mediaUploading = false,
}: Props) {
  const n = images.length;
  const [emptyDragOver, setEmptyDragOver] = useState(false);
  const current = heroIndex + 1;
  const canGoPrev = n > 1 && heroIndex > 0;
  const canGoNext = n > 1 && heroIndex < n - 1;

  const goPrev = useCallback(() => {
    if (canGoPrev) onSelectHero(heroIndex - 1);
  }, [canGoPrev, heroIndex, onSelectHero]);

  const goNext = useCallback(() => {
    if (canGoNext) onSelectHero(heroIndex + 1);
  }, [canGoNext, heroIndex, onSelectHero]);

  const onHeroKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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

  const openFilePicker = useCallback(() => {
    if (mediaUploading) return;
    fileInputRef.current?.click();
  }, [fileInputRef, mediaUploading]);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      e.target.value = "";
      if (!list?.length) return;
      onImageFiles(imageFilesFromInputList(list));
    },
    [onImageFiles],
  );

  const onHeroDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEmptyDragOver(false);
      if (mediaUploading) return;
      const files = imageFilesFromDataTransfer(e.dataTransfer);
      if (files.length) onImageFiles(files);
    },
    [mediaUploading, onImageFiles],
  );

  const countLabel = fillCountTemplate(copy.products.detailMediaGalleryCount, current, n);
  const caption = fillCountTemplate(copy.products.detailMediaGalleryCaption, current, n);

  return (
    <div className="space-y-3">
      {n === 0 ? (
        <div
          role="region"
          tabIndex={0}
          aria-busy={mediaUploading}
          aria-label={copy.products.detailMediaGalleryRegionAria}
          className={`relative mx-auto h-[280px] w-[280px] shrink-0 outline-none transition-[border-color,background-color,opacity] focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
            mediaUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
          } ${listingMediaEmptyHeroFrame} ${
            emptyDragOver ? "border-zinc-400 bg-zinc-100" : ""
          }`}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (mediaUploading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFilePicker();
            }
          }}
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
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <ImageIcon className="text-zinc-300" size={36} />
            <p className="text-center text-sm font-medium text-zinc-700">{copy.products.detailNoImages}</p>
            <p className="max-w-[220px] text-center text-xs leading-snug text-zinc-500">
              {mediaUploading ? copy.products.detailMediaUploading : copy.products.detailMediaDropHint}
            </p>
            <button
              type="button"
              disabled={mediaUploading}
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="pointer-events-auto mt-1 rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
            >
              {copy.products.detailMediaChooseFiles}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="region"
          tabIndex={0}
          aria-label={copy.products.detailMediaGalleryRegionAria}
          className={`relative mx-auto h-[280px] w-[280px] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${listingMediaHeroFrame}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onHeroDrop}
          onKeyDown={onHeroKeyDown}
        >
          {heroSrc ? (
            <AuthenticatedImg
              src={heroSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
          ) : null}

          <div
            className="pointer-events-none absolute inset-0 flex flex-col bg-gradient-to-b from-black/35 via-transparent to-black/50"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2 sm:p-3">
            <span className="pointer-events-auto rounded-md bg-black/45 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-[2px] sm:text-xs">
              {countLabel}
            </span>
          </div>

          {n > 1 ? (
            <>
              <div className="absolute left-1 top-1/2 z-[1] -translate-y-1/2 sm:left-2">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  aria-label={copy.products.detailMediaGalleryPrevAria}
                  onClick={goPrev}
                  className={`flex size-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-md backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-35 sm:size-10 ${
                    !canGoPrev ? "cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronLeftIcon size={22} className="-ml-0.5 shrink-0 text-current" />
                </button>
              </div>
              <div className="absolute right-1 top-1/2 z-[1] -translate-y-1/2 sm:right-2">
                <button
                  type="button"
                  disabled={!canGoNext}
                  aria-label={copy.products.detailMediaGalleryNextAria}
                  onClick={goNext}
                  className={`flex size-9 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-md backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-35 sm:size-10 ${
                    !canGoNext ? "cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronRightIcon size={22} className="-mr-0.5 shrink-0 text-current" />
                </button>
              </div>
            </>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 z-[1] px-2 pb-2 pt-8 sm:px-3 sm:pb-3">
            <div className="rounded-lg bg-black/55 px-3 py-2 backdrop-blur-[2px]">
              <p className="text-center text-[12px] font-medium text-white sm:text-[13px]">{caption}</p>
              {n > 1 ? (
                <div
                  className="mt-2 flex flex-wrap items-center justify-center gap-1.5"
                  role="tablist"
                  aria-label={copy.products.detailMediaGalleryDotsAria}
                >
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === heroIndex}
                      aria-label={fillCountTemplate(copy.products.detailMediaShowImageAria, i + 1, n)}
                      onClick={() => onSelectHero(i)}
                      className={`size-2 rounded-full transition sm:size-2.5 ${
                        i === heroIndex
                          ? "bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.4)]"
                          : "bg-white/45 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={onFileInputChange}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
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
              <AuthenticatedImg src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </span>
          </button>
        ))}
        <button
          type="button"
          disabled={mediaUploading}
          onClick={openFilePicker}
          aria-label={copy.products.detailMediaAddAria}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-200/80 bg-white text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:pointer-events-none disabled:opacity-45"
        >
          <PlusIcon size={18} className="text-current" />
        </button>
      </div>
    </div>
  );
}
