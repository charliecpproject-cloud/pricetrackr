// Favorites are per exact 容量 (package). A package is "related" when it is not a favorite itself
// but another package of the same product AND the same variation is (for a product without
// variations: the same product). Related is worked out here, never stored.

export type FavoriteLevel = "favorite" | "related" | "none";

/** Packages of one product and one variation share a group key. No variation counts as one group. */
export function favoriteGroupKey(
  productId: string,
  variationId: string | null | undefined
): string {
  return `${productId}:${variationId ?? "-"}`;
}

export function favoriteLevel(
  packageId: string,
  productId: string,
  variationId: string | null | undefined,
  favoriteIds: ReadonlySet<string>,
  favoriteGroups: ReadonlySet<string>
): FavoriteLevel {
  if (favoriteIds.has(packageId)) return "favorite";
  return favoriteGroups.has(favoriteGroupKey(productId, variationId)) ? "related" : "none";
}