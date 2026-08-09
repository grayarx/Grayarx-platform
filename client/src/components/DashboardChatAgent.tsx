import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, HelpCircle, Loader2, MessageCircle, Send, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  isInventoryBulkDeleteConfirm,
  isInventoryBulkDeleteRequest,
} from "@shared/assistantActions";

type PendingAction = {
  type: "inventory_delete_all";
  label: string;
  confirmPhrase: string;
  vehicleCount: number;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  links?: Array<{ label: string; href: string }>;
  pendingAction?: PendingAction;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function renderBotText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DashboardChatAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [acting, setActing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = trpc.dashboardAssistant.config.useQuery(undefined, {
    staleTime: 60_000,
  });
  const chat = trpc.dashboardAssistant.chat.useMutation();
  const utils = trpc.useUtils();

  const isOwner = config.data?.mode === "owner";
  const quickPrompts = config.data?.quickPrompts ?? [];
  const busy = chat.isPending || acting;

  const invalidateInventory = () => {
    void utils.dealer.listVehicles.invalidate();
    void utils.dealer.stats.invalidate();
    void utils.showroom.list.invalidate();
    void utils.showroom.stats.invalidate();
  };

  const pushBot = (msg: Omit<ChatMessage, "id" | "role">) => {
    setMessages((m) => [...m, { id: uid(), role: "bot", ...msg }]);
  };

  const postAssistantReply = (res: {
    reply: string;
    links?: Array<{ label: string; href: string }>;
    pendingAction?: PendingAction | null;
    actionExecuted?: boolean;
  }) => {
    pushBot({
      text: res.reply,
      links: res.links?.length ? res.links : undefined,
      pendingAction: res.pendingAction ?? undefined,
    });
    if (res.actionExecuted) {
      invalidateInventory();
    }
  };

  const runAssistantChat = async (input: {
    message: string;
    confirmAction?: PendingAction["type"];
  }) => {
    setActing(true);
    try {
      const res = await chat.mutateAsync(input);
      postAssistantReply(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      pushBot({ text: `Sorry — ${msg}. Try again in a moment.` });
    } finally {
      setActing(false);
    }
  };

  const greet = useCallback(() => {
    if (!config.data) return;
    const links =
      config.data.mode === "owner"
        ? [{ label: "Platform agents", href: "/dealer/agents" }]
        : [
            { label: "Leads", href: "/dealer/leads" },
            { label: "Bookings", href: "/dealer/bookings" },
          ];
    setMessages([
      {
        id: uid(),
        role: "bot",
        text: config.data.greeting,
        links,
      },
    ]);
  }, [config.data]);

  useEffect(() => {
    if (open && messages.length === 0 && config.data) greet();
  }, [open, messages.length, greet, config.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string, confirmAction?: PendingAction["type"]) => {
    const trimmed = text.trim();
    if (!trimmed && !confirmAction) return;
    if (busy) return;

    if (confirmAction === "inventory_delete_all" || isInventoryBulkDeleteConfirm(trimmed)) {
      if (!confirmAction) {
        setInput("");
        setMessages((m) => [...m, { id: uid(), role: "user", text: trimmed }]);
      }
      await runAssistantChat({
        message: trimmed || "confirm",
        confirmAction: "inventory_delete_all",
      });
      return;
    }

    if (isInventoryBulkDeleteRequest(trimmed)) {
      setInput("");
      setMessages((m) => [...m, { id: uid(), role: "user", text: trimmed }]);
      await runAssistantChat({ message: trimmed });
      return;
    }

    setInput("");
    setMessages((m) => [...m, { id: uid(), role: "user", text: trimmed }]);

    try {
      const res = await chat.mutateAsync({
        message: trimmed,
        confirmAction,
      });
      postAssistantReply(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      pushBot({ text: `Sorry — ${msg}. Try again in a moment.` });
    }
  };

  const label = config.data?.label ?? "Help";
  const title = config.data?.title ?? "Help";
  const subtitle = config.data?.subtitle ?? "Support";
  const avatarUrl = config.data?.avatarUrl;
  const placeholder = config.data?.placeholder ?? "How can we help?";

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={() => setOpen(true)}
            className={cn(
              "fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-colors",
              isOwner
                ? "bg-gradient-to-r from-yellow-500/90 to-amber-600/90 text-black shadow-yellow-900/30 ring-1 ring-yellow-400/40 hover:from-yellow-400 hover:to-amber-500"
                : "bg-primary/90 text-primary-foreground shadow-primary/20 ring-1 ring-primary/30 hover:bg-primary",
            )}
            aria-label={label}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full ring-2 ring-black/20 object-cover"
              />
            ) : isOwner ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <HelpCircle className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">{label}</span>
            <MessageCircle className="h-4 w-4 sm:hidden" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className={cn(
              "fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[420px] z-[70] flex flex-col rounded-2xl border bg-[#0a0a0c]/95 shadow-2xl shadow-black/60 overflow-hidden max-h-[85vh]",
              isOwner ? "border-yellow-500/25" : "border-primary/25",
            )}
          >
            <header
              className={cn(
                "flex items-center gap-3 border-b border-white/10 px-4 py-3",
                isOwner ? "bg-yellow-500/5" : "bg-primary/5",
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className={cn(
                    "h-10 w-10 rounded-full object-cover ring-2",
                    isOwner ? "ring-yellow-500/40" : "ring-primary/40",
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    isOwner ? "bg-yellow-500/20" : "bg-primary/20",
                  )}
                >
                  {isOwner ? (
                    <Bot className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <HelpCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[240px] max-h-[50vh]"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-8 bg-primary/15 text-foreground"
                      : "mr-4 bg-white/5 text-muted-foreground border border-white/5",
                  )}
                >
                  {m.role === "bot" ? renderBotText(m.text) : m.text}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border",
                            isOwner
                              ? "bg-yellow-500/15 text-yellow-200 hover:bg-yellow-500/25 border-yellow-500/20"
                              : "bg-primary/15 text-primary-foreground/90 hover:bg-primary/25 border-primary/20",
                          )}
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.pendingAction && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        className="h-8 text-xs"
                        onClick={() => void send(m.pendingAction!.label, m.pendingAction!.type)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {m.pendingAction.label}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {isOwner ? "Kagiso is working on it…" : "Working on it…"}
                </div>
              )}
            </div>

            {quickPrompts.length > 0 && (
              <div className="border-t border-white/10 px-3 py-2 flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={busy}
                    onClick={() => send(prompt)}
                    className={cn(
                      "rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50",
                      isOwner ? "hover:border-yellow-500/30" : "hover:border-primary/30",
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form
              className="flex gap-2 border-t border-white/10 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={busy}
                className="bg-black/30 border-white/10"
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
