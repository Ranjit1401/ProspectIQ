import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo — the official ProspectIQ mark. Single source of truth so the icon
 * stays identical across Navbar, Sidebar, Login/Auth, and anywhere else it
 * appears. Swap the underlying asset in /public to rebrand everywhere.
 */
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-square.png"
      alt="ProspectIQ"
      width={size}
      height={size}
      priority
      className={cn("shrink-0 select-none object-contain", className)}
    />
  );
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-b from-white/15 to-white/5 border border-white/10 shadow-premium",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Logo size={Math.round(size * 0.62)} />
    </div>
  );
}
