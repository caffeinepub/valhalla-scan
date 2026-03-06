import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "bg-card border border-border rounded-sm p-4 relative overflow-hidden",
        "rune-border",
        className,
      )}
    >
      {/* Background grid mesh */}
      <div className="absolute inset-0 grid-mesh opacity-30 pointer-events-none" />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-neon-gold/20 rounded-bl-full" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase">
            {label}
          </span>
          {icon && (
            <div className="text-neon-gold opacity-80 glow-gold p-1.5 rounded-sm bg-primary/5">
              {icon}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div
            className={cn(
              "text-[1.6rem] font-display font-bold tracking-tight leading-none stat-value-glow",
              trend === "up"
                ? "text-neon-green"
                : trend === "down"
                  ? "text-neon-red"
                  : "text-neon-gold",
            )}
          >
            {value}
          </div>
          {subValue && (
            <div className="text-[11px] font-mono text-muted-foreground tracking-wide uppercase">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
