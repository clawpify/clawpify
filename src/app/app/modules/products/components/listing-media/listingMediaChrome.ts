/** Matches sidebar `DetailRailCard` chrome. */
export const RAIL_CARD_SHADOW =
  "shadow-[0_1px_3px_rgba(15,23,42,0.08),0_1px_2px_-1px_rgba(15,23,42,0.06)]";

export const listingMediaHeroFrame = `overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-100 ${RAIL_CARD_SHADOW}`;

/** Empty / drop-target chrome: dashed border reads as an upload zone. */
export const listingMediaEmptyHeroFrame = `overflow-hidden rounded-lg border-2 border-dashed border-zinc-200/90 bg-zinc-50/90 ${RAIL_CARD_SHADOW}`;
