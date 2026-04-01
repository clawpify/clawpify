import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "../../../../../icons/workspace-icons";
import { copy } from "../../../utils/copy";
import { useProducts } from "../context/ProductsContext";
import { isSelectableImageFile } from "../utils/listingMedia";
import { plainTextToDescriptionHtml } from "../utils/plainToDescriptionHtml";
import type { ProductCreateFormState, ProductsCreateModalProps } from "../types";
import { ListingMediaGallery } from "./listing-media/ListingMediaGallery";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Sentinel `<select>` value when category is free-form. */
const CATEGORY_CUSTOM = "__custom__";

function initialForm(): ProductCreateFormState {
  return {
    title: "",
    description: "",
    productType: "",
    sku: "",
    priceDollars: "",
    status: "draft",
    imageSlots: [],
  };
}

/** Linear-style attribute pills (compact, rounded-full). */
const metaPillClass =
  "h-7 shrink-0 rounded-full border border-zinc-200/90 bg-white px-2.5 text-[11px] font-medium text-zinc-700 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
} as const;

function categorySelectValue(productType: string, presetValues: readonly string[]): string {
  const t = productType.trim();
  if (!t) return "";
  if (presetValues.includes(t)) return t;
  return CATEGORY_CUSTOM;
}

export function ProductsCreateModal({ open, onClose, onCreated }: ProductsCreateModalProps) {
  const { createListingWithImageFiles, creating } = useProducts();
  const [form, setForm] = useState(() => initialForm());
  const [heroIndex, setHeroIndex] = useState(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef(form);
  const heroIndexRef = useRef(heroIndex);
  const prevOpen = useRef(false);

  formRef.current = form;
  heroIndexRef.current = heroIndex;

  const categoryPresets = useMemo(
    () =>
      [
        { value: copy.products.createModalCategoryPresetApparel, label: copy.products.createModalCategoryPresetApparel },
        { value: copy.products.createModalCategoryPresetElectronics, label: copy.products.createModalCategoryPresetElectronics },
        { value: copy.products.createModalCategoryPresetHome, label: copy.products.createModalCategoryPresetHome },
        { value: copy.products.createModalCategoryPresetAccessories, label: copy.products.createModalCategoryPresetAccessories },
      ] as const,
    []
  );

  const presetValues = useMemo(
    () => categoryPresets.map((p) => p.value) as readonly string[],
    [categoryPresets]
  );

  const resetForm = useCallback(() => {
    setForm((f) => {
      for (const s of f.imageSlots) URL.revokeObjectURL(s.previewUrl);
      return initialForm();
    });
  }, []);

  useEffect(() => {
    if (open && !prevOpen.current) {
      resetForm();
      setSubmitAttempted(false);
      setHeroIndex(0);
    }
    prevOpen.current = open;
  }, [open, resetForm]);

  useEffect(() => {
    const n = form.imageSlots.length;
    if (n === 0) {
      setHeroIndex(0);
      return;
    }
    setHeroIndex((h) => (h >= n ? n - 1 : h));
  }, [form.imageSlots.length]);

  const mediaSlots = useMemo(
    () =>
      form.imageSlots.map((s, i) => ({
        key: `${s.previewUrl.slice(0, 48)}-${i}`,
        url: s.previewUrl,
      })),
    [form.imageSlots]
  );

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, creating]);

  const setField = <K extends keyof ProductCreateFormState>(key: K, value: ProductCreateFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addImageFiles = useCallback((picked: File[]) => {
    if (!picked.length) return;
    setForm((f) => {
      const additions: ProductCreateFormState["imageSlots"] = [];
      for (const file of picked) {
        if (!isSelectableImageFile(file)) continue;
        if (file.size > MAX_IMAGE_BYTES) {
          window.alert(copy.products.createModalImageTooLarge);
          continue;
        }
        if (f.imageSlots.length + additions.length >= MAX_IMAGES) {
          window.alert(copy.products.createModalMaxImages);
          break;
        }
        additions.push({ file, previewUrl: URL.createObjectURL(file) });
      }
      if (!additions.length) return f;
      return {
        ...f,
        imageSlots: [...f.imageSlots, ...additions].slice(0, MAX_IMAGES),
      };
    });
  }, []);

  const onRemoveAt = useCallback((idx: number) => {
    const f = formRef.current;
    const h = heroIndexRef.current;
    const n = f.imageSlots.length;
    let nextH = h;
    if (idx < h) nextH = h - 1;
    else if (idx === h) nextH = h >= n - 1 ? Math.max(0, h - 1) : h;
    setHeroIndex(nextH);
    setForm((prev) => {
      const removed = prev.imageSlots[idx];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return { ...prev, imageSlots: prev.imageSlots.filter((_, i) => i !== idx) };
    });
  }, []);

  const onCategorySelectChange = (value: string) => {
    if (value === "") {
      setField("productType", "");
      return;
    }
    if (value === CATEGORY_CUSTOM) {
      const cur = form.productType.trim();
      if (presetValues.includes(cur)) {
        setField("productType", "");
      }
      return;
    }
    setField("productType", value);
  };

  const titleTrimmed = form.title.trim();
  const descriptionTrimmed = form.description.trim();
  const canSubmit = titleTrimmed.length > 0 && descriptionTrimmed.length > 0;
  const titleErrorId = "products-create-modal-title-error";
  const descriptionErrorId = "products-create-modal-description-error";
  const showTitleError = submitAttempted && titleTrimmed.length === 0;
  const showDescriptionError = submitAttempted && descriptionTrimmed.length === 0;

  const submit = async () => {
    if (!canSubmit) {
      setSubmitAttempted(true);
      if (!titleTrimmed) titleRef.current?.focus();
      else descriptionRef.current?.focus();
      return;
    }
    const priceCents = Math.max(0, Math.round((parseFloat(form.priceDollars) || 0) * 100));
    const html = plainTextToDescriptionHtml(form.description);
    try {
      const files = form.imageSlots.map((s) => s.file);
      const created = await createListingWithImageFiles(
        {
          title: titleTrimmed,
          description_html: html,
          product_type: form.productType.trim() || undefined,
          sku: form.sku.trim() || undefined,
          price_cents: priceCents,
          currency_code: "USD",
          status: form.status,
        },
        files
      );
      onCreated(created.id);
      onClose();
    } catch {
      /* createError in context */
    }
  };

  const catSelectVal = categorySelectValue(form.productType, presetValues);
  const showCustomCategory = catSelectVal === CATEGORY_CUSTOM;

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onClick={() => !creating && onClose()}
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="products-create-modal-title"
        className="flex max-h-[min(92vh,880px)] w-full max-w-[min(96vw,800px)] flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_16px_48px_-6px_rgba(15,23,42,0.18),0_4px_16px_-4px_rgba(15,23,42,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-5 py-2.5 sm:px-7 sm:py-3">
          <span id="products-create-modal-title" className="min-w-0 text-[13px] font-medium text-zinc-900">
            {copy.products.createModalTitle}
          </span>
          <button
            type="button"
            onClick={() => !creating && onClose()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            aria-label={copy.products.createModalClose}
          >
            <XMarkIcon size={17} className="text-current" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-7">
          <div className="pt-4">
            <ListingMediaGallery
              mediaSlots={mediaSlots}
              heroIndex={heroIndex}
              onSelectHero={setHeroIndex}
              fileInputRef={fileRef}
              onImageFiles={addImageFiles}
              emptyHeadline={copy.products.createModalMediaNoImages}
              emptyHint={copy.products.createModalMediaDropHint}
              chooseFilesLabel={copy.products.createModalMediaChooseFiles}
              regionAriaLabel={copy.products.createModalMediaGalleryRegionAria}
              onRemoveAt={onRemoveAt}
            />
          </div>

          <div className="mt-4">
            <input
              ref={titleRef}
              id="products-create-modal-title-field"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder={copy.products.createModalTitlePlaceholder}
              aria-invalid={showTitleError}
              aria-describedby={showTitleError ? titleErrorId : undefined}
              className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 sm:text-[1.65rem] sm:leading-snug"
              autoComplete="off"
            />
            {showTitleError ? (
              <p id={titleErrorId} className="mt-1.5 text-[13px] text-red-600">
                {copy.products.createModalTitleRequired}
              </p>
            ) : null}
            <textarea
              ref={descriptionRef}
              id="products-create-modal-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder={copy.products.createModalDescriptionPlaceholder}
              rows={5}
              aria-invalid={showDescriptionError}
              aria-describedby={showDescriptionError ? descriptionErrorId : undefined}
              className="mt-3 h-[7.5rem] min-h-0 w-full resize-none overflow-y-auto border-0 bg-transparent text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 sm:text-[15px] sm:leading-[1.6]"
            />
            {showDescriptionError ? (
              <p id={descriptionErrorId} className="mt-1.5 text-[13px] text-red-600">
                {copy.products.createModalDescriptionRequired}
              </p>
            ) : null}
          </div>

          <div className="mt-4 border-t border-zinc-100 pt-3.5 pb-5 sm:mt-5 sm:pt-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                aria-label={copy.products.colStatus}
                className={`${metaPillClass} max-w-[5.5rem] cursor-pointer appearance-none bg-[length:0.55rem] bg-[right_0.4rem_center] bg-no-repeat pl-2 pr-5`}
                style={selectChevronStyle}
              >
                <option value="draft">{copy.products.createModalStatusDraft}</option>
                <option value="published">{copy.products.createModalStatusPublished}</option>
              </select>

              <select
                value={catSelectVal}
                onChange={(e) => onCategorySelectChange(e.target.value)}
                aria-label={copy.products.colCategory}
                title={form.productType || copy.products.createModalCategoryPlaceholder}
                className={`${metaPillClass} max-w-[6.75rem] cursor-pointer appearance-none bg-[length:0.55rem] bg-[right_0.4rem_center] bg-no-repeat pl-2 pr-5`}
                style={selectChevronStyle}
              >
                <option value="">{copy.products.createModalCategoryPlaceholder}</option>
                {categoryPresets.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value={CATEGORY_CUSTOM}>{copy.products.createModalCategoryOtherCustom}</option>
              </select>
              {showCustomCategory ? (
                <input
                  value={form.productType}
                  onChange={(e) => setField("productType", e.target.value)}
                  placeholder={copy.products.createModalCategoryPlaceholder}
                  aria-label={copy.products.colCategory}
                  className={`${metaPillClass} min-w-0 max-w-[6.5rem] flex-1 font-normal sm:max-w-[8.5rem]`}
                />
              ) : null}

              <input
                value={form.priceDollars}
                onChange={(e) => setField("priceDollars", e.target.value)}
                placeholder={copy.products.createModalPricePlaceholder}
                inputMode="decimal"
                aria-label={copy.products.colPrice}
                className={`${metaPillClass} w-[4.25rem] tabular-nums`}
              />
              <input
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
                placeholder={copy.products.createModalSkuPlaceholder}
                aria-label={copy.products.colSku}
                className={`${metaPillClass} w-[4rem] sm:w-[4.5rem]`}
              />
            </div>
          </div>
        </div>

        <footer className="mt-auto flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/40 px-5 py-3 sm:px-7">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={creating}
            className={`rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${!creating && !canSubmit ? "opacity-50 hover:bg-indigo-600" : ""}`}
          >
            {creating ? copy.products.creating : copy.products.createModalSubmit}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
