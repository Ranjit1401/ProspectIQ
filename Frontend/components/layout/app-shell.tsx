"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AuroraBackground } from "@/components/backgrounds/aurora-background";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex min-h-screen">
        <AuroraBackground />
        <Sidebar onOpenPalette={() => setOpen(true)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onOpenPalette={() => setOpen(true)} />
          <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
        <CommandPalette open={open} onOpenChange={setOpen} />
      </div>
    </TooltipProvider>
  );
}
