import { useEffect, useState } from "react";
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

export default function DealerSettings() {
  const utils = trpc.useUtils();

  const { data: deployment, isLoading: loadingDeployment } = trpc.chatbot.getDeployment.useQuery();
  const { data: appearance, isLoading: loadingAppearance } = trpc.dealer.getAppearance.useQuery();

  const [webChatEnabled, setWebChatEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [showroomTheme, setShowroomTheme] = useState<ShowroomThemeId>("classic");
  const [brandAccentColor, setBrandAccentColor] = useState("#d4af37");

  useEffect(() => {
    if (appearance) {
      setShowroomTheme(appearance.theme);
      setBrandAccentColor(appearance.brandAccentColor ?? "#d4af37");
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
      subtitle="Control your public showroom look and contact icons."
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
                <Button
                  className="btn-gold shrink-0"
                  disabled={saveAppearanceMutation.isPending}
                  onClick={() =>
                    saveAppearanceMutation.mutate({
                      theme: showroomTheme,
                      brandAccentColor: brandAccentColor.trim() || null,
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
              </div>
              <Button asChild variant="outline" className="btn-cyber bg-transparent">
                <Link href="/showroom" target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview showroom
                </Link>
              </Button>
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
                  <Link href="/showroom">
                    <Eye className="mr-2 h-4 w-4" />
                    View live showroom
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
