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

  const utils = trpc.useUtils();
  const { data: preview, isLoading } = trpc.pilotEmail.preview.useQuery();
  const { data: branding } = trpc.pilotEmail.brandingCheck.useQuery();
  const { data: recentSends } = trpc.pilotEmail.recentSends.useQuery({ limit: 20 });

  const refreshPreview = () => {
    void utils.pilotEmail.preview.invalidate();
    void utils.pilotEmail.recentSends.invalidate();
  };

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
      refreshPreview();
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
      refreshPreview();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalMailable = preview?.reduce((s, p) => s + p.mailable, 0) ?? 0;
  const totalRemaining = preview?.reduce((s, p) => s + (p.remaining ?? p.mailable), 0) ?? 0;

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
              <div className="text-3xl font-bold">{totalRemaining}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMailable} verified · {totalMailable - totalRemaining} already emailed
              </p>
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
              <p className="text-xs text-muted-foreground mt-2">
                Circular crest over HTTPS (not cid:, not full lockup)
              </p>
            </CardContent>
          </Card>
        </div>

        {(recentSends?.length ?? 0) > 0 && (
          <Card className="glass-gold border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent sends (accepted by Resend)</CardTitle>
              <CardDescription>
                Logged when Resend returns a message id — not opens or bounces. Full detail:{" "}
                <a
                  href="https://resend.com/emails"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  resend.com/emails
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1.5 max-h-48 overflow-y-auto">
                {recentSends!.map((s) => (
                  <li key={`${s.email}-${s.sentAt}`} className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground">
                    <span className="text-foreground font-medium">{s.dealershipName}</span>
                    <span>{s.email}</span>
                    <span>{new Date(s.sentAt).toLocaleString()}</span>
                    {s.resendId ? (
                      <span className="font-mono text-[11px] text-emerald-400/90">{s.resendId}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

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
                          <Badge variant="outline" className="cursor-help">
                            {row.remaining ?? row.mailable} ready to send
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Verified emails not yet contacted — live send only hits these.
                        </TooltipContent>
                      </Tooltip>
                      {(row.alreadyEmailed ?? 0) > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 cursor-help">
                              {row.alreadyEmailed} emailed
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Already received a pilot email — skipped on the next live send.
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="cursor-help">
                            {row.totalResearched ?? row.total} researched
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Total researched for this segment. Only verified emails appear in the
                          list below — no-email dealers stay in research docs for WhatsApp/Facebook.
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
                            disabled={
                              sendSegment.isPending || (row.remaining ?? row.mailable) === 0
                            }
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
                            disabled={
                              sendSegment.isPending || (row.remaining ?? row.mailable) === 0
                            }
                            onClick={() => {
                              const n = row.remaining ?? row.mailable;
                              if (
                                !window.confirm(
                                  `Send ${n} emails for segment "${PILOT_SEGMENT_LABELS[row.segment]}"? Already-emailed dealers will be skipped.`,
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
                          LIVE send — delivers via Resend to{" "}
                          {row.remaining ?? row.mailable} remaining verified addresses.
                          Already-emailed rows are skipped. Always dry-run first.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {row.prospects.length === 0 ? (
                    <p className="text-sm text-amber-400/90">
                      No verified emails in this segment — research-only dealers (WhatsApp/Facebook)
                      are hidden from outreach.
                    </p>
                  ) : (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {row.prospects.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            {p.name} — {p.city}
                            <span className="text-emerald-400/80"> · {p.email}</span>
                          </span>
                          {p.alreadyEmailed ? (
                            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] h-5">
                              Emailed
                              {p.lastEmailedAt
                                ? ` ${new Date(p.lastEmailedAt).toLocaleDateString()}`
                                : ""}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-5">
                              Not sent
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
