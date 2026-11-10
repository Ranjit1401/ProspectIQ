"use client";

import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Threads = lazy(() => import("@/components/backgrounds/threads"));

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Threads color={[1, 1, 1]} amplitude={0.9} distance={0.25} enableMouseInteraction />
        </Suspense>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/10 via-[#090909]/45 to-[#090909]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-[640px] rounded-full bg-white/[0.03] blur-[120px]" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="silver" className="mb-6 shadow-glow px-3.5 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Guardrailed multi-agent intelligence
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-semibold tracking-tight text-white sm:text-6xl leading-[1.12]"
        >
          The future of enterprise
          <br />
          <span className="text-gradient-silver">AI decision intelligence.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-xl text-balance text-base leading-relaxed text-white/55 sm:text-lg"
        >
          ProspectIQ orchestrates research, stakeholder mapping, and outreach strategy
          across explainable AI agents — every claim grounded, every risky output
          caught by a guardrail, every send approved by a human.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row"
        >
          <Link to="/login">
            <Button size="lg" variant="glow" className="group px-7">
              Enter Workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="#pipeline">
            <Button size="lg" variant="outline" className="px-7 backdrop-blur-md">
              See how it reasons
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-14 flex flex-wrap justify-center items-center gap-6 text-[11px] uppercase tracking-[0.18em] text-white/35"
        >
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" /> Data grounding</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" /> Explainable reasoning</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400/80" /> Human-in-the-loop</span>
        </motion.div>
      </div>
    </section>
  );
}
