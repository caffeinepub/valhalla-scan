// VALHALLA SCAN - Odin.fun API Client
// Base URL for all API calls
const BASE_URL = "https://api.odin.fun/v1";

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// --- Types ---

export interface Token {
  id: string;
  name: string;
  ticker: string;
  description?: string;
  price: number;
  marketcap: number;
  volume: number;
  holders: number;
  txn_count?: number;
  price_delta_5m?: number;
  price_delta_1h?: number;
  price_delta_6h?: number;
  price_delta_1d?: number;
  bonded?: boolean;
  has_twitter?: boolean;
  twitter?: string;
  telegram?: string;
  website?: string;
  created_time?: string;
  creator?: string;
}

export interface TokensResponse {
  data: Token[];
  count: number;
  page: number;
}

// Raw trade shape from Odin.fun API
interface RawTrade {
  id: string;
  token: string;
  user: string;
  time: string;
  buy: boolean;
  amount_btc: number;
  amount_token: number;
  price: number;
  bonded?: boolean;
  user_username?: string;
  user_image?: string;
  // token detail fields may be present in some endpoints
  token_name?: string;
  token_ticker?: string;
}

// Normalized trade shape used across the app
export interface Trade {
  id: string;
  token_id: string;
  token_name?: string;
  token_ticker?: string;
  user: string;
  user_username?: string;
  user_image?: string;
  type: "buy" | "sell";
  btc_amount: number;
  token_amount: number;
  price: number;
  time: string;
}

function normalizeTrade(r: RawTrade): Trade {
  return {
    id: r.id,
    token_id: r.token,
    token_name: r.token_name,
    token_ticker: r.token_ticker,
    user: r.user,
    user_username: r.user_username,
    user_image: r.user_image,
    type: r.buy ? "buy" : "sell",
    // amount_btc from API is in milli-satoshi — divide by 1000 to get sats
    btc_amount: r.amount_btc != null ? r.amount_btc / 1000 : r.amount_btc,
    token_amount: r.amount_token,
    price: r.price,
    time: r.time,
  };
}

// token.marketcap and token.volume are also stored as milli-satoshi
function normalizeToken(t: Token): Token {
  return {
    ...t,
    // price is left as-is (milli-satoshi) — formatPrice() handles the /1000 internally
    marketcap: t.marketcap != null ? t.marketcap / 1000 : t.marketcap,
    volume: t.volume != null ? t.volume / 1000 : t.volume,
  };
}

export interface TradesResponse {
  data: Trade[];
  count: number;
}

export interface TokenHolder {
  user: string;
  balance: number;
  percentage?: number;
}

export interface HoldersResponse {
  data: TokenHolder[];
  count: number;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface CommentsResponse {
  data: Comment[];
  count: number;
}

export interface TVFeedBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface DashboardStats {
  token_count?: number;
  trade_count?: number;
  btc_volume?: number;
  user_count?: number;
}

export interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  created_at?: string;
  btc_balance?: number;
  referral_earnings?: number;
  achievements?: unknown[];
  runes?: number;
}

export interface UserStats {
  trade_count?: number;
  volume?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
}

export interface UserBalance {
  token_id: string;
  token_name?: string;
  token_ticker?: string;
  balance: number;
  value?: number;
  unrealized_pnl?: number;
}

export interface UserBalancesResponse {
  data: UserBalance[];
  count: number;
}

export interface SearchResult {
  tokens?: Token[];
  users?: UserProfile[];
}

// --- API Functions ---

export async function getTokens(params?: {
  limit?: number;
  page?: number;
  sort?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_marketcap?: number;
  max_marketcap?: number;
  min_holders?: number;
  max_holders?: number;
  bonded?: boolean;
  has_twitter?: boolean;
}): Promise<TokensResponse> {
  const raw = await apiFetch<TokensResponse>(
    "/tokens",
    params as Record<string, string | number | boolean>,
  );
  return {
    ...raw,
    data: (raw.data || []).map(normalizeToken),
  };
}

export async function getToken(id: string): Promise<Token> {
  const raw = await apiFetch<Token>(`/token/${id}`);
  return normalizeToken(raw);
}

