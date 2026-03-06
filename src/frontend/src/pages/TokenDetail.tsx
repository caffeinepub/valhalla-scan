import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBtcPrice } from "@/hooks/use-btc-price";
import { useUserNames } from "@/hooks/use-user-names";
import {
  type Comment,
  type TVFeedBar,
  type Token,
  type TokenHolder,
  type Trade,
  getToken,
  getTokenComments,
  getTokenImageUrl,
  getTokenOwners,
  getTokenTrades,
  getTokenTvFeed,
} from "@/lib/api";
import {
  formatBTC,
  formatBTCWithUSD,
  formatDate,
  formatMarketCap,
  formatMarketCapUSD,
  formatNumber,
  formatPct,
  formatPrice,
  formatUSD,
  pctColor,
  priceToSats,
  satsToUSD,
  timeAgo,
  truncatePrincipal,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Bitcoin,
  ChevronLeft,
  Globe,
  MessageSquare,
  Send,
  TrendingDown,
  TrendingUp,
  Twitter,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Resolution = "1" | "5" | "15" | "60" | "240" | "D";

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "1", label: "1m" },
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1h" },
  { value: "240", label: "4h" },
  { value: "D", label: "1D" },
];

function PriceChart({ tokenId }: { tokenId: string }) {
  const [resolution, setResolution] = useState<Resolution>("60");
  const [data, setData] = useState<TVFeedBar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChart = useCallback(async () => {
    setLoading(true);
    try {
      const bars = await getTokenTvFeed(tokenId, resolution);
      setData(bars || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tokenId, resolution]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  // Keep price values in sats (raw) for chart display
  const chartData = data.map((bar) => ({
    time: new Date(bar.time * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    close: bar.close,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    volume: bar.volume || 0,
  }));

  const isPositive =
    chartData.length >= 2
      ? (chartData[chartData.length - 1]?.close ?? 0) >=
        (chartData[0]?.close ?? 0)
      : true;

  const strokeColor = isPositive
    ? "oklch(0.72 0.18 145)"
    : "oklch(0.65 0.22 25)";
  const gradientId = `priceGradient-${tokenId}`;

  return (
    <div
      data-ocid="token.chart.panel"
      className="bg-card border border-border rounded-sm overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-neon-gold" />
          <span className="font-display font-semibold text-sm text-neon-gold/80">
            PRICE CHART
          </span>
        </div>
        <Select
          value={resolution}
          onValueChange={(v) => setResolution(v as Resolution)}
        >
          <SelectTrigger className="w-20 h-7 text-xs font-mono border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESOLUTIONS.map((r) => (
              <SelectItem
                key={r.value}
                value={r.value}
                className="text-xs font-mono"
              >
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="p-3 h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div data-ocid="token.chart.loading_state">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-mono text-muted-foreground">
              No chart data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.025 35)"
              />
              <XAxis
                dataKey="time"
                tick={{
                  fontSize: 9,
                  fill: "oklch(0.55 0.025 50)",
                  fontFamily: "JetBrains Mono",
                }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 9,
                  fill: "oklch(0.55 0.025 50)",
                  fontFamily: "JetBrains Mono",
                }}
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(v: number) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
                  return `${v}`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.13 0.018 265)",
                  border: "1px solid oklch(0.22 0.02 265)",
                  borderRadius: "2px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "oklch(0.92 0.015 250)" }}
                itemStyle={{ color: strokeColor }}
                formatter={(value: number) => [formatPrice(value), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function TokenDetail() {
  const { id } = useParams({ from: "/token/$id" });
  const btcPrice = useBtcPrice();
  const [token, setToken] = useState<Token | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradesPage, setTradesPage] = useState(1);
  const [activeTab, setActiveTab] = useState("trades");

  const fetchToken = useCallback(async () => {
    try {
      const data = await getToken(id);
      setToken(data);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTrades = useCallback(async () => {
    try {
      const result = await getTokenTrades(id, { limit: 20, page: tradesPage });
      setTrades(result.data || []);
    } catch {
      setTrades([]);
    }
  }, [id, tradesPage]);

  const fetchHolders = useCallback(async () => {
    try {
      const result = await getTokenOwners(id, { limit: 20 });
      setHolders(result.data || []);
    } catch {
      setHolders([]);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const result = await getTokenComments(id, { limit: 20 });
      setComments(result.data || []);
    } catch {
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    fetchToken();
    fetchTrades();
    fetchHolders();
    fetchComments();
  }, [fetchToken, fetchTrades, fetchHolders, fetchComments]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tradesPage is a trigger, not a dep of fetchTrades
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades, tradesPage]);

  const tradeUserIds = useMemo(
    () => trades.map((t) => t.user).filter(Boolean),
    [trades],
  );
  const tradeUserNames = useUserNames(tradeUserIds);
  const holderUserIds = useMemo(
    () => holders.map((h) => h.user).filter(Boolean),
    [holders],
  );
  const holderUserNames = useUserNames(holderUserIds);
  const commentUserIds = useMemo(
    () => comments.map((c) => c.user).filter(Boolean),
    [comments],
  );
  const commentUserNames = useUserNames(commentUserIds);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-4 md:p-6">
        <div data-ocid="token.error_state" className="text-center py-12">
          <p className="text-muted-foreground font-mono">Token not found</p>
          <Link
            to="/screener"
            search={{ q: undefined }}
            className="text-neon-gold hover:underline text-sm font-mono mt-2 inline-block"
          >
            ← Back to Screener
          </Link>
        </div>
      </div>
    );
  }

  const change1d = token.price_delta_1d ?? 0;
  const isPositive = change1d >= 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Back navigation */}
      <Link
        to="/screener"
        search={{ q: undefined }}
        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-neon-gold transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        SCREENER
      </Link>

      {/* Token header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card border border-border rounded-sm p-4"
      >
        <div className="flex flex-wrap items-start gap-4">
          {/* Left: Avatar + name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-sm">
              <AvatarImage src={getTokenImageUrl(id)} alt={token.name} />
              <AvatarFallback className="rounded-sm text-lg font-mono bg-muted">
                {token.ticker?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                {token.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm text-muted-foreground">
                  ${token.ticker}
                </span>
                {token.bonded && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-neon-gold/50 text-neon-gold"
                  >
                    BONDED
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Center: Price */}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-2xl font-bold text-neon-gold stat-value-glow">
              {formatPrice(token.price)}
            </div>
            {btcPrice && token.price && (
              <div className="font-mono text-sm text-muted-foreground mt-0.5">
                ≈ {formatUSD(satsToUSD(priceToSats(token.price), btcPrice))}
              </div>
            )}
            <div
              className={cn(
                "flex items-center gap-1 mt-0.5 font-mono text-sm font-medium",
                pctColor(change1d),
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {formatPct(change1d)} 24H
            </div>
          </div>

          {/* Right: Social links */}
          <div className="flex items-center gap-2">
            {token.twitter && (
              <a
                href={token.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-sm bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {token.telegram && (
              <a
                href={token.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-sm bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Send className="h-4 w-4" />
              </a>
            )}
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-sm bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              MARKET CAP
            </div>
            <div className="font-mono text-sm font-medium text-foreground mt-0.5">
              {formatMarketCap(token.marketcap)}
            </div>
            {btcPrice && token.marketcap && (
              <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                {formatMarketCapUSD(token.marketcap, btcPrice)}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              VOLUME 24H
            </div>
            <div className="font-mono text-sm font-medium text-foreground mt-0.5">
              {formatMarketCap(token.volume)}
            </div>
            {btcPrice && token.volume && (
              <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                {formatMarketCapUSD(token.volume, btcPrice)}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              HOLDERS
            </div>
            <div className="font-mono text-sm font-medium text-foreground mt-0.5 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {formatNumber(token.holders)}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              TRANSACTIONS
            </div>
            <div className="font-mono text-sm font-medium text-foreground mt-0.5">
              {formatNumber(token.txn_count)}
            </div>
          </div>
        </div>

        {/* Change row */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: "5M", val: token.price_delta_5m },
            { label: "1H", val: token.price_delta_1h },
            { label: "6H", val: token.price_delta_6h },
            { label: "1D", val: token.price_delta_1d },
          ].map(({ label, val }) => (
            <div key={label} className="bg-muted/30 rounded-sm p-2 text-center">
              <div className="text-[10px] font-mono text-muted-foreground">
                {label}
              </div>
              <div className={cn("font-mono text-sm font-bold", pctColor(val))}>
                {formatPct(val)}
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        {token.description && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {token.description}
          </p>
        )}
      </motion.div>

      {/* Chart */}
      <PriceChart tokenId={id} />

      {/* Tabs: Trades / Holders / Comments */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-sm overflow-hidden"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger
              value="trades"
              data-ocid="token.trades.tab"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-gold data-[state=active]:text-neon-gold font-mono text-xs py-3 text-muted-foreground"
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              TRADES
            </TabsTrigger>
            <TabsTrigger
              value="holders"
              data-ocid="token.holders.tab"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-gold data-[state=active]:text-neon-gold font-mono text-xs py-3 text-muted-foreground"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              HOLDERS
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              data-ocid="token.comments.tab"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-gold data-[state=active]:text-neon-gold font-mono text-xs py-3 text-muted-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              COMMENTS
            </TabsTrigger>
          </TabsList>

          {/* Trades */}
          <TabsContent value="trades" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs">TYPE</TableHead>
                  <TableHead className="font-mono text-xs">
                    AMOUNT (SATS)
                  </TableHead>
                  <TableHead className="font-mono text-xs hidden sm:table-cell">
                    TOKENS
                  </TableHead>
                  <TableHead className="font-mono text-xs hidden md:table-cell">
                    PRICE
                  </TableHead>
                  <TableHead className="font-mono text-xs hidden sm:table-cell">
                    USER
                  </TableHead>
                  <TableHead className="font-mono text-xs text-right">
                    TIME
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, i) => {
                  const isBuy = trade.type === "buy";
                  return (
                    <TableRow
                      key={trade.id || i}
                      className={cn(
                        "border-border/50",
                        isBuy ? "hover:bg-neon-green/5" : "hover:bg-neon-red/5",
                      )}
                      data-ocid={`token.trades.item.${i + 1}`}
                    >
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0 h-5 border-0",
                            isBuy
                              ? "bg-neon-green/15 text-neon-green"
                              : "bg-neon-red/15 text-neon-red",
                          )}
                        >
                          {isBuy ? "BUY" : "SELL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        <div>{formatBTC(trade.btc_amount)}</div>
                        {btcPrice && trade.btc_amount ? (
                          <div className="text-[10px] text-muted-foreground/55">
                            {formatBTCWithUSD(trade.btc_amount, btcPrice).usd}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell">
                        {formatNumber(trade.token_amount)}
                      </TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">
                        {formatPrice(trade.price)}
                      </TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell text-muted-foreground">
                        {trade.user_username ||
                          tradeUserNames.get(trade.user) ||
                          truncatePrincipal(trade.user, 6)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right text-muted-foreground">
                        {timeAgo(trade.time)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {trades.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground font-mono text-sm"
                    >
                      No trades yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {trades.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs font-mono text-muted-foreground">
                  Page {tradesPage}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={tradesPage === 1}
                    onClick={() => setTradesPage(tradesPage - 1)}
                    className="h-7 px-2 text-xs font-mono border-border"
                  >
                    ← PREV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTradesPage(tradesPage + 1)}
                    className="h-7 px-2 text-xs font-mono border-border"
                  >
                    NEXT →
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Holders */}
          <TabsContent value="holders" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs">#</TableHead>
                  <TableHead className="font-mono text-xs">USER</TableHead>
                  <TableHead className="font-mono text-xs text-right">
                    BALANCE
                  </TableHead>
                  <TableHead className="font-mono text-xs text-right hidden sm:table-cell">
                    SHARE
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holders.map((holder, i) => (
                  <TableRow
                    key={holder.user || i}
                    className="border-border/50"
                    data-ocid={`token.holders.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {holderUserNames.get(holder.user) ??
                        truncatePrincipal(holder.user, 10)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right">
                      {formatNumber(holder.balance)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-right hidden sm:table-cell text-neon-gold">
                      {holder.percentage !== undefined
                        ? `${holder.percentage.toFixed(2)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {holders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground font-mono text-sm"
                    >
                      No holders data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="mt-0">
            <ScrollArea className="h-96">
              <div className="divide-y divide-border/50">
                {comments.map((comment, i) => (
                  <div
                    key={comment.id || i}
                    data-ocid={`token.comments.item.${i + 1}`}
                    className="px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-neon-gold">
                        {commentUserNames.get(comment.user) ??
                          truncatePrincipal(comment.user, 6)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {timeAgo(comment.time)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.text}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground font-mono">
                      No comments yet
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
