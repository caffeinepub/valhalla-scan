import { StatCard } from "@/components/StatCard";
import { TokenRow } from "@/components/TokenRow";
import { TradeFeedItem } from "@/components/TradeFeedItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useBtcPrice } from "@/hooks/use-btc-price";
import { useUserNames } from "@/hooks/use-user-names";
import {
  type DashboardStats,
  type Token,
  type Trade,
  getDashboardStats,
  getRecentTrades,
  getTokens,
} from "@/lib/api";
import { formatBTC, formatMarketCapUSD, formatNumber } from "@/lib/formatters";
import {
  Activity,
  Bitcoin,
  Clock,
  Coins,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

export function Dashboard() {
  const btcPrice = useBtcPrice();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gainers, setGainers] = useState<Token[]>([]);
  const [losers, setLosers] = useState<Token[]>([]);
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(true);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      const [statsData, gainersData, losersData, recentData] =
        await Promise.all([
          getDashboardStats().catch(() => ({}) as DashboardStats),
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
      setStats(statsData);
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
          <h1 className="font-display text-3xl font-bold text-foreground diamond-accent tracking-tight leading-none">
            VALHALLA SCAN
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground mt-1.5 tracking-wide">
            Bitcoin Token Intelligence Terminal — powered by odin.fun
          </p>
        </div>
        <div className="flex items-center gap-3">
          {btcPrice && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-sm px-2.5 py-1.5">
              <Bitcoin className="h-3 w-3 text-neon-gold" />
              <span className="text-xs font-mono font-bold text-neon-gold tabular-nums">
                $
                {btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green" />
            </span>
            <span className="text-xs font-mono text-neon-green">LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Tokens"
          value={loading ? "—" : formatNumber(stats?.token_count ?? 0)}
          subValue="on odin.fun"
          icon={<Coins className="h-4 w-4" />}
          delay={0}
        />
        <StatCard
          label="24h Trades"
          value={loading ? "—" : formatNumber(stats?.trade_count ?? 0)}
          subValue="total transactions"
          icon={<Activity className="h-4 w-4" />}
          delay={0.05}
        />
        <StatCard
          label="BTC Volume"
          value={loading ? "—" : formatBTC(stats?.btc_volume)}
          subValue={
            !loading && btcPrice && stats?.btc_volume
              ? formatMarketCapUSD(stats.btc_volume, btcPrice)
              : "24h volume"
          }
          icon={<Bitcoin className="h-4 w-4" />}
          delay={0.1}
        />
        <StatCard
          label="Active Users"
          value={loading ? "—" : formatNumber(stats?.user_count ?? 0)}
          subValue="total wallets"
          icon={<Users className="h-4 w-4" />}
          delay={0.15}
        />
      </div>

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
              <Clock className="h-3.5 w-3.5 text-neon-cyan" />
              <h2 className="font-mono font-semibold text-[11px] tracking-[0.15em] text-foreground/90 uppercase">
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
              <Activity className="h-3.5 w-3.5 text-neon-cyan" />
              <h2 className="font-mono font-semibold text-[11px] tracking-[0.15em] text-foreground/90 uppercase">
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
            className="text-neon-cyan hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
