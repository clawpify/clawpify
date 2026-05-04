import type { HeroFloatItemConfig } from "../types";

export function landingPublicImageUrl(filename: string): string {
  return `/image/${encodeURIComponent(filename)}`;
}

export const LANDING_PRODUCT_IMAGE_FILENAMES = [
  "product-chair.webp",
  "nintendo.webp",
  "product-sweater.webp",
  "mactintosh.webp",
  "product-fridge.webp",
  "product-hockey.webp",
] as const;

export const LANDING_INVENTORY_FEATURE_IMAGE_FILENAMES = [
  "product-chair.webp",
  "nintendo.webp",
  "product-sweater.webp",
  "mactintosh.webp",
  "product-fridge.webp",
  "product-hockey.webp",
  "car.webp",
] as const;

const HERO_PRODUCT_IMAGES = LANDING_PRODUCT_IMAGE_FILENAMES;

const HERO_BUBBLE_LAYOUT = [
  {
    key: "a",
    positionClass: "left-[1%] top-[6%] md:left-[3%] md:top-[10%]",
    sizeClass: "h-32 w-32 md:h-40 md:w-40",
  },
  {
    key: "e",
    positionClass: "left-[11%] -top-1 md:left-[14%] md:top-[5%]",
    sizeClass: "h-28 w-28 md:h-36 md:w-36",
  },
  {
    key: "b",
    positionClass: "right-[0%] top-[8%] md:right-[2%] md:top-[14%]",
    sizeClass: "h-36 w-36 md:h-44 md:w-44",
  },
  {
    key: "c",
    positionClass: "left-[2%] bottom-[5%] md:left-[4%] md:bottom-[9%]",
    sizeClass: "h-32 w-32 md:h-40 md:w-40",
  },
  {
    key: "f",
    positionClass: "left-[13%] bottom-[2%] md:left-[17%] md:bottom-[7%]",
    sizeClass: "h-28 w-28 md:h-36 md:w-36",
  },
  {
    key: "d",
    positionClass: "right-[1%] bottom-[6%] md:right-[3%] md:bottom-[11%]",
    sizeClass: "h-32 w-32 md:h-40 md:w-40",
  },
] as const;

export const heroFloatItems: readonly HeroFloatItemConfig[] = HERO_BUBBLE_LAYOUT.map((layout, index) => {
  const productAsset = HERO_PRODUCT_IMAGES[index]!;
  return {
    ...layout,
    productAsset,
    imageSrc: landingPublicImageUrl(productAsset),
  };
});