export async function getTokenTvFeed(
  id: string,
  resolution = "60",
): Promise<TVFeedBar[]> {
  const result = await apiFetch<{ data?: TVFeedBar[] } | TVFeedBar[]>(
    `/token/${id}/tv_feed`,
    { resolution },
  );
  // Handle both array and wrapped response
  let bars: TVFeedBar[];
  if (Array.isArray(result)) {
    bars = result;
  } else if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    Array.isArray(result.data)
  ) {
    bars = result.data;
  } else {
    bars = [];
  }
  // TV feed OHLC prices are also stored in milli-satoshi — divide by 1000
  return bars.map((bar) => ({
    ...bar,
    open: bar.open != null ? bar.open / 1000 : bar.open,
    high: bar.high != null ? bar.high / 1000 : bar.high,
    low: bar.low != null ? bar.low / 1000 : bar.low,
    close: bar.close != null ? bar.close / 1000 : bar.close,
  }));
}

export async function getTokenTrades(
  id: string,
  params?: { limit?: number; page?: number },
): Promise<TradesResponse> {
  const raw = await apiFetch<{ data: RawTrade[]; count: number }>(
    `/token/${id}/trades`,
    params as Record<string, string | number | boolean>,
  );
  return { data: (raw.data || []).map(normalizeTrade), count: raw.count };
}

export async function getTokenOwners(
  id: string,
  params?: { limit?: number; page?: number },
): Promise<HoldersResponse> {
  return apiFetch<HoldersResponse>(
    `/token/${id}/owners`,
    params as Record<string, string | number | boolean>,
  );
}

export async function getTokenComments(
  id: string,
  params?: { limit?: number; page?: number },
): Promise<CommentsResponse> {
  return apiFetch<CommentsResponse>(
    `/token/${id}/comments`,
    params as Record<string, string | number | boolean>,
  );
}

export async function getRecentTrades(params?: {
  limit?: number;
  sort?: string;
  min_btc?: number;
}): Promise<TradesResponse> {
  const raw = await apiFetch<{ data: RawTrade[]; count: number }>(
    "/trades",
    params as Record<string, string | number | boolean>,
  );
  return { data: (raw.data || []).map(normalizeTrade), count: raw.count };
}

export async function getUser(id: string): Promise<UserProfile> {
  const raw = await apiFetch<UserProfile>(`/user/${id}`);
  return {
    ...raw,
    // btc_balance and referral_earnings are stored as milli-satoshi
    btc_balance:
      raw.btc_balance != null ? raw.btc_balance / 1000 : raw.btc_balance,
    referral_earnings:
      raw.referral_earnings != null
        ? raw.referral_earnings / 1000
        : raw.referral_earnings,
  };
}

export async function getUserStats(id: string): Promise<UserStats> {
  const raw = await apiFetch<UserStats>(`/user/${id}/stats`);
  return {
    ...raw,
    // volume and P&L fields are stored as milli-satoshi
    volume: raw.volume != null ? raw.volume / 1000 : raw.volume,
    realized_pnl:
      raw.realized_pnl != null ? raw.realized_pnl / 1000 : raw.realized_pnl,
    unrealized_pnl:
      raw.unrealized_pnl != null
        ? raw.unrealized_pnl / 1000
        : raw.unrealized_pnl,
  };
}

export async function getUserBalances(
  id: string,
): Promise<UserBalancesResponse> {
  const raw = await apiFetch<UserBalancesResponse>(`/user/${id}/balances`);
  return {
    ...raw,
    data: (raw.data || []).map((b) => ({
      ...b,
      // value and unrealized_pnl are stored as milli-satoshi
      value: b.value != null ? b.value / 1000 : b.value,
      unrealized_pnl:
        b.unrealized_pnl != null ? b.unrealized_pnl / 1000 : b.unrealized_pnl,
    })),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const raw = await apiFetch<DashboardStats>("/statistics/dashboard");
  return {
    ...raw,
    // btc_volume is stored as milli-satoshi
    btc_volume: raw.btc_volume != null ? raw.btc_volume / 1000 : raw.btc_volume,
  };
}

export async function searchOdin(query: string): Promise<SearchResult> {
  return apiFetch<SearchResult>("/search", { q: query });
}

// --- Image URLs ---
export function getTokenImageUrl(id: string): string {
  return `${BASE_URL}/token/${id}/image`;
}

export function getUserImageUrl(id: string): string {
  return `${BASE_URL}/user/${id}/image`;
}
