import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedFetch } from "../../../../../../lib/api";
import { useToast } from "../../../../../../lib/toast";
import { copy } from "../../../../utils/copy";
import type { ConsignmentListingDto } from "../../types";
import { useListingGalleryImageUrls } from "../../hooks/useListingGalleryImageUrls";
import { uploadListingObject } from "../../utils/listingsApi";
import { ListingMediaGallery } from "./ListingMediaGallery";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Props = {
  listing: ConsignmentListingDto;
};

export function ListingMediaSection({ listing }: Props) {
  const fetchAuth = useAuthenticatedFetch();
  const { showToast } = useToast();
  const [imageListVersion, setImageListVersion] = useState(0);
  const images = useListingGalleryImageUrls(listing, imageListVersion);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHeroIndex(0);
  }, [listing.id]);

  const heroSrc = images[heroIndex] ?? null;

  const onImageFiles = useCallback(
    async (picked: File[]) => {
      const imageFiles = picked.filter((f) => f.type.startsWith("image/"));
      if (!imageFiles.length) return;

      const allowed: File[] = [];
      for (const file of imageFiles) {
        if (file.size > MAX_IMAGE_BYTES) {
          window.alert(copy.products.createModalImageTooLarge);
          continue;
        }
        allowed.push(file);
      }
      if (!allowed.length) return;

      setMediaUploading(true);
      try {
        for (const file of allowed) {
          await uploadListingObject(fetchAuth, listing.id, file);
        }
        setImageListVersion((v) => v + 1);
        showToast(copy.products.detailMediaUploadSuccess);
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setMediaUploading(false);
      }
    },
    [fetchAuth, listing.id, showToast],
  );

  return (
    <ListingMediaGallery
      images={images}
      heroIndex={heroIndex}
      heroSrc={heroSrc}
      onSelectHero={setHeroIndex}
      fileInputRef={fileInputRef}
      onImageFiles={onImageFiles}
      mediaUploading={mediaUploading}
    />
  );
}
