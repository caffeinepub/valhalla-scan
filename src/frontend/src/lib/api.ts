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

export interface Trade {
  id: string;
  token_id: string;
  token_name?: string;
  token_ticker?: string;
  user: string;
  type: "buy" | "sell";
  btc_amount: number;
  token_amount: number;
  price: number;
  time: string;
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
  return apiFetch<TokensResponse>(
    "/tokens",
    params as Record<string, string | number | boolean>,
  );
}

export async function getToken(id: string): Promise<Token> {
  return apiFetch<Token>(`/token/${id}`);
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
  if (Array.isArray(result)) return result;
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    Array.isArray(result.data)
  )
    return result.data;
  return [];
}

export async function getTokenTrades(
  id: string,
  params?: { limit?: number; page?: number },
): Promise<TradesResponse> {
  return apiFetch<TradesResponse>(
    `/token/${id}/trades`,
    params as Record<string, string | number | boolean>,
  );
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
  return apiFetch<TradesResponse>(
    "/trades",
    params as Record<string, string | number | boolean>,
  );
}

export async function getUser(id: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/user/${id}`);
}

export async function getUserStats(id: string): Promise<UserStats> {
  return apiFetch<UserStats>(`/user/${id}/stats`);
}

export async function getUserBalances(
  id: string,
): Promise<UserBalancesResponse> {
  return apiFetch<UserBalancesResponse>(`/user/${id}/balances`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/statistics/dashboard");
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
