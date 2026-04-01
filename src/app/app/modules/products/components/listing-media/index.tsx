import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthenticatedFetch } from "../../../../../../lib/api";
import { useToast } from "../../../../../../lib/toast";
import { copy } from "../../../../utils/copy";
import type { ConsignmentListingDto } from "../../types";
import { useListingGalleryImageUrls } from "../../hooks/useListingGalleryImageUrls";
import { uploadListingObject } from "../../utils/listingsApi";
import { ListingMediaGallery } from "./ListingMediaGallery";
import { ListingMediaPendingBar } from "./ListingMediaPendingBar";
import type { ListingMediaSlot } from "./listingMediaTypes";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

type PendingSlot = {
  id: string;
  file: File;
  previewUrl: string;
};

export type { ListingMediaSlot } from "./listingMediaTypes";

type Props = {
  listing: ConsignmentListingDto;
};

export function ListingMediaSection({ listing }: Props) {
  const fetchAuth = useAuthenticatedFetch();
  const { showToast } = useToast();
  const [imageListVersion, setImageListVersion] = useState(0);
  const serverUrls = useListingGalleryImageUrls(listing, imageListVersion);
  const [pending, setPending] = useState<PendingSlot[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serverSlots = useMemo<ListingMediaSlot[]>(
    () => serverUrls.map((url, i) => ({ key: `s-${listing.id}-${i}`, url })),
    [serverUrls, listing.id]
  );

  const pendingSlots = useMemo<ListingMediaSlot[]>(
    () => pending.map((p) => ({ key: `p-${p.id}`, url: p.previewUrl })),
    [pending]
  );

  const mediaSlots = useMemo(
    () => [...serverSlots, ...pendingSlots],
    [serverSlots, pendingSlots]
  );

  useEffect(() => {
    setHeroIndex(0);
    setPending((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.previewUrl);
      return [];
    });
  }, [listing.id]);

  useEffect(() => {
    const n = mediaSlots.length;
    if (n === 0) {
      setHeroIndex(0);
      return;
    }
    setHeroIndex((h) => (h >= n ? n - 1 : h));
  }, [mediaSlots.length]);

  const clearPending = useCallback(() => {
    setPending((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.previewUrl);
      return [];
    });
  }, []);

  const onImageFiles = useCallback(
    (picked: File[]) => {
      const imageFiles = picked.filter((f) => f.type.startsWith("image/"));
      if (!imageFiles.length) return;

      setPending((prev) => {
        const next = [...prev];
        let room = MAX_IMAGES - serverUrls.length - next.length;
        if (room <= 0) {
          window.alert(copy.products.createModalMaxImages);
          return next;
        }

        for (const file of imageFiles) {
          if (file.size > MAX_IMAGE_BYTES) {
            window.alert(copy.products.createModalImageTooLarge);
            continue;
          }
          if (room <= 0) {
            window.alert(copy.products.createModalMaxImages);
            break;
          }
          next.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
          });
          room -= 1;
        }
        return next;
      });
    },
    [serverUrls.length],
  );

  const savePending = useCallback(async () => {
    if (pending.length === 0) return;
    setMediaUploading(true);
    const batch = [...pending];
    try {
      for (const slot of batch) {
        await uploadListingObject(fetchAuth, listing.id, slot.file);
      }
      for (const slot of batch) URL.revokeObjectURL(slot.previewUrl);
      setPending([]);
      setImageListVersion((v) => v + 1);
      showToast(copy.products.detailMediaUploadSuccess);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setMediaUploading(false);
    }
  }, [fetchAuth, listing.id, pending, showToast]);

  return (
    <>
      <ListingMediaGallery
        mediaSlots={mediaSlots}
        heroIndex={heroIndex}
        onSelectHero={setHeroIndex}
        fileInputRef={fileInputRef}
        onImageFiles={onImageFiles}
        mediaUploading={mediaUploading}
      />
      <ListingMediaPendingBar
        count={pending.length}
        disabled={mediaUploading}
        onSave={savePending}
        onCancel={clearPending}
      />
    </>
  );
}
