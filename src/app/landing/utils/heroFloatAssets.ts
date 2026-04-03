export type HeroFloatItemConfig = {
  readonly key: string;
  readonly positionClass: string;
  readonly sizeClass: string;
};

/**
 * Corner pairs use rem-based X offset so larger orbs never overlap. Top- and bottom-left are each a
 * separated double; right side stays single orbs.
 */
export const heroFloatItems: readonly HeroFloatItemConfig[] = [
  { key: "a", positionClass: "left-4 top-4 md:left-5 md:top-5", sizeClass: "h-32 w-32 md:h-40 md:w-40" },
  {
    key: "e",
    positionClass: "left-[10rem] top-4 md:left-[12rem] md:top-5",
    sizeClass: "h-28 w-28 md:h-36 md:w-36",
  },
  { key: "b", positionClass: "right-4 top-4 md:right-5 md:top-5", sizeClass: "h-32 w-32 md:h-44 md:w-44" },
  { key: "c", positionClass: "left-4 bottom-4 md:left-5 md:bottom-5", sizeClass: "h-32 w-32 md:h-40 md:w-40" },
  {
    key: "f",
    positionClass: "left-[10rem] bottom-4 md:left-[12rem] md:bottom-5",
    sizeClass: "h-28 w-28 md:h-36 md:w-36",
  },
  { key: "d", positionClass: "right-4 bottom-4 md:right-5 md:bottom-5", sizeClass: "h-28 w-28 md:h-36 md:w-36" },
] as const;
