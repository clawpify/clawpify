export type ProductsCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (listingId: string) => void;
};

export type ProductCreateFormState = {
  title: string;
  description: string;
  productType: string;
  sku: string;
  priceDollars: string;
  status: string;
  images: string[];
};
