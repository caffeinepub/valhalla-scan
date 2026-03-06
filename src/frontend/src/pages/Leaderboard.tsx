import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Token, getTokenImageUrl, getTokens } from "@/lib/api";
import {
  formatMarketCap,
  formatNumber,
  formatPct,
  formatPrice,
  pctColor,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Activity, BarChart2, TrendingUp, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

type LeaderboardTab = "volume" | "marketcap" | "holders" | "txn_count";

const TABS: {
  value: LeaderboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  sort: string;
}[] = [
  {
    value: "volume",
    label: "Top Volume",
    icon: BarChart2,
    sort: "volume:desc",
  },
  {
    value: "marketcap",
    label: "Top Market Cap",
    icon: TrendingUp,
    sort: "marketcap:desc",
  },
  { value: "holders", label: "Top Holders", icon: Users, sort: "holders:desc" },
  {
    value: "txn_count",
    label: "Most Active",
    icon: Activity,
    sort: "txn_count:desc",
  },
];

const RANK_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="text-lg leading-none">{RANK_MEDALS[rank]}</span>;
  }
  return (
    <span className="font-mono text-sm text-muted-foreground w-6 text-center">
      {rank}
    </span>
  );
}

interface LeaderboardRowProps {
  token: Token;
  rank: number;
  valueKey: LeaderboardTab;
  index: number;
}

function LeaderboardRow({ token, rank, valueKey, index }: LeaderboardRowProps) {
  const isTop3 = rank <= 3;

  const getValue = () => {
    switch (valueKey) {
      case "volume":
        return formatMarketCap(token.volume);
      case "marketcap":
        return formatMarketCap(token.marketcap);
      case "holders":
        return formatNumber(token.holders);
      case "txn_count":
        return formatNumber(token.txn_count);
      default:
        return "—";
    }
  };

  const getLabel = () => {
    switch (valueKey) {
      case "volume":
        return "VOL";
      case "marketcap":
        return "MCAP";
      case "holders":
        return "HOLDERS";
      case "txn_count":
        return "TXN";
      default:
        return "";
    }
  };

  return (
    <Link
      to="/token/$id"
      params={{ id: token.id }}
      data-ocid={`leaderboard.tokens.item.${index}`}
      className={cn(
        "flex items-center gap-4 p-3 border-b border-border/50 transition-all",
        "hover:bg-muted/20 cursor-pointer group",
        isTop3 && "bg-card/50",
      )}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        <RankBadge rank={rank} />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-9 w-9 rounded-sm flex-shrink-0">
          <AvatarImage src={getTokenImageUrl(token.id)} alt={token.name} />
          <AvatarFallback className="rounded-sm text-xs font-mono bg-muted">
            {token.ticker?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground group-hover:text-neon-cyan transition-colors truncate">
            {token.name}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            ${token.ticker}
          </div>
        </div>
        {token.bonded && (
          <Badge
            variant="outline"
            className="text-[10px] px-1 py-0 h-4 border-neon-gold/40 text-neon-gold flex-shrink-0"
          >
            BONDED
          </Badge>
        )}
      </div>

      {/* Price */}
      <div className="hidden md:block text-right min-w-[80px]">
        <div className="text-xs font-mono text-foreground">
          {formatPrice(token.price)}
        </div>
        <div className="text-[10px] text-muted-foreground">PRICE</div>
      </div>

      {/* Change */}
      <div className="hidden sm:block text-right min-w-[60px]">
        <div
          className={cn(
            "text-xs font-mono font-medium",
            pctColor(token.price_delta_1d),
          )}
        >
          {formatPct(token.price_delta_1d)}
        </div>
        <div className="text-[10px] text-muted-foreground">1D</div>
      </div>

      {/* Main value */}
      <div className="text-right min-w-[100px]">
        <div
          className={cn(
            "text-sm font-mono font-bold",
            isTop3 ? "text-neon-gold" : "text-foreground",
          )}
        >
          {getValue()}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {getLabel()}
        </div>
      </div>
    </Link>
  );
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("volume");
  const [data, setData] = useState<Record<LeaderboardTab, Token[]>>({
    volume: [],
    marketcap: [],
    holders: [],
    txn_count: [],
  });
  const [loading, setLoading] = useState<Record<LeaderboardTab, boolean>>({
    volume: true,
    marketcap: false,
    holders: false,
    txn_count: false,
  });
  const [loaded, setLoaded] = useState<Set<LeaderboardTab>>(new Set());

  const fetchLeaderboard = useCallback(
    async (tab: LeaderboardTab) => {
      if (loaded.has(tab)) return;
      setLoading((prev) => ({ ...prev, [tab]: true }));
      try {
        const tabConfig = TABS.find((t) => t.value === tab);
        if (!tabConfig) return;
        const result = await getTokens({ limit: 20, sort: tabConfig.sort });
        setData((prev) => ({ ...prev, [tab]: result.data || [] }));
        setLoaded((prev) => new Set([...prev, tab]));
      } catch {
        // silently fail
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [loaded],
  );

  // Load initial tab
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only
  useEffect(() => {
    fetchLeaderboard("volume");
  }, []);

  // Load tab on change
  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-xl font-bold text-foreground diamond-accent">
          LEADERBOARD
        </h1>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          Top 20 tokens ranked by key metrics
        </p>
      </motion.div>

      {/* Leaderboard tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-sm overflow-hidden"
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as LeaderboardTab)}
        >
          <TabsList
            className="w-full rounded-none border-b border-border bg-transparent h-auto p-0 flex overflow-x-auto"
            data-ocid="leaderboard.tab"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 min-w-[100px] rounded-none border-b-2 border-transparent data-[state=active]:border-neon-cyan data-[state=active]:text-neon-cyan font-mono text-xs py-3 text-muted-foreground whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {loading[tab.value] ? (
                <div className="space-y-0">
                  {[
                    "lb1",
                    "lb2",
                    "lb3",
                    "lb4",
                    "lb5",
                    "lb6",
                    "lb7",
                    "lb8",
                    "lb9",
                    "lb10",
                  ].map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-4 p-3 border-b border-border/40"
                    >
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-9 w-9 rounded-sm" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : data[tab.value].length === 0 ? (
                <div
                  data-ocid="leaderboard.tokens.empty_state"
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Trophy className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground font-mono">
                    No data available
                  </p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div className="flex items-center gap-4 px-3 py-2 border-b border-border bg-muted/10">
                    <div className="w-8 text-[10px] font-mono text-muted-foreground">
                      #
                    </div>
                    <div className="flex-1 text-[10px] font-mono text-muted-foreground">
                      TOKEN
                    </div>
                    <div className="hidden md:block text-[10px] font-mono text-muted-foreground w-[80px] text-right">
                      PRICE
                    </div>
                    <div className="hidden sm:block text-[10px] font-mono text-muted-foreground w-[60px] text-right">
                      1D
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground w-[100px] text-right">
                      {TABS.find(
                        (t) => t.value === tab.value,
                      )?.label?.toUpperCase()}
                    </div>
                  </div>
                  {data[tab.value].map((token, i) => (
                    <LeaderboardRow
                      key={token.id}
                      token={token}
                      rank={i + 1}
                      valueKey={tab.value}
                      index={i + 1}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

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
