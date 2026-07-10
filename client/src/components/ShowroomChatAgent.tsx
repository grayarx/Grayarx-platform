import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  Calendar,
  Banknote,
  Car,
  MessageCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { resolveMake, resolveModel } from "@shared/vehicleCatalog";
import {
  answerShowroomQuestion,
  detectShowroomLanguage,
  formatVehicleDisplayName,
  getFlowPrompt,
  getLocalizedPrompt,
  greetingForVehicle,
  isSkipReply,
  replyNeedsNameCapture,
  thanksForEnquiry,
  type ShowroomLang,
  type VehicleChatContext,
} from "@shared/nalaShowroomChat";
import { composeShowroomBotReply } from "@shared/nalaGrammarPolish";
import type { LanguageCode } from "@shared/languages";
import { isLanguageCode } from "@shared/languages";
import { classifyAgentRoute, webLeratoHandoff } from "@shared/agentIntentRouting";
import { formatVehiclePrice } from "@/lib/formatPrice";

import type { RoutedAgentId } from "@shared/agentIntentRouting";

export type ChatVehicle = {
  id: string;
  title: string;
  price: number;
  year: number;
  km: number;
  fuel: string;
  transmission: string;
  image?: string;
  location?: string;
  make?: string;
  model?: string;
  color?: string | null;
  description?: string | null;
};

type Flow = "menu" | "test_drive" | "pre_approval" | "trade_in" | "enquiry";

type ChatAction = { label: string; url: string };

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  agent?: RoutedAgentId;
  actions?: ChatAction[];
};

const AGENT_HEADER: Record<
  RoutedAgentId,
  { name: string; role: string }
> = {
  nala: { name: "Nala", role: "AI Sales" },
  lerato: { name: "Lerato", role: "Booking" },
  tumi: { name: "Tumi", role: "Trade-In" },
  bongi: { name: "Bongi", role: "After Hours" },
};

type ShowroomChatAgentProps = {
  vehicle: ChatVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealershipName?: string;
  shortcode?: string | null;
};

const fmtZAR = (n: number) => formatVehiclePrice(n);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function browserPreferredLang(): LanguageCode {
  const raw = (navigator.language || "en").split("-")[0]?.toLowerCase() ?? "en";
  return isLanguageCode(raw) ? raw : "en";
}

function toVehicleChatContext(vehicle: ChatVehicle): VehicleChatContext {
  return {
    title: vehicle.title,
    year: vehicle.year,
    price: vehicle.price,
    km: vehicle.km,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    location: vehicle.location,
    color: vehicle.color ?? null,
    make: vehicle.make,
    model: vehicle.model,
    description: vehicle.description ?? null,
  };
}

function resolveLocalMenuReply(
  vehicle: ChatVehicle,
  message: string,
  lang: LanguageCode,
  dealershipName: string,
): { reply: string; agent: RoutedAgentId; intent: string; language: LanguageCode } {
  const route = classifyAgentRoute({ message, afterHours: false });

  if (route.agent === "lerato") {
    return {
      agent: "lerato",
      intent: route.intent,
      language: lang,
      reply: webLeratoHandoff(lang, dealershipName),
    };
  }

  if (route.agent === "tumi") {
    const heuristic = answerShowroomQuestion(toVehicleChatContext(vehicle), message, lang);
    return {
      agent: "tumi",
      intent: "trade_in",
      language: lang,
      reply: composeShowroomBotReply(heuristic.reply, lang, {
        appendFollowUp: !replyNeedsNameCapture(heuristic.reply),
      }),
    };
  }

  const heuristic = answerShowroomQuestion(toVehicleChatContext(vehicle), message, lang);
  return {
    agent: "nala",
    intent: heuristic.intent,
    language: heuristic.language,
    reply: composeShowroomBotReply(heuristic.reply, lang, {
      appendFollowUp: heuristic.answered && !replyNeedsNameCapture(heuristic.reply),
    }),
  };
}

