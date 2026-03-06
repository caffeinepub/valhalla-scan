import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/lib/api";
import { getTokenImageUrl } from "@/lib/api";
import {
  formatBTCWithUSD,
  formatNumber,
  timeAgo,
  truncatePrincipal,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { TrendingDown, TrendingUp } from "lucide-react";

interface TradeFeedItemProps {
  trade: Trade;
  index: number;
  userName?: string;
  btcPrice?: number | null;
  resolvedTicker?: string;
}

export function TradeFeedItem({
  trade,
  index,
  userName,
  btcPrice = null,
  resolvedTicker,
}: TradeFeedItemProps) {
  const isBuy = trade.type === "buy";
  const { btc: btcStr, usd: usdStr } = formatBTCWithUSD(
    trade.btc_amount,
    btcPrice,
  );

  const displayName =
    trade.user_username ||
    userName ||
    (trade.user ? truncatePrincipal(trade.user, 5) : "—");

  return (
    <div
      data-ocid={`feed.trades.list.item.${index}`}
      className={cn(
        "flex items-center gap-3 px-4 py-2 border-b border-border/25 border-l-2",
        "transition-all duration-100",
        isBuy
          ? "border-l-neon-green/20 hover:border-l-neon-green/60 hover:bg-neon-green/[0.04]"
          : "border-l-neon-red/20 hover:border-l-neon-red/60 hover:bg-neon-red/[0.04]",
      )}
    >
      {/* Token avatar */}
      <Link
        to="/token/$id"
        params={{ id: trade.token_id }}
        className="flex-shrink-0"
      >
        <Avatar className="h-6 w-6 rounded-sm">
          <AvatarImage
            src={getTokenImageUrl(trade.token_id)}
            alt={trade.token_name}
          />
          <AvatarFallback className="rounded-sm bg-muted text-[9px] font-mono">
            {(trade.token_ticker || "??").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Token name */}
      <Link
        to="/token/$id"
        params={{ id: trade.token_id }}
        className="w-16 min-w-0 text-[12px] font-semibold font-mono text-neon-gold hover:text-neon-gold/80 transition-colors truncate leading-none"
      >
        {trade.token_ticker ||
          resolvedTicker ||
          trade.token_name ||
          (trade.token_id ?? "").slice(0, 6).toUpperCase()}
      </Link>

      {/* Buy/Sell badge */}
      <Badge
        className={cn(
          "text-[9px] font-mono px-1.5 py-0 h-4.5 flex-shrink-0 rounded-[2px] tracking-wider",
          isBuy ? "badge-buy" : "badge-sell",
        )}
      >
        {isBuy ? (
          <>
            <TrendingUp className="h-2 w-2 mr-0.5" />
            BUY
          </>
        ) : (
          <>
            <TrendingDown className="h-2 w-2 mr-0.5" />
            SELL
          </>
        )}
      </Badge>

      {/* Amount: BTC + USD */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[12px] font-mono font-semibold tabular-nums leading-tight",
            isBuy ? "text-neon-green" : "text-neon-red",
          )}
        >
          {btcStr}
        </div>
        {usdStr && (
          <div className="text-[9px] text-muted-foreground/55 font-mono tabular-nums">
            {usdStr}
          </div>
        )}
      </div>

      {/* Token amount */}
      <div className="hidden sm:block text-right flex-shrink-0 w-14">
        <div className="text-[10px] font-mono text-foreground/70 tabular-nums">
          {formatNumber(trade.token_amount)}
        </div>
        <div className="text-[8px] font-mono text-muted-foreground/40 tracking-wider">
          {trade.token_ticker || resolvedTicker || "..."}
        </div>
      </div>

      {/* User */}
      <span className="hidden md:block text-[9px] font-mono text-muted-foreground/50 truncate max-w-[72px] tabular-nums">
        {displayName}
      </span>

      {/* Time */}
      <span className="text-[9px] font-mono text-muted-foreground/50 flex-shrink-0 w-12 text-right tabular-nums">
        {timeAgo(trade.time)}
      </span>
    </div>
  );
}
