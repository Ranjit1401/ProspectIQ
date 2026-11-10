import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Building2,
  Share2,
  ListChecks,
  ScrollText,
  User,
  ChevronLeft,
  Command,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { Logo } from "@/components/common/logo";

const ICONS: Record<string, React.ElementType> = {
  workspace: Sparkles,
  accounts: Building2,
  graph: Share2,
  recommendations: Lightbulb,
  queue: ListChecks,
  audit: ScrollText,
};

export function Sidebar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { pathname } = useLocation();
  const user = useCurrentUser();

  const displayName = user?.username || "Account";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden lg:flex h-full w-[252px] shrink-0 flex-col border-r border-white/8 bg-[#0b0b0b]/90 backdrop-blur-2xl">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <Logo height={28} priority />
        <Badge variant="success" dot pulse className="text-[10px] px-2 py-0.5 border-emerald-500/20 bg-emerald-500/10">
          Guardrail Active
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto min-h-0">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.id] ?? LayoutGrid;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150",
                isActive
                  ? "text-white shadow-[0_0_20px_-8px_rgba(255,255,255,0.2)]"
                  : "text-white/45 hover:text-white/85 hover:bg-white/[0.04]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.08] to-white/[0.02] border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className={cn("relative h-4 w-4 shrink-0 transition-colors", isActive ? "text-white" : "text-white/40 group-hover:text-white/80")} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={onOpenPalette}
          className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-white/45 hover:text-white/80 hover:border-white/20 hover:bg-white/[0.05] transition-all"
        >
          <span className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5" /> Command menu
          </span>
          <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/60">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="border-t border-white/8 p-3">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150",
            pathname?.startsWith("/profile")
              ? "bg-white/[0.07] text-white border border-white/10"
              : "text-white/50 hover:text-white/85 hover:bg-white/[0.04]",
          )}
        >
          <Avatar className="h-7 w-7 border border-white/10 ring-1 ring-white/5">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-white/90 truncate">{displayName}</span>
            <span className="text-[10px] text-white/40 truncate">{user?.email ?? ""}</span>
          </div>
          <User className="ml-auto h-3.5 w-3.5 text-white/30" />
        </Link>
      </div>
    </aside>
  );
}

export function MobileSidebarToggleIcon() {
  return <ChevronLeft className="h-4 w-4" />;
}
