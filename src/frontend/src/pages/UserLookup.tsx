import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBtcPrice } from "@/hooks/use-btc-price";
import {
  type UserBalance,
  type UserProfile,
  type UserStats,
  getTokenImageUrl,
  getUser,
  getUserBalances,
  getUserImageUrl,
  getUserStats,
} from "@/lib/api";
import {
  formatBTC,
  formatBTCWithUSD,
  formatDate,
  formatNumber,
  pctColor,
  truncatePrincipal,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Search, User2, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

// Sample principals to demonstrate
const SAMPLE_PRINCIPALS = [
  "x5573-bqtqw-vmq3e-74ydj-4lz36-yqnpw-5ztzm-27dor-kpetq-2fykm-cqe",
  "rrkah-fqaaa-aaaaa-aaaaq-cai",
];

export function UserLookup() {
  const btcPrice = useBtcPrice();
  const [searchInput, setSearchInput] = useState("");
  const [principal, setPrincipal] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchPrincipal = searchInput.trim()) => {
    if (!searchPrincipal) return;
    setPrincipal(searchPrincipal);
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const [userData, statsData, balancesData] = await Promise.all([
        getUser(searchPrincipal).catch(() => null),
        getUserStats(searchPrincipal).catch(() => null),
        getUserBalances(searchPrincipal).catch(() => ({ data: [], count: 0 })),
      ]);

      if (!userData) {
        setError("User not found. Please check the principal ID.");
        setUser(null);
        setStats(null);
        setBalances([]);
      } else {
        setUser(userData);
        setStats(statsData);
        setBalances(balancesData.data || []);
      }
    } catch {
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-xl font-bold text-foreground diamond-accent">
          USER LOOKUP
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          Search any odin.fun user by their principal ID
        </p>
      </motion.div>

      {/* Search */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="user.search.input"
              className="pl-10 font-mono text-xs bg-muted/40 border-border h-10"
              placeholder="Enter principal ID (e.g. xxxxx-xxxxx-xxx...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            data-ocid="user.search.button"
            onClick={() => handleSearch()}
            disabled={!searchInput.trim() || loading}
            className="h-10 px-4 bg-primary/80 hover:bg-primary font-mono text-xs text-background border-0"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                <Search className="h-3.5 w-3.5 mr-1.5" />
                SEARCH
              </>
            )}
          </Button>
        </div>

        {/* Sample principals */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground">
            EXAMPLES:
          </span>
          {SAMPLE_PRINCIPALS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setSearchInput(p);
                handleSearch(p);
              }}
              className="text-[10px] font-mono text-neon-cyan/70 hover:text-neon-cyan transition-colors truncate max-w-[200px]"
            >
              {truncatePrincipal(p, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div data-ocid="user.loading_state" className="space-y-4">
          <div className="bg-card border border-border rounded-sm p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-sm" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["us1", "us2", "us3"].map((k) => (
              <Skeleton key={k} className="h-20" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          data-ocid="user.error_state"
          className="bg-card border border-neon-red/30 rounded-sm p-4 text-center"
        >
          <p className="text-neon-red font-mono text-sm">{error}</p>
        </div>
      )}

      {/* User profile */}
      {!loading && user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Profile card */}
          <div className="bg-card border border-border rounded-sm p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 rounded-sm">
                <AvatarImage
                  src={getUserImageUrl(principal)}
                  alt={user.username}
                />
                <AvatarFallback className="rounded-sm text-xl font-mono bg-muted">
                  {(user.username || principal).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {user.username || "Anonymous"}
                </h2>
                <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all">
                  {principal}
                </p>
                {user.created_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {formatDate(user.created_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-sm p-3 rune-border">
                <div className="text-[10px] font-mono text-muted-foreground">
                  TOTAL TRADES
                </div>
                <div className="font-display font-bold text-xl text-foreground mt-0.5">
                  {formatNumber(stats.trade_count)}
                </div>
              </div>
              <div className="bg-card border border-border rounded-sm p-3 rune-border">
                <div className="text-[10px] font-mono text-muted-foreground">
                  VOLUME
                </div>
                <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                  {formatBTC(stats.volume)}
                </div>
                {btcPrice && stats.volume ? (
                  <div className="text-[10px] font-mono text-muted-foreground/55 mt-0.5">
                    {formatBTCWithUSD(stats.volume, btcPrice).usd}
                  </div>
                ) : null}
              </div>
              <div className="bg-card border border-border rounded-sm p-3 rune-border">
                <div className="text-[10px] font-mono text-muted-foreground">
                  REALIZED P&L
                </div>
                <div
                  className={cn(
                    "font-mono font-bold text-sm mt-0.5",
                    (stats.realized_pnl ?? 0) >= 0
                      ? "text-neon-green"
                      : "text-neon-red",
                  )}
                >
                  {formatBTC(stats.realized_pnl)}
                </div>
                {btcPrice && stats.realized_pnl ? (
                  <div className="text-[10px] font-mono text-muted-foreground/55 mt-0.5">
                    {formatBTCWithUSD(stats.realized_pnl, btcPrice).usd}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Holdings */}
          {balances.length > 0 && (
            <div className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <Wallet className="h-4 w-4 text-neon-cyan" />
                <h3 className="font-display font-semibold text-sm text-foreground">
                  HOLDINGS
                </h3>
                <Badge className="text-[10px] bg-muted text-muted-foreground">
                  {balances.length}
                </Badge>
              </div>
              <Table data-ocid="user.holdings.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-mono text-xs">TOKEN</TableHead>
                    <TableHead className="font-mono text-xs text-right">
                      BALANCE
                    </TableHead>
                    <TableHead className="font-mono text-xs text-right hidden sm:table-cell">
                      VALUE
                    </TableHead>
                    <TableHead className="font-mono text-xs text-right hidden md:table-cell">
                      UNREALIZED P&L
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((b, i) => (
                    <TableRow
                      key={b.token_id || i}
                      className="border-border/50"
                      data-ocid={`user.holdings.table.item.${i + 1}`}
                    >
                      <TableCell>
                        <Link
                          to="/token/$id"
                          params={{ id: b.token_id }}
                          className="flex items-center gap-2 hover:text-neon-cyan transition-colors"
                        >
                          <Avatar className="h-6 w-6 rounded-sm">
                            <AvatarImage src={getTokenImageUrl(b.token_id)} />
                            <AvatarFallback className="rounded-sm text-[10px] bg-muted">
                              {(b.token_ticker || "??").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-medium">
                              {b.token_name ||
                                b.token_ticker ||
                                (b.token_id ?? "").slice(0, 10)}
                            </div>
                            {b.token_ticker && (
                              <div className="text-[10px] font-mono text-muted-foreground">
                                ${b.token_ticker}
                              </div>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right">
                        {formatNumber(b.balance)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right hidden sm:table-cell">
                        <div>{b.value ? formatBTC(b.value) : "—"}</div>
                        {btcPrice && b.value ? (
                          <div className="text-[10px] text-muted-foreground/55">
                            {formatBTCWithUSD(b.value, btcPrice).usd}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-mono text-xs text-right hidden md:table-cell",
                          pctColor(b.unrealized_pnl),
                        )}
                      >
                        <div>
                          {b.unrealized_pnl ? formatBTC(b.unrealized_pnl) : "—"}
                        </div>
                        {btcPrice && b.unrealized_pnl ? (
                          <div className="text-[10px] text-muted-foreground/55">
                            {formatBTCWithUSD(b.unrealized_pnl, btcPrice).usd}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && searched && balances.length === 0 && user && (
            <div
              data-ocid="user.holdings.empty_state"
              className="bg-card border border-border rounded-sm p-8 text-center"
            >
              <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-mono">
                No holdings found for this user
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state (not searched yet) */}
      {!searched && !loading && (
        <div className="bg-card border border-border rounded-sm p-12 text-center">
          <User2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-display font-semibold text-foreground mb-1">
            Lookup any odin.fun user
          </h3>
          <p className="text-sm text-muted-foreground font-mono">
            Enter a principal ID above to view their profile, holdings, and
            trade history
          </p>
        </div>
      )}
    </div>
  );
}
