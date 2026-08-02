"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronDown,
  Mic,
  ArrowUp,
  FileText,
  Table,
  Globe,
  Building2,
  NotebookText,
  Image as ImageIcon,
  Music,
  Video,
  X,
  Telescope,
  FileBarChart,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// WorkspaceMode keeps all five values so the research stream script
// (stream-script.ts) and its per-mode step lists stay untouched — the
// composer just curates which three are surfaced as quick-pick "engines".
export type WorkspaceMode =
  | "Deep Research"
  | "Executive Brief"
  | "Competitive Analysis"
  | "Outreach Strategy"
  | "Quick Analysis";

export type AttachmentKind = "pdf" | "csv" | "url" | "crm" | "image" | "notes" | "audio" | "video";

export interface ComposerAttachment {
  id: string;
  kind: AttachmentKind;
  label: string;
}

/** Kinds that go through the hidden file input rather than a direct add. */
type FileAttachmentKind = "pdf" | "csv" | "image" | "notes" | "audio" | "video";

const FILE_ACCEPT: Record<FileAttachmentKind, string> = {
  pdf: ".pdf,application/pdf",
  csv: ".csv,text/csv",
  image: "image/*",
  notes: ".txt,.md,text/plain,text/markdown",
  audio: "audio/*",
  video: "video/*",
};

const CHIP_EMOJI: Record<AttachmentKind, string> = {
  pdf: "📄",
  csv: "📊",
  url: "🌐",
  crm: "🗂",
  image: "🖼",
  notes: "📝",
  audio: "🎵",
  video: "🎬",
};

const ADD_MENU_ITEMS: { kind: AttachmentKind; label: string; icon: React.ReactNode }[] = [
  { kind: "pdf", label: "Upload PDF", icon: <FileText className="h-4 w-4" /> },
  { kind: "image", label: "Upload Image", icon: <ImageIcon className="h-4 w-4" /> },
  { kind: "url", label: "Upload Website URL", icon: <Globe className="h-4 w-4" /> },
  { kind: "csv", label: "Upload CSV", icon: <Table className="h-4 w-4" /> },
  { kind: "notes", label: "Upload Notes", icon: <NotebookText className="h-4 w-4" /> },
  { kind: "audio", label: "Upload Audio", icon: <Music className="h-4 w-4" /> },
  { kind: "video", label: "Upload Video", icon: <Video className="h-4 w-4" /> },
  { kind: "crm", label: "Connect CRM", icon: <Building2 className="h-4 w-4" /> },
];

// Curated, renamed presentation of the existing WorkspaceMode values —
// the underlying mode passed to onSend (and therefore buildStreamScript)
// is unchanged, only the label/icon shown to the person is new.
const ENGINE_OPTIONS: { mode: WorkspaceMode; label: string; icon: React.ReactNode }[] = [
  { mode: "Quick Analysis", label: "ProspectIQ Fast", icon: <Zap className="h-4 w-4" /> },
  { mode: "Deep Research", label: "ProspectIQ Deep Research", icon: <Telescope className="h-4 w-4" /> },
  { mode: "Executive Brief", label: "ProspectIQ Executive", icon: <FileBarChart className="h-4 w-4" /> },
];

const MIN_TEXTAREA_HEIGHT = 48;
const MAX_TEXTAREA_HEIGHT = 220;

interface PromptComposerProps {
  onSend: (text: string, meta: { mode: WorkspaceMode; attachments: ComposerAttachment[] }) => void;
  sending?: boolean;
}

