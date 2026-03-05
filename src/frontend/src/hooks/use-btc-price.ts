// Hook to fetch and cache live BTC price in USD from CoinGecko
import { useEffect, useRef, useState } from "react";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

// Module-level cache so price persists across component mounts
let cachedPrice: number | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60_000; // refresh every 60s
const listeners = new Set<(price: number) => void>();

async function fetchBtcPrice(): Promise<number | null> {
  try {
    const res = await fetch(COINGECKO_URL);
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.bitcoin?.usd;
    if (typeof price === "number" && price > 0) {
      cachedPrice = price;
      lastFetchedAt = Date.now();
      // Notify all listeners
      for (const cb of listeners) cb(price);
      return price;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns live BTC/USD price. Refreshes every 60s.
 * Returns null while loading.
 */
export function useBtcPrice(): number | null {
  const [price, setPrice] = useState<number | null>(cachedPrice);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Register listener for price updates
    listeners.add(setPrice);

    // If cache is fresh, use it immediately
    if (cachedPrice !== null && Date.now() - lastFetchedAt < CACHE_TTL_MS) {
      setPrice(cachedPrice);
    } else {
      // Fetch immediately
      fetchBtcPrice().then((p) => {
        if (p !== null) setPrice(p);
      });
    }

    // Set up periodic refresh
    intervalRef.current = setInterval(() => {
      fetchBtcPrice();
    }, CACHE_TTL_MS);

    return () => {
      listeners.delete(setPrice);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return price;
}
