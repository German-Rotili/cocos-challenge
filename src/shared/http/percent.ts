/** The domain keeps rates as ratios (0.1); the API shows percentages (10), to 2 decimals. */
export function toPercent(ratio: number | null): number | null {
  return ratio == null ? null : Math.round(ratio * 10_000) / 100;
}
