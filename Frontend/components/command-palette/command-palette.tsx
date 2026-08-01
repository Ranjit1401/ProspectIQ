"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  FileSearch,
  FileDown,
  Share2,
  ListChecks,
  ScrollText,
  Settings,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { MOCK_COMPANIES } from "@/lib/mock-data";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const go = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search a company, jump to a page, or run a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Search Company">
          {MOCK_COMPANIES.slice(0, 5).map((company) => (
            <CommandItem key={company.id} onSelect={() => go(`/accounts/${company.id}`)}>
              <Building2 className="h-4 w-4 text-white/40" />
              <span>{company.name}</span>
              <CommandShortcut>{company.industry}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent Accounts">
          {MOCK_COMPANIES.filter((c) => c.status === "analyzed")
            .slice(0, 3)
            .map((company) => (
              <CommandItem key={`recent-${company.id}`} onSelect={() => go(`/accounts/${company.id}`)}>
                <FileSearch className="h-4 w-4 text-white/40" />
                <span>{company.name} — Executive Report</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/workspace")}>
            <Sparkles className="h-4 w-4 text-white/40" />
            <span>New Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/accounts")}>
            <FileDown className="h-4 w-4 text-white/40" />
            <span>Export Report</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/graph")}>
            <Share2 className="h-4 w-4 text-white/40" />
            <span>Relationship Graph</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/queue")}>
            <ListChecks className="h-4 w-4 text-white/40" />
            <span>Outreach Queue</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/audit")}>
            <ScrollText className="h-4 w-4 text-white/40" />
            <span>Audit Trail</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          <CommandItem onSelect={() => go("/profile")}>
            <Settings className="h-4 w-4 text-white/40" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => window.open("https://docs.prospectiq.app", "_blank")}>
            <BookOpen className="h-4 w-4 text-white/40" />
            <span>Documentation</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
