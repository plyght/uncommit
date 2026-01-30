export const PRICING_TIERS = [
  { versions: 5, price: 15, kofiTier: "basic" },
  { versions: 15, price: 30, kofiTier: "pro" },
  { versions: 50, price: 60, kofiTier: "business" },
] as const;

export function calculatePrice(versionsPerMonth: number): number {
  const tier = PRICING_TIERS.find((t) => versionsPerMonth <= t.versions);
  if (tier) return tier.price;
  
  const highestTier = PRICING_TIERS[PRICING_TIERS.length - 1];
  const extraVersions = versionsPerMonth - highestTier.versions;
  const pricePerVersion = 1.2;
  return highestTier.price + Math.ceil(extraVersions * pricePerVersion);
}

export function getRecommendedTier(versionsPerMonth: number) {
  return PRICING_TIERS.find((t) => versionsPerMonth <= t.versions) ?? PRICING_TIERS[PRICING_TIERS.length - 1];
}
