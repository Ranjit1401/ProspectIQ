"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Executive Report", suffix: "" },
  { id: "dashboard", label: "Dashboard", suffix: "/dashboard" },
  { id: "recommendations", label: "Recommendations", suffix: "/recommendations" },
  { id: "trends", label: "Trends & Activity", suffix: "/trends" },
];

export default function AccountDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const base = `/accounts/${id}`;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/6 bg-white/[0.015] p-1">
        {TABS.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const isActive = pathname === href;
          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "relative shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
                isActive ? "text-white" : "text-white/40 hover:text-white/75",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="account-tab-active"
                  className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
