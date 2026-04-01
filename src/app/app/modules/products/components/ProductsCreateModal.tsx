import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImageIcon, PackageIcon, XMarkIcon } from "../../../../../icons/workspace-icons";
import { copy } from "../../../utils/copy";
import { useProducts } from "../context/ProductsContext";
import { plainTextToDescriptionHtml } from "../utils/plainToDescriptionHtml";
import type { ProductCreateFormState, ProductsCreateModalProps } from "../types";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Sentinel `<select>` value when category is free-form. */
const CATEGORY_CUSTOM = "__custom__";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function initialForm(): ProductCreateFormState {
  return {
    title: "",
    description: "",
    productType: "",
    sku: "",
    priceDollars: "",
    status: "draft",
    images: [],
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
  const { createListing, creating } = useProducts();
  const [form, setForm] = useState(() => initialForm());
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prevOpen = useRef(false);

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

  const resetForm = useCallback(() => setForm(initialForm()), []);

  useEffect(() => {
    if (open && !prevOpen.current) {
      resetForm();
    }
    prevOpen.current = open;
  }, [open, resetForm]);

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

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    e.target.value = "";
    if (!list?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_BYTES) {
        window.alert(copy.products.createModalImageTooLarge);
        continue;
      }
      if (form.images.length + urls.length >= MAX_IMAGES) {
        window.alert(copy.products.createModalMaxImages);
        break;
      }
      try {
        urls.push(await readFileAsDataUrl(file));
      } catch {
        /* ignore */
      }
    }
    if (!urls.length) return;
    setForm((f) => ({
      ...f,
      images: [...f.images, ...urls].slice(0, MAX_IMAGES),
    }));
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

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

  const submit = async () => {
    const priceCents = Math.max(0, Math.round((parseFloat(form.priceDollars) || 0) * 100));
    const html = plainTextToDescriptionHtml(form.description);
    try {
      const created = await createListing({
        title: form.title.trim() || undefined,
        description_html: html || undefined,
        product_type: form.productType.trim() || undefined,
        sku: form.sku.trim() || undefined,
        price_cents: priceCents,
        currency_code: "USD",
        status: form.status,
        ...(form.images.length ? { media_urls: form.images } : {}),
      });
      onCreated(created.id);
      onClose();
    } catch {
      /* createError in context */
    }
  };

  const catSelectVal = categorySelectValue(form.productType, presetValues);
  const showCustomCategory = catSelectVal === CATEGORY_CUSTOM;

  const attachDisabled = creating || form.images.length >= MAX_IMAGES;

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
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200/90 bg-zinc-50 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
              <PackageIcon size={13} className="shrink-0 text-emerald-600" />
              {copy.products.pageHeading}
            </span>
            <span className="text-zinc-300" aria-hidden>
              /
            </span>
            <span id="products-create-modal-title" className="text-[13px] font-medium text-zinc-900">
              {copy.products.createModalTitle}
            </span>
          </div>
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
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

          <div className="pt-4">
            <input
              ref={titleRef}
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder={copy.products.createModalTitlePlaceholder}
              className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 sm:text-[1.65rem] sm:leading-snug"
              autoComplete="off"
            />
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder={copy.products.createModalDescriptionPlaceholder}
              rows={5}
              className="mt-3 min-h-[7.5rem] w-full resize-y border-0 bg-transparent text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 sm:text-[15px] sm:leading-[1.6]"
            />
          </div>

          {form.images.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {form.images.map((url, i) => (
                <div
                  key={`${i}-${url.slice(0, 24)}`}
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-zinc-200/90 bg-zinc-50"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-0 top-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-bl bg-zinc-900/75 px-0.5 text-[9px] font-bold text-white hover:bg-red-600"
                    aria-label={copy.products.createModalRemoveImage}
                  >
                    ×
                  </button>
                </div>
              ))}
              <span className="text-[10px] font-medium tabular-nums text-zinc-400">
                {form.images.length}/{MAX_IMAGES}
              </span>
            </div>
          ) : null}

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

        <footer className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/40 px-5 py-3 sm:px-7">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={attachDisabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 shadow-sm shadow-black/[0.04] transition hover:border-zinc-300 hover:bg-white hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-40"
            aria-label={copy.products.createModalAttachmentAria}
          >
            <ImageIcon size={18} className="text-current" />
          </button>
          <div className="flex flex-1 flex-wrap items-center justify-end">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={creating}
              className="rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {creating ? copy.products.creating : copy.products.createModalSubmit}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
