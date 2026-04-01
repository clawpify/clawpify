import type { ConsignmentListingDto, ProductIntakeDraft, ProductProcessResult } from "../types";

export type ListListingsQuery = {
  status?: string;
  limit?: number;
  offset?: number;
};

export function listingsListPath(query?: ListListingsQuery): string {
  const p = new URLSearchParams();
  if (query?.status) p.set("status", query.status);
  if (query?.limit != null) p.set("limit", String(query.limit));
  if (query?.offset != null) p.set("offset", String(query.offset));
  const qs = p.toString();
  return `/api/listings${qs ? `?${qs}` : ""}`;
}

export function listingByIdPath(id: string): string {
  return `/api/listings/${encodeURIComponent(id)}`;
}

export async function parseListingsResponse(res: Response): Promise<ConsignmentListingDto[]> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as {
        error?: string | { message?: string };
      };
      const message =
        typeof body?.error === "string" ? body.error : body?.error?.message;
      if (message) detail = message;
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<ConsignmentListingDto[]>;
}

export type UpdateListingPayload = Partial<
  Pick<
    ConsignmentListingDto,
    | "title"
    | "description_html"
    | "product_type"
    | "vendor"
    | "tags"
    | "price_cents"
    | "currency_code"
    | "sku"
    | "status"
    | "acceptance_status"
    | "decline_reason"
  >
>;

export async function parseUpdateListingResponse(res: Response): Promise<ConsignmentListingDto> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as {
        error?: string | { message?: string };
      };
      const message =
        typeof body?.error === "string" ? body.error : body?.error?.message;
      if (message) detail = message;
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<ConsignmentListingDto>;
}

export async function parseDeleteListingResponse(res: Response): Promise<void> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as {
        error?: string | { message?: string };
      };
      const message =
        typeof body?.error === "string" ? body.error : body?.error?.message;
      if (message) detail = message;
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
}

export type ProcessProductsRequest = {
  items: ProductIntakeDraft[];
};

const MAX_IMAGE_EDGE_PX = 1600;
const MAX_IMAGE_BYTES = 1_000_000;
const MIN_JPEG_QUALITY = 0.55;
const PASSTHROUGH_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

async function compressImageFile(file: File): Promise<Blob> {
  let bitmap: ImageBitmap | null = null;
  if ("createImageBitmap" in window) {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      bitmap = null;
    }
  }
  const imageEl = bitmap ? null : await loadImageElement(file);
  const source = bitmap ?? imageEl;
  if (!source) return file;

  const srcWidth = bitmap ? bitmap.width : imageEl!.naturalWidth;
  const srcHeight = bitmap ? bitmap.height : imageEl!.naturalHeight;
  const longest = Math.max(srcWidth, srcHeight);
  const scale = longest > MAX_IMAGE_EDGE_PX ? MAX_IMAGE_EDGE_PX / longest : 1;
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to initialize canvas context");

  ctx.drawImage(source, 0, 0, width, height);
  bitmap?.close();

  let quality = 0.88;
  let best: Blob | null = null;
  while (quality >= MIN_JPEG_QUALITY) {
    // toBlob keeps memory use lower than toDataURL during compression attempts.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) break;
    best = blob;
    if (blob.size <= MAX_IMAGE_BYTES) return blob;
    quality -= 0.08;
  }

  return best ?? file;
}

export async function processProductsRequestBody(
  request: ProcessProductsRequest
): Promise<{
  items: Array<{
    clientId: string;
    imageDataUrls: string[];
    model: string;
    originalPrice: number | null;
    isUsed: boolean;
    notes: string;
  }>;
}> {
  const items = await Promise.all(
    request.items.map(async (item) => {
      const imageDataUrls = await Promise.all(
        item.images.map(async (image) => {
          try {
            const mimeType = image.file.type.toLowerCase();
            if (PASSTHROUGH_IMAGE_TYPES.has(mimeType)) {
              return fileToDataUrl(image.file);
            }
            const compressed = await compressImageFile(image.file);
            return fileToDataUrl(compressed);
          } catch {
            return fileToDataUrl(image.file);
          }
        })
      );
      return {
        clientId: item.clientId,
        imageDataUrls,
        model: item.model.trim(),
        originalPrice:
          item.originalPrice.trim().length > 0 ? Number.parseFloat(item.originalPrice) : null,
        isUsed: item.isUsed,
        notes: item.notes.trim(),
      };
    })
  );
  return {
    items,
  };
}

export async function processProductsResponse(
  res: Response
): Promise<ProductProcessResult[]> {
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(
        "Uploaded images are too large. Remove some images, or retry with fewer/lower-resolution photos."
      );
    }
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      // ignore
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  const body = (await res.json()) as { results?: ProductProcessResult[] };
  return body.results ?? [];
}
