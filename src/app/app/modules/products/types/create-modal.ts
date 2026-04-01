export type ProductsCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (listingId: string) => void;
};

/** Picked file + object URL for grid preview (revoked on remove / reset). */
export type ProductImageSlot = {
  previewUrl: string;
  file: File;
};

export type ProductCreateFormState = {
  title: string;
  description: string;
  productType: string;
  sku: string;
  priceDollars: string;
  status: string;
  imageSlots: ProductImageSlot[];
};
