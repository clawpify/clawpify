export type HeroFloatItemConfig = {
  readonly key: string;
  readonly positionClass: string;
  readonly sizeClass: string;
};

export const heroFloatItems: readonly HeroFloatItemConfig[] = [
  { key: "a", positionClass: "left-[2%] top-[8%] md:left-[4%] md:top-[10%]", sizeClass: "h-32 w-32 md:h-40 md:w-40" },
  { key: "b", positionClass: "right-[4%] top-[14%] md:right-[8%] md:top-[16%]", sizeClass: "h-28 w-28 md:h-36 md:w-36" },
  { key: "c", positionClass: "left-[8%] bottom-[22%] md:left-[12%] md:bottom-[20%]", sizeClass: "h-28 w-28 md:h-32 md:w-32" },
  { key: "d", positionClass: "right-[6%] bottom-[28%] md:right-[10%] md:bottom-[24%]", sizeClass: "h-24 w-24 md:h-32 md:w-32" },
  { key: "e", positionClass: "left-1/2 top-[18%] -translate-x-1/2 md:top-[20%]", sizeClass: "h-20 w-20 md:h-28 md:w-28" },
] as const;
