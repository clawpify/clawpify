function tokenize(input: string): string[] {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function suggestListingSku(
  brandOrVendor: string,
  titleOrModel: string,
  idHint?: string
): string {
  const brandTokens = tokenize(brandOrVendor);
  const titleTokens = tokenize(titleOrModel);
  const brand = brandTokens[0] ?? titleTokens[0] ?? "ITEM";
  const model = titleTokens.find((token) => token !== brand) ?? titleTokens[1] ?? "MODEL";
  const suffix =
    idHint?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-4) || "0001";

  return `${brand.slice(0, 4)}-${model.slice(0, 6)}-${suffix}`;
}
