// VALHALLA SCAN - Number formatters and utilities

const SATS_PER_BTC = 1e8;

/**
 * Odin.fun stores token price as milli-satoshi (1/1000 of a satoshi).
 * Divide by 1000 to get the true satoshi value shown on Odin.fun.
 */
export function priceToSats(rawPrice: number | undefined | null): number {
  if (rawPrice === undefined || rawPrice === null) return 0;
  return rawPrice / 1000;
}

/**
 * Convert satoshis to BTC
 */
export function satsToBTC(sats: number): number {
  return sats / SATS_PER_BTC;
}

/**
 * Format amount in satoshis to a readable string.
 * Always uses satoshi (sats) as the unit — matching Odin.fun.
 * 1 Satoshi = 0.00000001 BTC.
 * Uses compact K/M notation for large sats values.
 */
export function formatBTC(
  sats: number | undefined | null,
  _decimals = 8,
): string {
  if (sats === undefined || sats === null) return "—";
  if (sats === 0) return "0 sats";
  // Always display in sats — compact for large numbers
  if (sats >= 1_000_000_000)
    return `${(sats / 1_000_000_000).toFixed(2)}B sats`;
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M sats`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(2)}K sats`;
  return `${sats.toLocaleString("en-US")} sats`;
}

/**
 * Format BTC number without unit suffix (kept for internal use)
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
 * Format large numbers with compact sats notation
 */
export function formatSats(sats: number | undefined | null): string {
  if (sats === undefined || sats === null) return "—";
  if (sats >= 1_000_000_000)
    return `${(sats / 1_000_000_000).toFixed(2)}B sats`;
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M sats`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(2)}K sats`;
  return `${sats} sats`;
}

/**
 * Format market cap / volume (in sats) to display-friendly sats format
 */
export function formatMarketCap(sats: number | undefined | null): string {
  if (sats === undefined || sats === null) return "—";
  if (sats >= 1_000_000_000)
    return `${(sats / 1_000_000_000).toFixed(2)}B sats`;
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M sats`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(2)}K sats`;
  return `${sats.toLocaleString("en-US")} sats`;
}

/**
 * Format token price in sats (per token)
 * Odin.fun stores price as milli-satoshi — divide by 1000 first.
 * Always shown in sats to match Odin.fun display.
 */
export function formatPrice(rawPrice: number | undefined | null): string {
  if (rawPrice === undefined || rawPrice === null) return "—";
  if (rawPrice === 0) return "0 sats";
  const sats = rawPrice / 1000;
  // Very small fractional sats — show with decimal precision
  if (sats < 1) return `${sats.toFixed(6)} sats`;
  if (sats < 1_000)
    return `${sats.toLocaleString("en-US", { maximumFractionDigits: 4 })} sats`;
  if (sats < 1_000_000) return `${(sats / 1_000).toFixed(2)}K sats`;
  return `${(sats / 1_000_000).toFixed(2)}M sats`;
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