export function ShowroomChatAgent({
  vehicle,
  open,
  onOpenChange,
  dealershipName = "GrayArx Dealership",
  shortcode,
}: ShowroomChatAgentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flow, setFlow] = useState<Flow>("menu");
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [chatLang, setChatLang] = useState<LanguageCode>("en");
  const [activeAgent, setActiveAgent] = useState<RoutedAgentId>("nala");

  const booking = trpc.publicBooking.submit.useMutation();
  const preApproval = trpc.publicPreApproval.submit.useMutation();
  const tradeIn = trpc.tradeIn.estimate.useMutation();
  const enquire = trpc.showroom.enquire.useMutation();
  const showroomChat = trpc.showroom.chat.useMutation();

  const addBot = useCallback(
    (text: string, agent: RoutedAgentId = "nala", actions?: ChatAction[]) => {
      setActiveAgent(agent);
      setMessages((m) => [...m, { id: uid(), role: "bot", text, agent, actions }]);
    },
    [],
  );

  const addUser = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
  }, []);

  const resetChat = useCallback(() => {
    if (!vehicle) return;
    setFlow("menu");
    setStep(0);
    setDraft({});
    setInput("");
    setChatLang(browserPreferredLang());
    setActiveAgent("nala");
    const greeting = greetingForVehicle(vehicle, dealershipName, browserPreferredLang());
    setMessages([{ id: uid(), role: "bot", text: greeting, agent: "nala" }]);
  }, [vehicle, dealershipName]);

  useEffect(() => {
    if (open && vehicle) resetChat();
  }, [open, vehicle?.id, resetChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const startFlow = (f: Flow) => {
    const lang = chatLang;
    if (!shortcode && f !== "enquiry") {
      addBot(getFlowPrompt("setupIncomplete", lang));
      setFlow("enquiry");
      setStep(1);
      setDraft({ lang });
      return;
    }
    setFlow(f);
    setStep(0);
    setDraft({ lang });
    if (f === "test_drive") {
      addUser(getFlowPrompt("quickTestDrive", lang));
      addBot(getFlowPrompt("testDriveStart", lang));
    } else if (f === "pre_approval") {
      addUser(getFlowPrompt("quickPreApproval", lang));
      addBot(
        getFlowPrompt("preApprovalStart", lang, {
          vehicle: vehicle?.title ?? "vehicle",
          price: fmtZAR(vehicle?.price ?? 0),
        }),
      );
    } else if (f === "trade_in") {
      addUser(getFlowPrompt("quickTradeIn", lang));
      addBot(getFlowPrompt("tradeInStart", lang));
    } else if (f === "enquiry") {
      addUser(getFlowPrompt("quickAsk", lang));
      addBot(getFlowPrompt("enquiryStart", lang));
    }
  };

  const submitTestDrive = async (data: Record<string, string>) => {
    if (!shortcode || !vehicle) return;
    setBusy(true);
    try {
      const res = await booking.mutateAsync({
        shortcode,
        vehicleId: Number(vehicle.id),
        customerName: data.name,
        customerContact: data.contact,
        channel: "web_chat",
        inboundMessage: data.notes || `Test drive request for ${vehicle.title} via showroom chat`,
        requestedSlotStart: data.date ? `${data.date}T${data.time || "10:00"}:00` : undefined,
      });
      addBot(
        getFlowPrompt("testDriveDone", chatLang, {
          ref: res.reference,
          reply: res.replyToCustomer,
          dealership: dealershipName,
        }),
      );
      setFlow("menu");
    } catch (e) {
      addBot(
        getFlowPrompt("errorSubmit", chatLang, {
          message: e instanceof Error ? e.message : "please try again",
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const submitPreApproval = async (data: Record<string, string>) => {
    if (!shortcode || !vehicle) return;
    setBusy(true);
    try {
      const res = await preApproval.mutateAsync({
        shortcode,
        vehicleId: Number(vehicle.id),
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        vehiclePrice: vehicle.price,
        desiredDeposit: data.deposit ? Number(data.deposit.replace(/\D/g, "")) : undefined,
        desiredTermMonths: data.term ? Number(data.term) : undefined,
        netMonthlyIncome: data.income ? Number(data.income.replace(/\D/g, "")) : undefined,
        notes: `Submitted via showroom chat for ${vehicle.title}`,
      });
      addBot(
        getFlowPrompt("preApprovalDone", chatLang, {
          ref: res.reference,
          reply: res.replyToCustomer,
        }),
      );
      setFlow("menu");
    } catch (e) {
      addBot(
        getFlowPrompt("errorSubmit", chatLang, {
          message: e instanceof Error ? e.message : "could not submit",
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const submitTradeIn = async (data: Record<string, string>) => {
    setBusy(true);
    try {
      const make = resolveMake(data.make);
      const model = resolveModel(make, data.model);
      const res = await tradeIn.mutateAsync({
        make,
        model,
        year: Number(data.year),
        mileageKm: Number(data.km?.replace(/\D/g, "") || "0"),
        transmission: "automatic",
        fuel: "petrol",
        bodyType: "Sedan",
        condition: (data.condition as "excellent" | "good" | "fair" | "poor") || "good",
        serviceHistory: "partial",
        contactName: data.name,
        contactPhone: data.contact,
        notes: vehicle ? `Interested in ${vehicle.title}` : undefined,
        renderedAtMs: Date.now(),
      });
      addBot(
        getFlowPrompt("tradeInDone", chatLang, {
          year: data.year,
          make,
          model,
          low: fmtZAR(res.estimateLow),
          high: fmtZAR(res.estimateHigh),
          mid: fmtZAR(res.estimateMid),
          vehicle: vehicle?.title ?? "new car",
        }),
      );
      setFlow("menu");
    } catch (e) {
      addBot(
        getFlowPrompt("errorSubmit", chatLang, {
          message: e instanceof Error ? e.message : "could not estimate",
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const submitEnquiry = async (data: Record<string, string>) => {
    if (!vehicle) return;
    setBusy(true);
    try {
      await enquire.mutateAsync({
        vehicleId: vehicle.id,
        vehicleTitle: vehicle.title,
        vehiclePrice: vehicle.price,
        vehicleYear: vehicle.year,
        vehicleKm: vehicle.km,
        vehicleFuel: vehicle.fuel,
        vehicleTransmission: vehicle.transmission,
        vehicleImage: vehicle.image,
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        clientMessage: data.notes || undefined,
        dealershipEmail: "hello@grayarx.com",
        dealershipName,
        // notes passed via inbound - extend if API supports; question is in draft.notes
      });
      const lang = (data.lang as ShowroomLang | undefined) ?? chatLang;
      addBot(thanksForEnquiry(lang, data.name, dealershipName, vehicle));
      setFlow("menu");
    } catch (e) {
      addBot(
        getFlowPrompt("errorSubmit", chatLang, {
          message: e instanceof Error ? e.message : "could not send",
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const processInput = async (text: string) => {
    const val = text.trim();
    if (!val || busy) return;
    addUser(val);
    setInput("");

    const next = { ...draft };

    if (flow === "menu") {
      if (!vehicle) return;
      const lang = detectShowroomLanguage(val);
      setChatLang(lang);
      setBusy(true);

      const vehicleId = Number.parseInt(String(vehicle.id), 10);
      let res: {
        reply: string;
        agent?: RoutedAgentId;
        intent: string;
        language: LanguageCode;
        actions?: ChatAction[];
      };

      try {
        if (Number.isFinite(vehicleId) && vehicleId > 0) {
          res = await showroomChat.mutateAsync({
            vehicleId,
            message: val,
            dealershipName,
            language: lang,
          });
        } else {
          throw new Error("invalid vehicle id");
        }
      } catch {
        res = resolveLocalMenuReply(vehicle, val, lang, dealershipName);
      }

      try {
        addBot(res.reply, res.agent ?? "nala", res.actions?.length ? res.actions : undefined);

        if (res.agent === "lerato" && res.intent === "test_drive") {
          setFlow("test_drive");
          setStep(0);
          setDraft({ lang: res.language });
          return;
        }

        if (res.agent === "tumi" && res.intent === "trade_in") {
          setFlow("trade_in");
          setStep(0);
          setDraft({ lang: res.language });
          return;
        }

        const needsLeadCapture =
          res.intent === "general" ||
          (res.intent === "color" && !vehicle.color?.trim()) ||
          (res.intent === "location" && !vehicle.location?.trim());

        if (needsLeadCapture) {
          setFlow("enquiry");
          setStep(1);
          setDraft({ notes: val, lang: res.language });
          if (!replyNeedsNameCapture(res.reply)) {
            addBot(getLocalizedPrompt("askName", res.language as ShowroomLang));
          }
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    if (flow === "test_drive") {
      const lang = (draft.lang as ShowroomLang | undefined) ?? chatLang;
      if (step === 0) {
        next.name = val;
        setDraft(next);
        setStep(1);
        addBot(getFlowPrompt("testDriveContact", lang));
      } else if (step === 1) {
        next.contact = val;
        setDraft(next);
        setStep(2);
        addBot(getFlowPrompt("testDriveDate", lang));
      } else if (step === 2) {
        if (!isSkipReply(val)) {
          next.date = val;
          setStep(3);
          addBot(getFlowPrompt("testDriveTime", lang));
        } else {
          await submitTestDrive(next);
        }
      } else if (step === 3) {
        if (!isSkipReply(val)) next.time = val;
        await submitTestDrive(next);
      }
    } else if (flow === "pre_approval") {
      const lang = (draft.lang as ShowroomLang | undefined) ?? chatLang;
      if (step === 0) {
        next.name = val;
        setStep(1);
        addBot(getLocalizedPrompt("askEmail", lang));
      } else if (step === 1) {
        next.email = val;
        setStep(2);
        addBot(getLocalizedPrompt("askPhone", lang));
      } else if (step === 2) {
        next.phone = val;
        setStep(3);
        addBot(getFlowPrompt("preApprovalIncome", lang));
      } else if (step === 3) {
        if (!isSkipReply(val)) next.income = val;
        setStep(4);
        addBot(getFlowPrompt("preApprovalDeposit", lang));
      } else if (step === 4) {
        if (!isSkipReply(val)) next.deposit = val;
        setStep(5);
        addBot(getFlowPrompt("preApprovalTerm", lang));
      } else if (step === 5) {
        if (!isSkipReply(val)) next.term = val;
        await submitPreApproval(next);
      }
    } else if (flow === "trade_in") {
      const lang = (draft.lang as ShowroomLang | undefined) ?? chatLang;
      if (step === 0) {
        const make = resolveMake(val);
        next.make = make;
        setDraft(next);
        setStep(1);
        addBot(
          make !== val
            ? getFlowPrompt("tradeInModelConfirm", lang, { value: make })
            : getFlowPrompt("tradeInModel", lang),
        );
      } else if (step === 1) {
        const model = resolveModel(next.make ?? "", val);
        next.model = model;
        setDraft(next);
        setStep(2);
        addBot(
          model !== val
            ? getFlowPrompt("tradeInYearConfirm", lang, { value: model })
            : getFlowPrompt("tradeInYear", lang),
        );
      } else if (step === 2) {
        next.year = val;
        setStep(3);
        addBot(getFlowPrompt("tradeInKm", lang));
      } else if (step === 3) {
        next.km = val;
        setStep(4);
        addBot(getFlowPrompt("tradeInCondition", lang));
      } else if (step === 4) {
        next.condition = val.toLowerCase();
        setStep(5);
        addBot(getLocalizedPrompt("askName", lang));
      } else if (step === 5) {
        next.name = val;
        setStep(6);
        addBot(getLocalizedPrompt("askPhone", lang));
      } else if (step === 6) {
        next.contact = val;
        await submitTradeIn(next);
      }
    } else if (flow === "enquiry") {
      const lang = (draft.lang as ShowroomLang | undefined) ?? "en";
      if (step === 0) {
        next.notes = val;
        setStep(1);
        addBot(getLocalizedPrompt("askName", lang));
      } else if (step === 1) {
        next.name = val;
        setStep(2);
        addBot(getLocalizedPrompt("askEmail", lang));
      } else if (step === 2) {
        next.email = val;
        setStep(3);
        addBot(getLocalizedPrompt("askPhone", lang));
      } else if (step === 3) {
        next.phone = val;
        await submitEnquiry(next);
      }
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part.split("\n").map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  if (!vehicle) return null;

  const headerAgent = AGENT_HEADER[activeAgent];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-[#060608]/70 backdrop-blur-md z-[60]"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[440px] z-[70] flex flex-col rounded-2xl border border-primary/30 bg-[#0a0a0c]/95 shadow-2xl shadow-black/60 overflow-hidden max-h-[88vh] holo-card scan-line"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-primary/20 bg-gradient-to-r from-primary/12 via-transparent to-cyan-500/5">
              {vehicle.image ? (
                <img src={vehicle.image} alt="" className="w-10 h-10 rounded-lg object-cover ring-1 ring-primary/30" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {headerAgent.name} · {headerAgent.role}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">
                  {formatVehicleDisplayName(vehicle.year, vehicle.title)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[300px] max-h-[52vh] scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/20"
                          : "bg-muted/40 text-foreground rounded-bl-md border border-primary/15 backdrop-blur-sm",
                      )}
                    >
                      {msg.role === "bot" && msg.agent && msg.agent !== "nala" && (
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1.5">
                          {AGENT_HEADER[msg.agent].name}
                        </p>
                      )}
                      {renderMarkdown(msg.text)}
                    </div>
                    {msg.role === "bot" && msg.actions && msg.actions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.3 }}
                        className="flex flex-wrap gap-2 mt-2 max-w-[88%]"
                      >
                        {msg.actions.map((action) => (
                          <a
                            key={action.url}
                            href={action.url}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/8 hover:bg-primary/18 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/50"
                          >
                            {action.label}
                            <ChevronRight className="h-3 w-3" />
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted/40 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground border border-primary/10">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{getFlowPrompt("working", chatLang)}</span>
                    <span className="inline-flex gap-1" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-primary/70"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Quick actions when back at menu */}
              {flow === "menu" && !busy && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="grid grid-cols-2 gap-2 pt-2"
                >
                  <QuickAction icon={Calendar} label={getFlowPrompt("quickTestDrive", chatLang)} onClick={() => startFlow("test_drive")} delay={0} />
                  <QuickAction icon={Banknote} label={getFlowPrompt("quickPreApproval", chatLang)} onClick={() => startFlow("pre_approval")} delay={0.05} />
                  <QuickAction icon={Car} label={getFlowPrompt("quickTradeIn", chatLang)} onClick={() => startFlow("trade_in")} delay={0.1} />
                  <QuickAction icon={MessageCircle} label={getFlowPrompt("quickAsk", chatLang)} onClick={() => startFlow("enquiry")} delay={0.15} />
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-primary/20 p-3 bg-[#08080a]/90 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processInput(input);
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    flow === "menu"
                      ? getFlowPrompt("inputMenu", chatLang)
                      : getFlowPrompt("inputReply", chatLang)
                  }
                  disabled={busy}
                  className="flex-1 h-11 bg-black/40 border-primary/25 focus-visible:ring-primary/30"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={busy || !input.trim()}
                  className="btn-gold h-11 w-11 shrink-0 transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="font-tech text-[9px] uppercase tracking-[0.18em] text-muted-foreground text-center mt-2.5">
                {headerAgent.name} · 11 SA languages · Native grammar templates · POPIA compliant
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, borderColor: "rgba(212,175,55,0.45)" }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/12 px-3 py-2.5 text-left text-xs font-medium transition-colors group"
    >
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="flex-1 leading-snug">{label}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </motion.button>
  );
}

export default ShowroomChatAgent;
