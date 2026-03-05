// VALHALLA SCAN - Number formatters and utilities

const SATS_PER_BTC = 1e8;

/**
 * Convert satoshis to BTC
 */
export function satsToBTC(sats: number): number {
  return sats / SATS_PER_BTC;
}

/**
 * Format BTC amount (from sats) to a readable string
 */
export function formatBTC(
  sats: number | undefined | null,
  decimals = 8,
): string {
  if (sats === undefined || sats === null) return "—";
  const btc = sats / SATS_PER_BTC;
  if (btc === 0) return "0 BTC";
  if (btc < 0.00000001) return "<0.00000001 BTC";
  if (btc < 0.001) return `${btc.toFixed(8)} BTC`;
  if (btc < 1) return `${btc.toFixed(6)} BTC`;
  return `${btc.toFixed(decimals)} BTC`;
}

/**
 * Format BTC number without unit suffix
 */
export function formatBTCRaw(
  sats: number | undefined | null,
  decimals = 8,
): string {
  if (sats === undefined || sats === null) return "—";
  const btc = sats / SATS_PER_BTC;
  if (btc === 0) return "0";
  return btc.toFixed(decimals);
}

/**
 * Format large numbers with M/K/B suffixes (for sats values)
 */
export function formatSats(sats: number | undefined | null): string {
  if (sats === undefined || sats === null) return "—";
  if (sats >= 1e11) return `${(sats / 1e11).toFixed(2)}K BTC`;
  if (sats >= 1e8) return `${(sats / 1e8).toFixed(4)} BTC`;
  if (sats >= 1e6) return `${(sats / 1e6).toFixed(2)}M sats`;
  if (sats >= 1e3) return `${(sats / 1e3).toFixed(2)}K sats`;
  return `${sats} sats`;
}

/**
 * Format market cap / volume (in sats) to display-friendly format
 */
export function formatMarketCap(sats: number | undefined | null): string {
  if (sats === undefined || sats === null) return "—";
  const btc = sats / SATS_PER_BTC;
  if (btc >= 1000) return `${(btc / 1000).toFixed(2)}K BTC`;
  if (btc >= 1) return `${btc.toFixed(4)} BTC`;
  if (btc >= 0.001) return `${btc.toFixed(6)} BTC`;
  return `${sats.toLocaleString()} sats`;
}

/**
 * Format price in sats to BTC with appropriate precision
 */
export function formatPrice(sats: number | undefined | null): string {
  if (sats === undefined || sats === null) return "—";
  const btc = sats / SATS_PER_BTC;
  if (btc === 0) return "0";
  if (btc < 0.000000001) return `${sats} sats`;
  if (btc < 0.00001) return btc.toExponential(4);
  if (btc < 0.001) return btc.toFixed(8);
  return btc.toFixed(6);
}

/**
 * Format percentage change with + sign for positive
 */
export function formatPct(pct: number | undefined | null): string {
  if (pct === undefined || pct === null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Get CSS class for positive/negative/neutral change
 */
export function pctColor(pct: number | undefined | null): string {
  if (pct === undefined || pct === null) return "text-muted-foreground";
  if (pct > 0) return "text-neon-green";
  if (pct < 0) return "text-neon-red";
  return "text-muted-foreground";
}

/**
 * Format large numbers with M/K/B for display
 */
export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

/**
 * Format a timestamp to relative time ago
 */
export function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return "—";
  }
}

/**
 * Truncate a principal/address for display
 */
export function truncatePrincipal(
  principal: string | undefined | null,
  chars = 8,
): string {
  if (!principal) return "—";
  if (principal.length <= chars * 2 + 3) return principal;
  return `${principal.slice(0, chars)}...${principal.slice(-chars)}`;
}

/**
 * Format date to locale string
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Format USD amount with compact notation
 */
export function formatUSD(usd: number | undefined | null): string {
  if (usd === undefined || usd === null) return "";
  if (usd < 0.01) return "<$0.01";
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(2)}K`;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(4)}`;
}

/**
 * Convert satoshis to USD given current BTC price
 */
export function satsToUSD(sats: number, btcPriceUSD: number): number {
  return (sats / 1e8) * btcPriceUSD;
}

/**
 * Format satoshi amount as BTC with USD equivalent on separate line
 */
export function formatBTCWithUSD(
  sats: number | undefined | null,
  btcPriceUSD: number | null,
): { btc: string; usd: string } {
  const btcStr = formatBTC(sats);
  if (btcStr === "—" || sats === undefined || sats === null || sats === 0)
    return { btc: btcStr, usd: "" };
  if (btcPriceUSD === null) return { btc: btcStr, usd: "" };
  const usdVal = satsToUSD(sats, btcPriceUSD);
  return { btc: btcStr, usd: formatUSD(usdVal) };
}

/**
 * Format market cap in USD
 */
export function formatMarketCapUSD(
  sats: number | undefined | null,
  btcPriceUSD: number | null,
): string {
  if (sats === undefined || sats === null || btcPriceUSD === null) return "";
  const usd = satsToUSD(sats, btcPriceUSD);
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(2)}K`;
  return `$${usd.toFixed(2)}`;
}
