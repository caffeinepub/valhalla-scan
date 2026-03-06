import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Token } from "@/lib/api";
import { getTokenImageUrl } from "@/lib/api";
import {
  formatMarketCap,
  formatMarketCapUSD,
  formatNumber,
  formatPct,
  formatPrice,
  pctColor,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface TokenRowProps {
  token: Token;
  rank?: number;
  index: number;
  btcPrice?: number | null;
}

export function TokenRow({
  token,
  rank,
  index,
  btcPrice = null,
}: TokenRowProps) {
  return (
    <Link
      to="/token/$id"
      params={{ id: token.id }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 border-l-2 border-l-transparent border-b border-b-border/40",
        "hover:bg-neon-cyan/[0.06] hover:border-l-neon-cyan/60 transition-all duration-150 cursor-pointer group",
      )}
      data-ocid={`screener.tokens.table.item.${index}`}
    >
      {rank !== undefined && (
        <span className="w-6 text-center font-mono text-xs text-muted-foreground flex-shrink-0">
          {rank}
        </span>
      )}
      <Avatar className="h-8 w-8 flex-shrink-0 rounded-sm">
        <AvatarImage src={getTokenImageUrl(token.id)} alt={token.name} />
        <AvatarFallback className="rounded-sm bg-muted text-xs font-mono">
          {token.ticker?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold truncate text-foreground group-hover:text-neon-cyan transition-colors leading-tight">
            {token.name}
          </span>
          {token.bonded && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 border-neon-gold/50 text-neon-gold flex-shrink-0 tracking-wide"
            >
              BONDED
            </Badge>
          )}
        </div>
        <span className="text-[11px] font-mono text-muted-foreground/70 tracking-wide">
          ${token.ticker}
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-5 text-right">
        <div className="w-24">
          <div className="text-[12px] font-mono font-medium text-foreground tabular-nums">
            {formatPrice(token.price)}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/60 tracking-wider uppercase">
            PRICE
          </div>
        </div>
        <div className="w-24 hidden md:block">
          <div className="text-[12px] font-mono text-foreground/90 tabular-nums">
            {formatMarketCap(token.marketcap)}
          </div>
          {btcPrice && token.marketcap ? (
            <div className="text-[9px] font-mono text-muted-foreground/55 tabular-nums">
              {formatMarketCapUSD(token.marketcap, btcPrice)}
            </div>
          ) : (
            <div className="text-[9px] font-mono text-muted-foreground/60 tracking-wider uppercase">
              MCAP
            </div>
          )}
        </div>
        <div className="w-16">
          <div
            className={cn(
              "text-[13px] font-mono font-semibold tabular-nums",
              pctColor(token.price_delta_1h),
            )}
          >
            {formatPct(token.price_delta_1h)}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/60 tracking-wider uppercase">
            1H
          </div>
        </div>
        <div className="w-16 hidden lg:block">
          <div
            className={cn(
              "text-[13px] font-mono font-semibold tabular-nums",
              pctColor(token.price_delta_1d),
            )}
          >
            {formatPct(token.price_delta_1d)}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/60 tracking-wider uppercase">
            1D
          </div>
        </div>
        <div className="w-14 hidden xl:block">
          <div className="text-[12px] font-mono text-foreground/90 tabular-nums">
            {formatNumber(token.holders)}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/60 tracking-wider uppercase">
            HOLD
          </div>
        </div>
      </div>
    </Link>
  );
}
