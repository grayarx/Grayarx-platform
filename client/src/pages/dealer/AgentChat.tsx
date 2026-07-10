/**
 * AgentChat — founder/admin direct chat interface with the GrayArx AI agents.
 *
 * Agents can answer questions about their activities and perform real DB
 * operations (cancel bookings, reclassify entries, etc.) when instructed.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, Zap, ChevronRight } from "lucide-react";
import { useParams, useLocation } from "wouter";
import DealerShell from "@/components/DealerShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ── Agent roster ────────────────────────────────────────────────────────────

type AgentId =
  | "nala"
  | "kagiso"
  | "lerato"
  | "tumi"
  | "mia"
  | "sipho"
  | "thandi"
  | "bongi"
  | "naledi"
  | "themba";

interface AgentMeta {
  id: AgentId;
  displayName: string;
  role: string;
  avatarUrl: string;
  color: string;   // Tailwind classes for badge
  description: string;
}

const AGENTS: AgentMeta[] = [
  {
    id: "nala",
    displayName: "Nala",
    role: "WhatsApp Agent",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-nala-NLdVzsVDeAxVihGRKcbJEo.webp",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    description: "Drafts WhatsApp replies in the buyer's language",
  },
  {
    id: "kagiso",
    displayName: "Kagiso",
    role: "Improvement Agent",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-kagiso-5nPwDHzWaXXAEMZt5wdSQv.webp",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    description: "Reads KPIs, writes improvement plans, applies safe fixes",
  },
  {
    id: "lerato",
    displayName: "Lerato",
    role: "Booking Agent",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-lerato-MHEMVdXmRiHSXFiXkpPCFN.webp",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    description: "Owns the test-drive calendar — confirms, reschedules, cancels",
  },
  {
    id: "tumi",
    displayName: "Tumi",
    role: "Trade-In Agent",
    avatarUrl: "",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    description: "Values trade-ins using SA market data",
  },
  {
    id: "mia",
    displayName: "Mia",
    role: "Email Agent",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-mia-UEewSarNBdAgodzLRxVAU5.webp",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    description: "Replies to lead emails and follows up at smart intervals",
  },
  {
    id: "sipho",
    displayName: "Sipho",
    role: "Prospector Agent",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-sipho-ntvMMNVigvLKKf5htoC6qD.webp",
    color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
    description: "Hunts for dealerships nightly, scores and routes hot leads",
  },
  {
    id: "thandi",
    displayName: "Thandi",
    role: "Accountant Agent",
    avatarUrl: "",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    description: "Invoices, VAT reconciliation — POPIA-aware",
  },
  {
    id: "bongi",
    displayName: "Bongi",
    role: "Fallback Agent",
    avatarUrl: "",
    color: "text-slate-300 bg-slate-500/10 border-slate-500/30",
    description: "After-hours cover — holds the fort until the team is back",
  },
  {
    id: "naledi",
    displayName: "Naledi",
    role: "Pre-Approval Agent",
    avatarUrl: "",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    description: "Guides finance applicants through pre-approval steps",
  },
  {
    id: "themba",
    displayName: "Themba",
    role: "Calling Agent",
    avatarUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/agent-themba-a4kg3nBuYDzsMeGY8onqkm.webp",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    description: "Outbound voice calls for opted-in dealerships",
  },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  agentName?: string;
  actionTaken?: { actionTaken: string; details: string } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2"
    >
      <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="bg-card border border-primary/10 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{agentName}</span> is typing
        <span className="ml-1 inline-flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block w-1 h-1 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentChat() {
  const params = useParams<{ agentId?: string }>();
  const [, setLocation] = useLocation();

  const initialAgent =
    AGENTS.find((a) => a.id === params.agentId) ?? AGENTS[0];
  const [activeAgent, setActiveAgent] = useState<AgentMeta>(initialAgent);
  const [messages, setMessages] = useState<Map<AgentId, ChatMessage[]>>(
    new Map(),
  );
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<
    Record<AgentId, string | undefined>
  >({} as Record<AgentId, string | undefined>);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.agentChat.sendMessage.useMutation({
    onSuccess: (res) => {
      setMessages((prev) => {
        const agentMessages = [...(prev.get(activeAgent.id) ?? [])];
        agentMessages.push({
          id: `agent-${Date.now()}`,
          role: "agent",
          content: res.reply,
          timestamp: new Date(res.timestamp),
          agentName: res.agentName,
          actionTaken: res.actionTaken,
        });
        return new Map(prev).set(activeAgent.id, agentMessages);
      });
      setConversationId((prev) => ({
        ...prev,
        [activeAgent.id]: res.conversationId,
      }));
    },
    onError: (e) => {
      toast.error(`${activeAgent.displayName} couldn't reply: ${e.message}`);
      // Remove the optimistic user message on error
      setMessages((prev) => {
        const agentMessages = [...(prev.get(activeAgent.id) ?? [])];
        return new Map(prev).set(
          activeAgent.id,
          agentMessages.filter((m) => !m.id.startsWith("user-optimistic-")),
        );
      });
    },
  });

  // Sync URL with active agent
  useEffect(() => {
    setLocation(`/dealer/agents/chat/${activeAgent.id}`, { replace: true });
  }, [activeAgent.id, setLocation]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  const currentMessages = messages.get(activeAgent.id) ?? [];

  function handleSend() {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;

    // Optimistic user message
    setMessages((prev) => {
      const agentMessages = [...(prev.get(activeAgent.id) ?? [])];
      agentMessages.push({
        id: `user-optimistic-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      });
      return new Map(prev).set(activeAgent.id, agentMessages);
    });
    setInput("");

    sendMessage.mutate({
      agentId: activeAgent.id,
      message: text,
      conversationId: conversationId[activeAgent.id],
    });
  }

  return (
    <DealerShell
      title="Agent Chat"
      subtitle="Chat directly with your AI agents — ask questions, give instructions, or have them fix issues."
    >
      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[520px]">
        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto pr-1">
          {AGENTS.map((agent) => {
            const isActive = activeAgent.id === agent.id;
            const msgCount = messages.get(agent.id)?.length ?? 0;
            return (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent)}
                className={cn(
                  "w-full text-left rounded-xl px-3 py-2.5 transition-colors group",
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-card border border-transparent",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    {agent.avatarUrl && (
                      <AvatarImage src={agent.avatarUrl} alt={agent.displayName} />
                    )}
                    <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                      {getInitials(agent.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-sm font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>
                        {agent.displayName}
                      </span>
                      {msgCount > 0 && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {msgCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-primary shrink-0" />}
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── Chat panel ── */}
        <div className="flex-1 flex flex-col card-premium rounded-2xl border border-primary/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/10 bg-card/50">
            <Avatar className="h-9 w-9">
              {activeAgent.avatarUrl && (
                <AvatarImage src={activeAgent.avatarUrl} alt={activeAgent.displayName} />
              )}
              <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                {getInitials(activeAgent.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground leading-tight">
                {activeAgent.displayName}
              </div>
              <div className="text-xs text-muted-foreground">{activeAgent.role}</div>
            </div>
            <Badge className={cn("ml-auto text-[10px] border", activeAgent.color)}>
              Active
            </Badge>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-5 py-4">
            <div className="flex flex-col gap-3">
              {currentMessages.length === 0 && !sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center gap-3"
                >
                  <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Chat with {activeAgent.displayName}</p>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                      {activeAgent.description}. Ask a question or give an instruction.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {getAgentSuggestions(activeAgent.id).map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {currentMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    {msg.role === "agent" && (
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        {activeAgent.avatarUrl && (
                          <AvatarImage src={activeAgent.avatarUrl} alt={activeAgent.displayName} />
                        )}
                        <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                          {getInitials(activeAgent.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] flex flex-col gap-1",
                        msg.role === "user" ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-card border border-primary/10 text-foreground rounded-bl-none",
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.actionTaken && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 max-w-full">
                          <Zap className="h-3 w-3 shrink-0" />
                          <span className="truncate">{msg.actionTaken.details}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground px-1">
                        {msg.timestamp.toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {sendMessage.isPending && (
                <TypingIndicator agentName={activeAgent.displayName} />
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-primary/10 bg-card/50">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${activeAgent.displayName}…`}
              className="flex-1 bg-background border-border h-10"
              disabled={sendMessage.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="btn-gold h-10 px-4 font-semibold shrink-0"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </DealerShell>
  );
}

// ── Suggestion prompts per agent ─────────────────────────────────────────────

function getAgentSuggestions(agentId: AgentId): string[] {
  const suggestions: Record<AgentId, string[]> = {
    nala: [
      "What did you reply to the last customer?",
      "Show me your recent WhatsApp activity",
      "How many messages have you handled today?",
    ],
    kagiso: [
      "What improvements are you working on?",
      "Show me the top 3 audit findings",
      "Have you applied any patches recently?",
    ],
    lerato: [
      "What bookings are coming up this week?",
      "Reclassify GA-K1 as a general viewing",
      "Show me all requested bookings",
    ],
    tumi: [
      "Show me the last trade-in you valued",
      "How many trade-ins this month?",
      "What's the average trade-in value?",
    ],
    mia: [
      "Who did you last follow up with?",
      "Show me open leads needing follow-up",
      "How many emails sent today?",
    ],
    sipho: [
      "Which dealerships did you prospect last night?",
      "How many leads in the pipeline?",
      "Show me the highest-scored prospects",
    ],
    thandi: [
      "What invoices are outstanding?",
      "Show me last month's VAT summary",
      "Any payment issues to flag?",
    ],
    bongi: [
      "How many after-hours messages did you handle?",
      "Show me your fallback activity",
      "Any callbacks scheduled for tomorrow?",
    ],
    naledi: [
      "How many pre-approvals pending review?",
      "Show me the latest finance applications",
      "Any applications needing urgent attention?",
    ],
    themba: [
      "Any outbound calls scheduled?",
      "Show me call attempt history",
      "Which leads need a callback?",
    ],
  };
  return suggestions[agentId] ?? [];
}
