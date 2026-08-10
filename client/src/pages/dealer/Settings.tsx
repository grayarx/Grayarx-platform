import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings2,
  MessageCircle,
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
  Eye,
  Palette,
  Scale,
  Code2,
  Copy,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import DealerShell from "@/components/DealerShell";
import ShowroomThemePicker from "@/components/ShowroomThemePicker";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OWNER_PHONE_E164 } from "@/lib/contact";
import type { ShowroomThemeId } from "@shared/showroomThemes";

function copyText(label: string, value: string) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Could not copy — select the text manually"),
  );
}

export default function DealerSettings() {
  const utils = trpc.useUtils();

  const { data: deployment, isLoading: loadingDeployment } = trpc.chatbot.getDeployment.useQuery();
  const { data: appearance, isLoading: loadingAppearance } = trpc.dealer.getAppearance.useQuery();

  const [webChatEnabled, setWebChatEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [showroomTheme, setShowroomTheme] = useState<ShowroomThemeId>("classic");
  const [brandAccentColor, setBrandAccentColor] = useState("#d4af37");
  const [agentDisplayName, setAgentDisplayName] = useState("");

  const shortcode = appearance?.publicShortcode?.trim() || null;
  const waLinked = Boolean(appearance?.whatsappPhoneNumberId?.trim());
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.grayarx.com";

  const embedSnippets = useMemo(() => {
    if (!shortcode) return null;
    const embedUrl = `${origin}/embed/${encodeURIComponent(shortcode)}`;
    const name = appearance?.dealershipName ?? "Dealership";
    return {
      iframe: `<iframe src="${embedUrl}" title="${name} booking" width="100%" height="640" style="border:0;border-radius:12px;max-width:420px;" loading="lazy" allow="clipboard-write"></iframe>`,
      script: `<script async src="${origin}/embed/${encodeURIComponent(shortcode)}.js"></script>`,
      bookUrl: `${origin}/book/${encodeURIComponent(shortcode)}`,
      applyUrl: `${origin}/apply/${encodeURIComponent(shortcode)}`,
      embedUrl,
    };
  }, [shortcode, origin, appearance?.dealershipName]);

  useEffect(() => {
    if (appearance) {
      setShowroomTheme(appearance.theme);
      setBrandAccentColor(appearance.brandAccentColor ?? "#d4af37");
      setAgentDisplayName(appearance.agentDisplayName ?? "");
    }
  }, [appearance]);

  const saveAppearanceMutation = trpc.dealer.updateAppearance.useMutation({
    onSuccess: () => {
      utils.dealer.getAppearance.invalidate();
      utils.showroom.appearance.invalidate();
      toast.success("Showroom look saved");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (deployment) {
      setWebChatEnabled(deployment.webChatbotEnabled);
      setWhatsappEnabled(deployment.whatsappChatbotEnabled);
      setWhatsappPhone(deployment.whatsappPhoneNumber ?? OWNER_PHONE_E164);
    } else if (!loadingDeployment) {
      setWhatsappPhone(OWNER_PHONE_E164);
    }
  }, [deployment, loadingDeployment]);

  const saveMutation = trpc.chatbot.updateDeployment.useMutation({
    onSuccess: () => {
      utils.chatbot.getDeployment.invalidate();
      utils.showroom.contactOptions.invalidate();
      toast.success("Showroom settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (whatsappEnabled && !whatsappPhone.trim()) {
      toast.error("Enter a WhatsApp number before enabling WhatsApp icons");
      return;
    }
    saveMutation.mutate({
      deploymentType:
        webChatEnabled && whatsappEnabled
          ? "both"
          : whatsappEnabled
            ? "whatsapp"
            : "web",
      webChatbotEnabled: webChatEnabled,
      whatsappChatbotEnabled: whatsappEnabled,
      whatsappPhoneNumber: whatsappPhone.trim() || undefined,
    });
  };

  return (
    <DealerShell
      title="Settings"
      subtitle="Control your public showroom look, embed, and contact icons."
    >
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Showroom template
          </CardTitle>
          <CardDescription>
            Pick a clean layout for your public showroom. You stay in control — switch anytime
            without touching code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingAppearance ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading templates…
            </div>
          ) : (
            <>
              <ShowroomThemePicker
                value={showroomTheme}
                onChange={setShowroomTheme}
                disabled={saveAppearanceMutation.isPending}
              />
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 max-w-md">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="accent-color">Accent colour (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      value={brandAccentColor}
                      onChange={(e) => setBrandAccentColor(e.target.value)}
                      placeholder="#d4af37"
                      className="font-mono"
                    />
                    <input
                      type="color"
                      value={brandAccentColor.startsWith("#") ? brandAccentColor : "#d4af37"}
                      onChange={(e) => setBrandAccentColor(e.target.value)}
                      className="h-10 w-12 rounded-md border border-border cursor-pointer bg-transparent"
                      aria-label="Pick accent colour"
                    />
                  </div>
                </div>
              </div>
              <div className="max-w-md space-y-2">
                <Label htmlFor="agent-display-name">Assistant display name</Label>
                <Input
                  id="agent-display-name"
                  value={agentDisplayName}
                  onChange={(e) => setAgentDisplayName(e.target.value)}
                  placeholder="Nala"
                  maxLength={40}
                />
                <p className="text-xs text-muted-foreground">
                  Shown in WhatsApp greetings and the AI disclosure line. Leave blank for Nala.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="btn-gold shrink-0"
                  disabled={saveAppearanceMutation.isPending}
                  onClick={() =>
                    saveAppearanceMutation.mutate({
                      theme: showroomTheme,
                      brandAccentColor: brandAccentColor.trim() || null,
                      agentDisplayName: agentDisplayName.trim() || null,
                    })
                  }
                >
                  {saveAppearanceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save look
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="btn-cyber bg-transparent"
                  disabled={!shortcode && !appearance}
                >
                  <Link
                    href={
                      shortcode
                        ? `/showroom?shortcode=${encodeURIComponent(shortcode)}`
                        : "/showroom"
                    }
                    target="_blank"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview showroom
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg">
                Preview opens <span className="text-foreground font-medium">your</span>{" "}
                public showroom with the saved theme and accent. Assistant name applies to
                WhatsApp / chat greetings, not the listing grid.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="max-w-2xl">
        {/* Showroom contact icons */}
        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" />
              Showroom contact icons
            </CardTitle>
            <CardDescription>
              Choose which contact buttons appear on vehicle photos in your public showroom.
              Nala opens a contextual chat about the exact car the buyer clicked.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingDeployment ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading settings…
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp-toggle" className="text-sm font-semibold">
                        WhatsApp icon
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Green button on each vehicle — opens WhatsApp with a pre-filled message.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="whatsapp-toggle"
                    checked={whatsappEnabled}
                    onCheckedChange={setWhatsappEnabled}
                  />
                </div>

                {whatsappEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label htmlFor="whatsapp-phone">WhatsApp number</Label>
                    <Input
                      id="whatsapp-phone"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+27 79 491 5187"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code. Buyers will message this number directly.
                    </p>
                  </motion.div>
                )}

                <div className="rounded-xl border border-[#25D366]/25 bg-[#25D366]/5 p-4 space-y-3">
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      waLinked
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {waLinked ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      {waLinked
                        ? "WhatsApp AI is connected — Nala answers buyers 24/7."
                        : "WhatsApp AI isn’t connected yet — follow the steps below."}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    WhatsApp AI setup checklist
                  </p>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                    <li>
                      Get a verified{" "}
                      <span className="text-foreground font-medium">WhatsApp Business</span> number
                      on Meta (Cloud API). Without it, AI chat on WhatsApp cannot run — webchat +
                      showroom + wa.me click-to-human still work.
                    </li>
                    <li>
                      Meta phone_number_id:{" "}
                      {waLinked ? (
                        <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Linked
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Not linked yet — auto-links when your contact phone matches Meta&apos;s
                          display number, or ask GrayArx to paste the phone_number_id
                        </span>
                      )}
                    </li>
                    <li>
                      Confirm Meta webhooks are subscribed for your phone number (GrayArx ops).
                    </li>
                    <li>
                      Send a test WhatsApp to your yard number and confirm the assistant replies.
                    </li>
                  </ol>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t border-[#25D366]/20">
                    <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <p>
                      Nala answers WhatsApp and webchat <span className="text-foreground font-medium">24/7</span>{" "}
                      once linked — stock questions and bookings overnight, not only business hours.
                      Buyers can reply STOP to pause automated follow-ups; START turns help back on.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor="webchat-toggle" className="text-sm font-semibold">
                        Web chat icon
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gold sparkle button — opens the enquiry form for that vehicle.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="webchat-toggle"
                    checked={webChatEnabled}
                    onCheckedChange={setWebChatEnabled}
                  />
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-primary/20 bg-card/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Preview on showroom
                  </p>
                  <div className="relative aspect-[16/10] rounded-lg bg-muted overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      {whatsappEnabled && (
                        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                          <MessageCircle className="h-3.5 w-3.5 text-white fill-white" />
                        </div>
                      )}
                      {webChatEnabled && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      {!whatsappEnabled && !webChatEnabled && (
                        <span className="text-xs text-muted-foreground">No icons enabled</span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full btn-gold"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save showroom settings
                    </>
                  )}
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link
                    href={
                      shortcode
                        ? `/showroom?shortcode=${encodeURIComponent(shortcode)}`
                        : "/showroom"
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View live showroom
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/15 mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            Website embed
          </CardTitle>
          <CardDescription>
            Drop this on your site for bookings. Same shortcode powers book and apply links — no
            plugin required for a plain iframe or script tag.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAppearance ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading shortcode…
            </div>
          ) : !shortcode || !embedSnippets ? (
            <p className="text-sm text-muted-foreground">
              Your public shortcode is still being set up. Contact GrayArx — once it appears here,
              copy the snippets below.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Your shortcode</span>
                <code className="font-mono text-primary bg-muted/40 px-2 py-0.5 rounded">
                  {shortcode}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => copyText("Shortcode", shortcode)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Iframe (copy-paste)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyText("Iframe snippet", embedSnippets.iframe)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy iframe
                  </Button>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all rounded-lg border border-border/60 bg-muted/30 p-3 max-h-32 overflow-auto">
                  {embedSnippets.iframe}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Script tag</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyText("Script snippet", embedSnippets.script)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy script
                  </Button>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all rounded-lg border border-border/60 bg-muted/30 p-3">
                  {embedSnippets.script}
                </pre>
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <button
                  type="button"
                  className="text-left rounded-lg border border-border/50 bg-muted/20 p-3 hover:border-primary/40 transition-colors"
                  onClick={() => copyText("Book URL", embedSnippets.bookUrl)}
                >
                  <span className="font-semibold text-foreground block mb-1">Book URL</span>
                  <span className="font-mono break-all">{embedSnippets.bookUrl}</span>
                </button>
                <button
                  type="button"
                  className="text-left rounded-lg border border-border/50 bg-muted/20 p-3 hover:border-primary/40 transition-colors"
                  onClick={() => copyText("Apply URL", embedSnippets.applyUrl)}
                >
                  <span className="font-semibold text-foreground block mb-1">Apply URL</span>
                  <span className="font-mono break-all">{embedSnippets.applyUrl}</span>
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/15 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Legal & compliance
          </CardTitle>
          <CardDescription>
            Terms, privacy, DPA, dealer agreement, and POPIA forms — one place for your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dealer/legal">Open compliance pack</Link>
          </Button>
        </CardContent>
      </Card>
    </DealerShell>
  );
}
