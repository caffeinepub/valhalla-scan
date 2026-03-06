import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ChevronRight,
  Filter,
  LayoutDashboard,
  Menu,
  Search as SearchIcon,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

const NAV_ITEMS = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    path: "/screener",
    label: "Token Screener",
    icon: Filter,
    ocid: "nav.screener.link",
  },
  { path: "/feed", label: "Live Feed", icon: Activity, ocid: "nav.feed.link" },
  {
    path: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    ocid: "nav.leaderboard.link",
  },
  {
    path: "/user",
    label: "User Lookup",
    icon: SearchIcon,
    ocid: "nav.user.link",
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchValue.trim()) {
        navigate({ to: "/screener", search: { q: searchValue.trim() } });
        setSearchValue("");
      }
    },
    [searchValue, navigate],
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border transition-all duration-300 flex-shrink-0",
          "bg-sidebar relative",
          sidebarOpen ? "w-56" : "w-16",
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <img
                  src="/assets/generated/valhalla-logo-transparent.png"
                  alt="VALHALLA SCAN"
                  className="w-8 h-8 flex-shrink-0 rounded-none object-contain"
                />
                <div className="flex-shrink-0">
                  <span className="font-display font-bold text-sm gold-gradient-text tracking-wider">
                    VALHALLA
                  </span>
                  <span className="block font-mono text-[10px] text-neon-gold/70 tracking-widest">
                    SCAN
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <img
              src="/assets/generated/valhalla-logo-transparent.png"
              alt="V"
              className="w-8 h-8 mx-auto rounded-none object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                sidebarOpen ? "rotate-180" : "",
              )}
            />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={item.ocid}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 group relative",
                  "text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-neon-gold border border-primary/20 nav-active-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-neon-gold rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive
                      ? "text-neon-gold"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                NETWORK ONLINE
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/generated/valhalla-logo-transparent.png"
                    alt="VALHALLA SCAN"
                    className="w-8 h-8 rounded-none object-contain"
                  />
                  <div>
                    <span className="font-display font-bold text-sm gold-gradient-text tracking-wider">
                      VALHALLA
                    </span>
                    <span className="block font-mono text-[10px] text-neon-gold/70 tracking-widest">
                      SCAN
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 px-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-ocid={item.ocid}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all",
                        "text-sm font-medium",
                        isActive
                          ? "bg-primary/10 text-neon-gold border border-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2">
            <img
              src="/assets/generated/valhalla-logo-transparent.png"
              alt="VALHALLA SCAN"
              className="w-7 h-7 rounded-none object-contain"
            />
            <span className="font-display font-bold text-sm gold-gradient-text tracking-wider">
              VALHALLA SCAN
            </span>
          </div>

          {/* Global search */}
          <div className="flex-1 max-w-lg ml-auto md:ml-0">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-ocid="header.search.input"
                className="pl-9 bg-muted/50 border-border text-sm h-9 font-mono"
                placeholder="Search tokens... (press Enter)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          {/* Header right */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-neon-gold">
              <Zap className="h-3 w-3 text-neon-gold" />
              <span>BITCOIN</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-mono text-muted-foreground">
              odin.fun
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
