import { getToken } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

// Module-level cache so it persists across re-renders and component mounts
const tickerCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

async function fetchTokenTicker(tokenId: string): Promise<string> {
  if (tickerCache.has(tokenId)) {
    return tickerCache.get(tokenId)!;
  }
  if (pendingFetches.has(tokenId)) {
    return pendingFetches.get(tokenId)!;
  }

  const promise = getToken(tokenId)
    .then((token) => {
      const ticker =
        token.ticker || token.name || tokenId.slice(0, 6).toUpperCase();
      tickerCache.set(tokenId, ticker);
      return ticker;
    })
    .catch(() => {
      // On error, cache short ID so we don't retry endlessly
      const fallback = tokenId.slice(0, 6).toUpperCase();
      tickerCache.set(tokenId, fallback);
      return fallback;
    })
    .finally(() => {
      pendingFetches.delete(tokenId);
    });

  pendingFetches.set(tokenId, promise);
  return promise;
}

/**
 * Batch-fetch and cache token tickers for a list of token IDs.
 * Returns a Map<tokenId, ticker>.
 * If the trade already has token_ticker set, we skip the fetch.
 */
export function useTokenTickers(tokenIds: string[]): Map<string, string> {
  const [tickers, setTickers] = useState<Map<string, string>>(new Map());
  const fetchedRef = useRef<Set<string>>(new Set());

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional join-based key
  useEffect(() => {
    const unique = [...new Set(tokenIds.filter(Boolean))];

    if (unique.length === 0) return;

    const toFetch = unique.filter((id) => !tickerCache.has(id));

    if (toFetch.length === 0) {
      const result = new Map<string, string>();
      for (const id of unique) {
        const cached = tickerCache.get(id);
        if (cached) result.set(id, cached);
      }
      setTickers(result);
      return;
    }

    const newlyFetching = toFetch.filter((id) => !fetchedRef.current.has(id));
    for (const id of newlyFetching) fetchedRef.current.add(id);

    Promise.all(
      unique.map(async (id) => {
        const ticker = await fetchTokenTicker(id);
        return [id, ticker] as [string, string];
      }),
    ).then((entries) => {
      setTickers(new Map(entries));
    });
  }, [tokenIds.join(",")]);

  return tickers;
}
