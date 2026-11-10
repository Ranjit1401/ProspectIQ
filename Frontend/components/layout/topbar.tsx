import { useLocation, Link } from "react-router-dom";
import { Search, Menu, ShieldCheck } from "lucide-react";
import { NotificationPopover } from "@/components/layout/notification-popover";
import { NAV_ITEMS } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/components/auth/auth-guard";

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export function Topbar({
  onOpenPalette,
  onOpenMobileNav,
}: {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}) {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((item) => pathname?.startsWith(item.href));
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-[#090909]/80 px-4 backdrop-blur-2xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-white/60 hover:text-white hover:border-white/20 transition-all lg:hidden"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">ProspectIQ</p>
            <Badge variant="outline" className="hidden md:inline-flex text-[10px] py-0 px-1.5 border-white/10 text-white/50 gap-1">
              <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
              Verified Pipeline
            </Badge>
          </div>
          <h1 className="text-[17px] font-semibold tracking-tight text-gradient-silver">{current?.label ?? "Overview"}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 text-xs text-white/45 hover:text-white/85 hover:border-white/20 hover:bg-white/[0.05] transition-all sm:px-3.5"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search or jump to...</span>
          <kbd className="ml-1 hidden rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/60 sm:inline">
            ⌘K
          </kbd>
        </button>
        <NotificationPopover />
        <Link
          to="/profile"
          className="lg:hidden rounded-full transition-opacity hover:opacity-80 ring-1 ring-white/10"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user ? initials(user.username) : "?"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}