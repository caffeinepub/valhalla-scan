import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useUserNames } from "@/hooks/use-user-names";
import { type Trade, getRecentTrades, getTokenImageUrl } from "@/lib/api";
import { formatBTC, formatNumber, timeAgo } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Activity, Filter, TrendingDown, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

const SATS_PER_BTC = 1e8;

export function LiveFeed() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [minBTC, setMinBTC] = useState(0); // in BTC
  const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set());
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchTrades = async (minBTCAmount = 0) => {
    try {
      const result = await getRecentTrades({
        limit: 50,
        sort: "time:desc",
      });
      const allTrades = result.data || [];
      const filtered =
        minBTCAmount > 0
          ? allTrades.filter(
              (t) => (t.btc_amount || 0) >= minBTCAmount * SATS_PER_BTC,
            )
          : allTrades;

      // Detect new trades for animation
      const currentIds = new Set(filtered.map((t) => t.id));
      const newIds = new Set(
        [...currentIds].filter((id) => !prevIdsRef.current.has(id)),
      );
      prevIdsRef.current = currentIds;
      setNewTradeIds(newIds);
      setTrades(filtered);

      // Clear new trade highlights after 2s
      if (newIds.size > 0) {
        setTimeout(() => setNewTradeIds(new Set()), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchTrades is defined in component, minBTC is the real dep
  useEffect(() => {
    fetchTrades(minBTC);
    refreshRef.current = setInterval(() => fetchTrades(minBTC), 5000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [minBTC]);

  const tradeUserIds = useMemo(
    () => trades.map((t) => t.user).filter(Boolean),
    [trades],
  );
  const userNames = useUserNames(tradeUserIds);

  const totalBuyVol = trades
    .filter((t) => t.type === "buy")
    .reduce((acc, t) => acc + (t.btc_amount || 0), 0);
  const totalSellVol = trades
    .filter((t) => t.type === "sell")
    .reduce((acc, t) => acc + (t.btc_amount || 0), 0);
  const buysCount = trades.filter((t) => t.type === "buy").length;
  const sellsCount = trades.filter((t) => t.type === "sell").length;
  const buyPct = trades.length > 0 ? (buysCount / trades.length) * 100 : 50;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-xl font-bold text-foreground diamond-accent">
            LIVE FEED
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Real-time trade stream — refreshes every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green" />
          </span>
          <span className="text-xs font-mono text-neon-green">LIVE</span>
        </div>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-sm p-3">
          <div className="text-[10px] font-mono text-muted-foreground">
            TOTAL TRADES
          </div>
          <div className="font-display font-bold text-lg text-foreground">
            {trades.length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-3">
          <div className="text-[10px] font-mono text-muted-foreground">
            BUY VOL
          </div>
          <div className="font-mono font-bold text-neon-green text-sm">
            {formatBTC(totalBuyVol)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-3">
          <div className="text-[10px] font-mono text-muted-foreground">
            SELL VOL
          </div>
          <div className="font-mono font-bold text-neon-red text-sm">
            {formatBTC(totalSellVol)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5">
            BUY/SELL RATIO
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            <div
              className="bg-neon-green rounded-l-full transition-all"
              style={{ width: `${buyPct}%` }}
            />
            <div
              className="bg-neon-red rounded-r-full transition-all"
              style={{ width: `${100 - buyPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-neon-green">
              {buysCount}B
            </span>
            <span className="text-[10px] font-mono text-neon-red">
              {sellsCount}S
            </span>
          </div>
        </div>
      </div>

      {/* Whale filter */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-neon-cyan" />
          <Label className="text-sm font-mono text-foreground">
            WHALE FILTER
          </Label>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Slider
              data-ocid="feed.whale.input"
              min={0}
              max={1}
              step={0.01}
              value={[minBTC]}
              onValueChange={([val]) => setMinBTC(val)}
              className="w-full"
            />
          </div>
          <div className="text-right min-w-[80px]">
            <div className="font-mono text-sm font-bold text-neon-gold">
              ≥ {minBTC === 0 ? "ALL" : `${minBTC.toFixed(3)} BTC`}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              MIN AMOUNT
            </div>
          </div>
        </div>
      </div>

      {/* Feed list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-sm overflow-hidden"
      >
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/20">
          <div className="w-7 flex-shrink-0" />
          <div className="w-24 text-[10px] font-mono text-muted-foreground">
            TOKEN
          </div>
          <div className="w-16 text-[10px] font-mono text-muted-foreground">
            TYPE
          </div>
          <div className="flex-1 text-[10px] font-mono text-muted-foreground">
            BTC AMOUNT
          </div>
          <div className="hidden sm:block w-24 text-[10px] font-mono text-muted-foreground">
            TOKENS
          </div>
          <div className="hidden md:block text-[10px] font-mono text-muted-foreground w-20">
            USER
          </div>
          <div className="text-[10px] font-mono text-muted-foreground text-right w-16 flex-shrink-0">
            TIME
          </div>
        </div>

        <div data-ocid="feed.trades.list">
          {loading ? (
            ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10"].map(
              (k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40"
                >
                  <Skeleton className="h-7 w-7 rounded-sm flex-shrink-0" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <div className="flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ),
            )
          ) : trades.length === 0 ? (
            <div
              data-ocid="feed.trades.empty_state"
              className="flex flex-col items-center justify-center py-16"
            >
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-mono text-muted-foreground">
                No trades match your filter
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {trades.map((trade, i) => {
                const isBuy = trade.type === "buy";
                const isNew = newTradeIds.has(trade.id);
                return (
                  <motion.div
                    key={trade.id || i}
                    layout
                    initial={
                      isNew
                        ? {
                            opacity: 0,
                            backgroundColor: isBuy
                              ? "oklch(0.72 0.18 145 / 0.15)"
                              : "oklch(0.65 0.22 25 / 0.15)",
                          }
                        : {}
                    }
                    animate={{ opacity: 1, backgroundColor: "transparent" }}
                    transition={{ duration: 0.4 }}
                    data-ocid={`feed.trades.list.item.${i + 1}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 border-b border-border/40",
                      "hover:bg-muted/20 transition-colors",
                      isBuy ? "hover:bg-neon-green/5" : "hover:bg-neon-red/5",
                    )}
                  >
                    {/* Token avatar */}
                    <Link
                      to="/token/$id"
                      params={{ id: trade.token_id }}
                      className="flex-shrink-0"
                    >
                      <Avatar className="h-7 w-7 rounded-sm">
                        <AvatarImage
                          src={getTokenImageUrl(trade.token_id)}
                          alt={trade.token_name}
                        />
                        <AvatarFallback className="rounded-sm bg-muted text-[10px] font-mono">
                          {(trade.token_ticker || "??")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    {/* Token name */}
                    <Link
                      to="/token/$id"
                      params={{ id: trade.token_id }}
                      className="w-24 text-xs font-medium text-foreground hover:text-neon-cyan transition-colors truncate"
                    >
                      {trade.token_ticker ||
                        trade.token_name ||
                        (trade.token_id ?? "").slice(0, 8)}
                    </Link>

                    {/* Buy/Sell badge */}
                    <div className="w-16 flex-shrink-0">
                      <Badge
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0 h-5 border-0",
                          isBuy
                            ? "bg-neon-green/15 text-neon-green"
                            : "bg-neon-red/15 text-neon-red",
                        )}
                      >
                        {isBuy ? (
                          <>
                            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                            BUY
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                            SELL
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* BTC amount */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-xs font-mono font-medium",
                          isBuy ? "text-neon-green" : "text-neon-red",
                        )}
                      >
                        {formatBTC(trade.btc_amount)}
                      </div>
                    </div>

                    {/* Token amount */}
                    <div className="hidden sm:block w-24 text-xs font-mono text-muted-foreground truncate">
                      {formatNumber(trade.token_amount)}
                    </div>

                    {/* User */}
                    <div className="hidden md:block text-[10px] font-mono text-muted-foreground w-20 truncate">
                      {trade.user_username ||
                        userNames.get(trade.user) ||
                        `${(trade.user ?? "").slice(0, 6)}...`}
                    </div>

                    {/* Time */}
                    <div className="text-[10px] font-mono text-muted-foreground text-right w-16 flex-shrink-0">
                      {timeAgo(trade.time)}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