export function PromptComposer({ onSend, sending }: PromptComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<WorkspaceMode>("Deep Research");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlOpen, setUrlOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);
  const [isEngineOpen, setEngineOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileKind = useRef<FileAttachmentKind | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea as the person types, capped at MAX_TEXTAREA_HEIGHT
  // (scrolls internally past that), and collapses back down after a send.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, MIN_TEXTAREA_HEIGHT), MAX_TEXTAREA_HEIGHT)}px`;
  }, [prompt]);

  function addAttachment(kind: AttachmentKind, label: string) {
    setAttachments((prev) => {
      // CRM is a single-toggle connection; everything else can stack.
      if (kind === "crm" && prev.some((a) => a.kind === kind)) return prev;
      return [...prev, { id: `${kind}-${Date.now()}`, kind, label }];
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleAddSelect(kind: AttachmentKind) {
    setAddOpen(false);
    if (kind === "crm") {
      addAttachment("crm", "CRM Connected");
      return;
    }
    if (kind === "url") {
      setUrlOpen(true);
      return;
    }
    pendingFileKind.current = kind;
    if (fileInputRef.current) {
      fileInputRef.current.accept = FILE_ACCEPT[kind];
      fileInputRef.current.click();
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const kind = pendingFileKind.current;
    if (file && kind) {
      addAttachment(kind, file.name);
    }
    e.target.value = "";
    pendingFileKind.current = null;
  }

  function confirmUrl() {
    const trimmed = urlDraft.trim();
    if (trimmed) {
      addAttachment("url", trimmed.replace(/^https?:\/\//, ""));
    }
    setUrlDraft("");
    setUrlOpen(false);
  }

  function handleSend() {
    if (!prompt.trim() || sending) return;
    onSend(prompt.trim(), { mode, attachments });
    setPrompt("");
    setAttachments([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift + Enter falls through to the textarea's default newline behavior.
  }

  const activeEngine = ENGINE_OPTIONS.find((m) => m.mode === mode) ?? ENGINE_OPTIONS[1];

  return (
    <div className="border-t border-white/6 p-3">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />

      {/* Selected resources, shown above the composer as removable chips */}
      <AnimatePresence initial={false}>
        {attachments.length > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence initial={false}>
                {attachments.map((a) => (
                  <motion.span
                    key={a.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-white/70"
                  >
                    <span aria-hidden>{CHIP_EMOJI[a.kind]}</span>
                    {a.label}
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="rounded-full p-0.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                      aria-label={`Remove ${a.label}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="rounded-2xl border border-white/8 bg-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset] transition-colors duration-200 focus-within:border-white/20 focus-within:bg-white/[0.03]"
      >
        {/* Inline URL entry */}
        <AnimatePresence initial={false}>
          {urlOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden px-3.5 pt-3"
            >
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Globe className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <input
                  autoFocus
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmUrl();
                    }
                    if (e.key === "Escape") setUrlOpen(false);
                  }}
                  placeholder="https://company.com"
                  className="flex-1 bg-transparent text-[13px] text-white/85 placeholder-white/25 outline-none"
                />
                <button
                  type="button"
                  onClick={confirmUrl}
                  className="text-[11px] font-medium text-white/60 transition-colors hover:text-white"
                >
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          className="block w-full resize-none overflow-y-auto bg-transparent px-3.5 pb-1 pt-3 text-[14px] leading-relaxed text-white/90 placeholder-white/30 focus:outline-none"
          style={{ height: MIN_TEXTAREA_HEIGHT, maxHeight: MAX_TEXTAREA_HEIGHT }}
          placeholder="Research a company, upload resources, or ask ProspectIQ to generate a sales strategy..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />

        <div className="flex flex-col gap-3 px-2.5 pb-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* "+" attach/connect menu */}
            <DropdownMenu open={isAddOpen} onOpenChange={setAddOpen}>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                  aria-label="Add resources or connect sources"
                >
                  <motion.span animate={{ rotate: isAddOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Add resources</DropdownMenuLabel>
                {ADD_MENU_ITEMS.map((item) => (
                  <DropdownMenuItem key={item.kind} onSelect={() => handleAddSelect(item.kind)}>
                    <span className="text-white/50">{item.icon}</span>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Engine / mode selector */}
            <DropdownMenu open={isEngineOpen} onOpenChange={setEngineOpen}>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[12px] font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  <span className="text-white/50">{activeEngine.icon}</span>
                  <span className="hidden sm:inline">{activeEngine.label}</span>
                  <motion.span animate={{ rotate: isEngineOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                  </motion.span>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel>ProspectIQ engine</DropdownMenuLabel>
                {ENGINE_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.mode} onSelect={() => setMode(option.mode)}>
                    <span className="text-white/50">{option.icon}</span>
                    <span className={cn("flex-1", option.mode === mode && "text-white")}>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSend}
              disabled={!prompt.trim() || sending}
              whileTap={prompt.trim() && !sending ? { scale: 0.92 } : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                prompt.trim() && !sending
                  ? "btn-metallic"
                  : "cursor-not-allowed bg-white/[0.05] text-white/25",
              )}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
