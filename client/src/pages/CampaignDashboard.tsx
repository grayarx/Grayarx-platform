import AdminShell from "@/components/AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { PILOT_SEGMENT_LABELS, type PilotOutreachSegment } from "@shared/pilotProspectSegments";
import { CheckCircle2, Eye, HelpCircle, Loader2, Mail, Megaphone, Send, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SEGMENT_TOOLTIPS: Record<PilotOutreachSegment, string> = {
  no_website_social_only:
    "Dealers who only have a Facebook page or WhatsApp number — no real website. Pain point: their stock is invisible to Google. GrayArx gives them a full AI showroom instantly.",
  basic_website_no_showroom:
    "Dealers with a basic website (usually WordPress or a listing page) but no live chat, no AI qualification, and no after-hours agent. Pain point: leads fall through overnight and on weekends.",
  after_hours_leak:
    "Dealers whose site or staff goes offline at 5pm. Buyers browse at 8pm and get nothing. Bongi (GrayArx after-hours AI) captures and qualifies those leads automatically.",
  whatsapp_manual:
    "Dealers who handle WhatsApp enquiries manually — a staff member types every reply. Pain point: slow response, no booking flow, staff overloaded. Lerato (GrayArx WhatsApp AI) automates this 24/7.",
};

const SEGMENTS: PilotOutreachSegment[] = [
  "no_website_social_only",
  "basic_website_no_showroom",
  "after_hours_leak",
  "whatsapp_manual",
];

export default function CampaignDashboard() {
  const [testEmail, setTestEmail] = useState("grayarx@gmail.com");
  const [testSegment, setTestSegment] = useState<PilotOutreachSegment>("basic_website_no_showroom");

  const { data: preview, isLoading } = trpc.pilotEmail.preview.useQuery();
  const { data: branding } = trpc.pilotEmail.brandingCheck.useQuery();

  const sendTest = trpc.pilotEmail.sendTest.useMutation({
    onSuccess: (r) => {
      if (r.success) toast.success(`Test email sent (${r.messageId ?? "ok"})`);
      else toast.error(r.error ?? "Send failed");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendSegment = trpc.pilotEmail.sendSegment.useMutation({
    onSuccess: (r) => {
      toast.success(`Segment ${PILOT_SEGMENT_LABELS[r.segment]}: ${r.sent}/${r.attempted} ok`);
    },
    onError: (e) => toast.error(e.message),
  });

  const sendBulk = trpc.pilotEmail.sendBulk.useMutation({
    onSuccess: (r) => {
      toast.success(
        r.dryRun
          ? `Dry run complete — ${r.totalSent}/${r.totalAttempted} mailable`
          : `Bulk send — ${r.totalSent} sent, ${r.totalFailed} failed`,
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const totalMailable = preview?.reduce((s, p) => s + p.mailable, 0) ?? 0;

  return (
    <AdminShell
      title="Pilot outreach"
      subtitle="Segmented Resend campaigns for Gauteng dealership research — dry-run first, then send."
      actions={
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={sendBulk.isPending}
                onClick={() => sendBulk.mutate({ dryRun: true })}
              >
                {sendBulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Dry-run all segments
                <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-left">
              <strong>Dry-run:</strong> Simulates the full send without emailing anyone.
              The system counts exactly how many emails would go out per segment and returns{" "}
              <code>resendId: "dry-run"</code> for every row. Zero emails hit real inboxes.
              Use this to verify counts + spot duplicates before committing to a live send.
            </TooltipContent>
          </Tooltip>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Branding + Resend status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                Mailable prospects
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left">
                    Prospects where <code>emailVerified = true</code> — meaning the email was
                    confirmed on their official website or business listing. These are safe to
                    send to via Resend. Rows without a verified email are for WhatsApp/Facebook
                    follow-up only.
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalMailable}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified public emails only</p>
            </CardContent>
          </Card>
          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Resend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {branding?.resendConfigured ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                )}
                <span className="font-medium">
                  {branding?.resendConfigured ? "Configured" : "Missing API key"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">From: pilot@grayarx.com</p>
            </CardContent>
          </Card>
          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Body logo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-mono break-all">{branding?.bodyLogoUrl ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-2">Inline CID attachment in Resend sends</p>
            </CardContent>
          </Card>
        </div>

        {/* Send test */}
        <Card className="glass-gold border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Send test email
            </CardTitle>
            <CardDescription>Verify logo + template before bulk send</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="test-email">To</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64 space-y-1">
              <Label>Segment</Label>
              <Select value={testSegment} onValueChange={(v) => setTestSegment(v as PilotOutreachSegment)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PILOT_SEGMENT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="btn-gold shrink-0"
              disabled={sendTest.isPending || !testEmail}
              onClick={() => sendTest.mutate({ to: testEmail, segment: testSegment })}
            >
              {sendTest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send test
            </Button>
          </CardContent>
        </Card>

        {/* Segments */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Segments
          </h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading prospects…
            </div>
          ) : (
            preview?.map((row) => (
              <Card key={row.segment} className="glass-gold border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-1.5">
                        {PILOT_SEGMENT_LABELS[row.segment]}
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-left">
                            {SEGMENT_TOOLTIPS[row.segment]}
                          </TooltipContent>
                        </Tooltip>
                      </CardTitle>
                      <CardDescription className="mt-1">{row.label}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help">{row.mailable} mailable</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Prospects with a verified email — these are the only ones that will
                          receive emails in a live send.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="cursor-help">{row.total} researched</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Total prospects researched for this segment, including those without
                          a verified email (WhatsApp/Facebook follow-up candidates).
                        </TooltipContent>
                      </Tooltip>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-1" /> Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Email preview — {PILOT_SEGMENT_LABELS[row.segment]}</DialogTitle>
                          </DialogHeader>
                          <iframe
                            title="Pilot email preview"
                            className="w-full min-h-[480px] border rounded bg-white"
                            srcDoc={row.sampleHtml}
                          />
                        </DialogContent>
                      </Dialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendSegment.isPending || row.mailable === 0}
                            onClick={() =>
                              sendSegment.mutate({ segment: row.segment, dryRun: true })
                            }
                          >
                            Dry-run
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-left">
                          Simulates sending this segment only — no emails are delivered.
                          Returns a count of how many would be sent and flags any issues.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            className="btn-gold"
                            disabled={sendSegment.isPending || row.mailable === 0}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Send ${row.mailable} emails for segment "${PILOT_SEGMENT_LABELS[row.segment]}"?`,
                                )
                              ) {
                                return;
                              }
                              sendSegment.mutate({ segment: row.segment, dryRun: false });
                            }}
                          >
                            Send segment
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-left">
                          LIVE send — delivers real emails via Resend to all{" "}
                          {row.mailable} verified addresses in this segment.
                          Always dry-run first.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {row.prospects.slice(0, 5).map((p) => (
                      <li key={p.id}>
                        {p.name} — {p.city}
                        {p.emailVerified && p.email ? (
                          <span className="text-emerald-400/80"> · {p.email}</span>
                        ) : (
                          <span className="text-amber-400/80"> · no verified email</span>
                        )}
                      </li>
                    ))}
                    {row.prospects.length > 5 && (
                      <li className="text-xs">+{row.prospects.length - 5} more in research list</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
