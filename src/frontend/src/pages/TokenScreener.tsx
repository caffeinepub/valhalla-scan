import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Token, getTokenImageUrl, getTokens } from "@/lib/api";
import {
  formatMarketCap,
  formatNumber,
  formatPct,
  formatPrice,
  pctColor,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

type SortKey =
  | "marketcap"
  | "price"
  | "volume"
  | "holders"
  | "price_delta_5m"
  | "price_delta_1h"
  | "price_delta_6h"
  | "price_delta_1d"
  | "txn_count";

export function TokenScreener() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/screener" });
  const initialQuery = (searchParams as { q?: string })?.q ?? "";

  const [tokens, setTokens] = useState<Token[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("marketcap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState(initialQuery);
  const [bondedOnly, setBondedOnly] = useState(false);
  const [hasTwitter, setHasTwitter] = useState(false);

  const PAGE_SIZE = 20;

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const sortParam = `${sortKey}:${sortDir}`;
      const result = await getTokens({
        limit: PAGE_SIZE,
        page,
        sort: sortParam,
        search: search || undefined,
        bonded: bondedOnly || undefined,
        has_twitter: hasTwitter || undefined,
      });
      setTokens(result.data || []);
      setTotal(result.count || 0);
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortKey, sortDir, search, bondedOnly, hasTwitter]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Reset page when filters change - deps intentional for state reset only
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional dep list for page reset
  useEffect(() => {
    setPage(1);
  }, [search, bondedOnly, hasTwitter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 text-neon-cyan" />
    ) : (
      <ChevronUp className="h-3 w-3 text-neon-cyan" />
    );
  };

  const SortableHead = ({
    col,
    label,
    className,
  }: { col: SortKey; label: string; className?: string }) => (
    <TableHead
      className={cn(
        "cursor-pointer hover:text-neon-cyan transition-colors font-mono text-[10px] tracking-widest text-muted-foreground/80 select-none",
        className,
      )}
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </div>
    </TableHead>
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-xl font-bold text-foreground diamond-accent">
          TOKEN SCREENER
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          {total > 0
            ? `${total.toLocaleString()} tokens on odin.fun`
            : "Loading tokens..."}
        </p>
      </motion.div>

      {/* Search + filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            data-ocid="screener.search.input"
            className="pl-9 h-9 text-sm font-mono bg-muted/40 border-border"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen(!filterOpen)}
          className={cn(
            "gap-2 h-9 font-mono text-xs border-border",
            filterOpen && "border-neon-cyan/40 text-neon-cyan",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          FILTERS
          {(bondedOnly || hasTwitter) && (
            <Badge className="h-4 w-4 p-0 text-[10px] bg-neon-cyan text-background flex items-center justify-center">
              {[bondedOnly, hasTwitter].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          data-ocid="screener.filter.panel"
          className="bg-card border border-border rounded-sm p-4 flex flex-wrap gap-6"
        >
          <div className="flex items-center gap-3">
            <Switch
              id="bonded"
              checked={bondedOnly}
              onCheckedChange={setBondedOnly}
            />
            <Label
              htmlFor="bonded"
              className="text-sm font-mono text-muted-foreground cursor-pointer"
            >
              Bonded Only
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="twitter"
              checked={hasTwitter}
              onCheckedChange={setHasTwitter}
            />
            <Label
              htmlFor="twitter"
              className="text-sm font-mono text-muted-foreground cursor-pointer"
            >
              Has Twitter
            </Label>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table data-ocid="screener.tokens.table">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="border-border hover:bg-transparent bg-muted/40 backdrop-blur-sm">
                <TableHead className="font-mono text-[10px] tracking-widest text-muted-foreground/80 w-8">
                  #
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-widest text-muted-foreground/80">
                  TOKEN
                </TableHead>
                <SortableHead col="price" label="PRICE" />
                <SortableHead
                  col="marketcap"
                  label="MCAP"
                  className="hidden md:table-cell"
                />
                <SortableHead
                  col="volume"
                  label="VOL"
                  className="hidden lg:table-cell"
                />
                <SortableHead
                  col="holders"
                  label="HOLDERS"
                  className="hidden xl:table-cell"
                />
                <SortableHead
                  col="price_delta_5m"
                  label="5M"
                  className="hidden md:table-cell"
                />
                <SortableHead col="price_delta_1h" label="1H" />
                <SortableHead
                  col="price_delta_6h"
                  label="6H"
                  className="hidden lg:table-cell"
                />
                <SortableHead
                  col="price_delta_1d"
                  label="1D"
                  className="hidden md:table-cell"
                />
                <TableHead className="font-mono text-[10px] tracking-widest text-muted-foreground/80 text-right hidden sm:table-cell">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? [
                    "sk1",
                    "sk2",
                    "sk3",
                    "sk4",
                    "sk5",
                    "sk6",
                    "sk7",
                    "sk8",
                    "sk9",
                    "sk10",
                  ].map((k) => (
                    <TableRow key={k} className="border-border">
                      <TableCell>
                        <Skeleton className="h-3 w-4" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-7 w-7 rounded-sm" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2 w-12" />
                          </div>
                        </div>
                      </TableCell>
                      {["c1", "c2", "c3", "c4", "c5", "c6", "c7"].map((ck) => (
                        <TableCell key={ck}>
                          <Skeleton className="h-3 w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : tokens.map((token, i) => {
                    const rank = (page - 1) * PAGE_SIZE + i + 1;
                    return (
                      <TableRow
                        key={token.id}
                        className="border-b border-border/30 cursor-pointer hover:bg-neon-cyan/[0.055] transition-all duration-100 group/row border-l-2 border-l-transparent hover:border-l-neon-cyan/50"
                        data-ocid={`screener.tokens.table.item.${i + 1}`}
                        onClick={() =>
                          navigate({
                            to: "/token/$id",
                            params: { id: token.id },
                          })
                        }
                      >
                        <TableCell className="font-mono text-[11px] text-muted-foreground/60 tabular-nums">
                          {rank}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 rounded-sm flex-shrink-0">
                              <AvatarImage
                                src={getTokenImageUrl(token.id)}
                                alt={token.name}
                              />
                              <AvatarFallback className="rounded-sm text-[10px] font-mono bg-muted">
                                {token.ticker?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-[13px] font-semibold text-foreground group-hover/row:text-neon-cyan transition-colors leading-tight">
                                {token.name}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground/60 tracking-wide">
                                ${token.ticker}
                              </div>
                            </div>
                            {token.bonded && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-3.5 border-neon-gold/50 text-neon-gold ml-1 tracking-wide"
                              >
                                BONDED
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-medium text-foreground tabular-nums">
                          {formatPrice(token.price)}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-foreground/80 hidden md:table-cell tabular-nums">
                          {formatMarketCap(token.marketcap)}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-foreground/80 hidden lg:table-cell tabular-nums">
                          {formatMarketCap(token.volume)}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-foreground/80 hidden xl:table-cell tabular-nums">
                          {formatNumber(token.holders)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-[12px] font-semibold hidden md:table-cell tabular-nums",
                            pctColor(token.price_delta_5m),
                          )}
                        >
                          {formatPct(token.price_delta_5m)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-[13px] font-bold tabular-nums",
                            pctColor(token.price_delta_1h),
                          )}
                        >
                          {formatPct(token.price_delta_1h)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-[12px] font-semibold hidden lg:table-cell tabular-nums",
                            pctColor(token.price_delta_6h),
                          )}
                        >
                          {formatPct(token.price_delta_6h)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-mono text-[12px] font-semibold hidden md:table-cell tabular-nums",
                            pctColor(token.price_delta_1d),
                          )}
                        >
                          {formatPct(token.price_delta_1d)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Link
                            to="/token/$id"
                            params={{ id: token.id }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-mono text-neon-cyan/60 hover:text-neon-cyan transition-colors tracking-widest"
                          >
                            VIEW →
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              {!loading && tokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <div
                      data-ocid="screener.tokens.empty_state"
                      className="text-muted-foreground text-sm font-mono"
                    >
                      No tokens found
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs font-mono text-muted-foreground">
              Page {page} of {totalPages} ({total.toLocaleString()} tokens)
            </span>
            <div className="flex items-center gap-2">
              <Button
                data-ocid="screener.pagination_prev"
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2 text-xs font-mono border-border"
              >
                ← PREV
              </Button>
              <Button
                data-ocid="screener.pagination_next"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2 text-xs font-mono border-border"
              >
                NEXT →
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
