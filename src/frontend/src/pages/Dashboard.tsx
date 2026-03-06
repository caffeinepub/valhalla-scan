import { TokenRow } from "@/components/TokenRow";
import { TradeFeedItem } from "@/components/TradeFeedItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useBtcPrice } from "@/hooks/use-btc-price";
import { useUserNames } from "@/hooks/use-user-names";
import { type Token, type Trade, getRecentTrades, getTokens } from "@/lib/api";

import { useTokenTickers } from "@/hooks/use-token-tickers";
import { Activity, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

export function Dashboard() {
  const btcPrice = useBtcPrice();
  const [gainers, setGainers] = useState<Token[]>([]);
  const [losers, setLosers] = useState<Token[]>([]);
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(true);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      const [gainersData, losersData, recentData] = await Promise.all([
        getTokens({ limit: 10, sort: "price_delta_1h:desc" }).catch(() => ({
          data: [],
          count: 0,
          page: 1,
        })),
        getTokens({ limit: 10, sort: "price_delta_1h:asc" }).catch(() => ({
          data: [],
          count: 0,
          page: 1,
        })),
        getTokens({ limit: 8, sort: "created_time:desc" }).catch(() => ({
          data: [],
          count: 0,
          page: 1,
        })),
      ]);
      setGainers(gainersData.data || []);
      setLosers(losersData.data || []);
      setRecentTokens(recentData.data || []);
    } catch {
      // silently fail - keep old data
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const tradesData = await getRecentTrades({
        limit: 30,
        sort: "time:desc",
      });
      setLiveTrades(tradesData.data || []);
    } catch {
      // silently fail
    } finally {
      setTradesLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    fetchData();
    fetchTrades();
    refreshRef.current = setInterval(fetchTrades, 8000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, []);

  const liveTradeUserIds = useMemo(
    () => liveTrades.map((t) => t.user).filter(Boolean),
    [liveTrades],
  );
  const liveTradeUserNames = useUserNames(liveTradeUserIds);

  // Fetch tickers for trades missing token_ticker
  const missingTickerIds = useMemo(
    () =>
      liveTrades
        .filter((t) => !t.token_ticker)
        .map((t) => t.token_id)
        .filter(Boolean),
    [liveTrades],
  );
  const liveTokenTickers = useTokenTickers(missingTickerIds);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-4xl font-bold gold-gradient-text diamond-accent tracking-tight leading-none">
            VALHALLA SCAN
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green" />
          </span>
          <span className="text-xs font-mono text-neon-green">LIVE</span>
        </div>
      </motion.div>

      {/* Hero logo banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col items-center justify-center py-8 rounded-sm overflow-hidden relative"
        style={{
          background: "#050505",
          border: "1px solid oklch(0.55 0.18 45 / 0.6)",
          boxShadow:
            "0 0 40px oklch(0.55 0.22 45 / 0.25), 0 0 80px oklch(0.40 0.18 35 / 0.12), inset 0 0 60px oklch(0.20 0.12 30 / 0.15)",
        }}
      >
        {/* Ambient fire glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.40 0.22 45 / 0.30) 0%, oklch(0.20 0.15 35 / 0.15) 40%, transparent 70%)",
          }}
        />
        {/* Bottom ember glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, oklch(0.35 0.20 35 / 0.20) 0%, transparent 100%)",
          }}
        />
        {/* Social buttons above the horns */}
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <a
            href="https://x.com/valhallascn"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="hero.twitter.button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: "oklch(0.12 0.02 240 / 0.85)",
              border: "1px solid oklch(0.55 0.02 240 / 0.5)",
              color: "oklch(0.90 0.02 240)",
              boxShadow: "0 0 10px oklch(0.55 0.02 240 / 0.2)",
            }}
          >
            {/* X (Twitter) icon */}
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 fill-current"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>
          <button
            type="button"
            data-ocid="hero.discord.button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all duration-200 hover:scale-105 cursor-default"
            style={{
              background: "oklch(0.12 0.04 270 / 0.85)",
              border: "1px solid oklch(0.45 0.18 270 / 0.5)",
              color: "oklch(0.80 0.10 270)",
              boxShadow: "0 0 10px oklch(0.45 0.18 270 / 0.2)",
            }}
          >
            {/* Discord icon */}
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 fill-current"
              aria-hidden="true"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.011.043.031.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Discord
          </button>
          <a
            href="https://odin.fun/token/2ida"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="hero.valhalla_token.button"
            className="flex items-center px-3 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: "oklch(0.14 0.08 45 / 0.90)",
              border: "1px solid oklch(0.65 0.22 45 / 0.6)",
              color: "oklch(0.90 0.20 50)",
              boxShadow: "0 0 10px oklch(0.60 0.22 45 / 0.3)",
            }}
          >
            VALHALLA TOKEN
          </a>
        </div>
        <img
          src="/assets/generated/valhalla-logo-transparent.png"
          alt="VALHALLA SCAN"
          className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10"
          style={{
            filter:
              "drop-shadow(0 0 24px oklch(0.65 0.25 45 / 0.7)) drop-shadow(0 0 48px oklch(0.50 0.22 35 / 0.40))",
          }}
        />
        <div className="mt-3 flex items-center gap-2 relative z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green" />
          </span>
          <span className="text-xs font-display italic text-neon-gold tracking-widest">
            Valhalla Scan — The Legendary Trading Radar for Warriors
          </span>
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column: Gainers + Losers */}
        <div className="xl:col-span-2 space-y-4">
          {/* Top Gainers */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-card border border-border rounded-sm overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-3 py-2.5 section-header">
              <TrendingUp className="h-3.5 w-3.5 text-neon-green" />
              <h2 className="font-mono font-semibold text-[11px] tracking-[0.15em] text-foreground/90 uppercase">
                Top Gainers
              </h2>
              <span className="text-[9px] font-mono text-muted-foreground/60 ml-1 tracking-widest bg-muted/60 px-1.5 py-0.5 rounded-[2px]">
                1H
              </span>
            </div>
            <div
              data-ocid="dashboard.gainers.table"
              className="divide-y divide-border/50"
            >
              {loading
                ? ["g1", "g2", "g3", "g4", "g5"].map((k) => (
                    <div key={k} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-sm" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : gainers.map((token, i) => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      rank={i + 1}
                      index={i + 1}
                      btcPrice={btcPrice}
                    />
                  ))}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-card border border-border rounded-sm overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-3 py-2.5 section-header">
              <TrendingDown className="h-3.5 w-3.5 text-neon-red" />
              <h2 className="font-mono font-semibold text-[11px] tracking-[0.15em] text-foreground/90 uppercase">
                Top Losers
              </h2>
              <span className="text-[9px] font-mono text-muted-foreground/60 ml-1 tracking-widest bg-muted/60 px-1.5 py-0.5 rounded-[2px]">
                1H
              </span>
            </div>
            <div
              data-ocid="dashboard.losers.table"
              className="divide-y divide-border/50"
            >
              {loading
                ? ["l1", "l2", "l3", "l4", "l5"].map((k) => (
                    <div key={k} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-sm" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : losers.map((token, i) => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      rank={i + 1}
                      index={i + 1}
                      btcPrice={btcPrice}
                    />
                  ))}
            </div>
          </motion.div>

          {/* Recently Created */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-card border border-border rounded-sm overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-3 py-2.5 section-header">
              <Clock className="h-3.5 w-3.5 text-neon-gold" />
              <h2 className="font-mono font-semibold text-[11px] tracking-[0.15em] text-neon-gold/80 uppercase">
                Recently Launched
              </h2>
            </div>
            <div
              data-ocid="dashboard.recent.table"
              className="divide-y divide-border/50"
            >
              {loading
                ? ["r1", "r2", "r3", "r4"].map((k) => (
                    <div key={k} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-sm" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  ))
                : recentTokens.map((token, i) => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      index={i + 1}
                      btcPrice={btcPrice}
                    />
                  ))}
            </div>
          </motion.div>
        </div>

        {/* Right column: Live Feed */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border rounded-sm overflow-hidden flex flex-col h-[600px] xl:h-auto xl:max-h-[900px]"
        >
          <div className="flex items-center justify-between px-3 py-2.5 section-header flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <Activity className="h-3.5 w-3.5 text-neon-gold" />
              <h2 className="font-mono font-semibold text-[11px] tracking-[0.15em] text-neon-gold/80 uppercase">
                Live Trade Feed
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
              </span>
              <span className="text-[10px] font-mono text-neon-green">8s</span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div
              data-ocid="feed.trades.list"
              className="divide-y divide-border/30"
            >
              {tradesLoading
                ? [
                    "t1",
                    "t2",
                    "t3",
                    "t4",
                    "t5",
                    "t6",
                    "t7",
                    "t8",
                    "t9",
                    "t10",
                  ].map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <Skeleton className="h-7 w-7 rounded-sm" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-10" />
                      <div className="flex-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))
                : liveTrades.map((trade, i) => (
                    <TradeFeedItem
                      key={`${trade.id}-${i}`}
                      trade={trade}
                      index={i + 1}
                      userName={liveTradeUserNames.get(trade.user)}
                      btcPrice={btcPrice}
                      resolvedTicker={liveTokenTickers.get(trade.token_id)}
                    />
                  ))}
              {!tradesLoading && liveTrades.length === 0 && (
                <div
                  data-ocid="feed.trades.empty_state"
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground font-mono">
                    No trades yet
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border">
        <p className="text-xs font-mono text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-gold hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
