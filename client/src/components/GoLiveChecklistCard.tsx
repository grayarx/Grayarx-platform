import { Link } from "wouter";
import { CheckCircle2, Circle, Rocket, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

/**
 * Time-to-live checklist — stock → showroom → WhatsApp → drip (+ optional sync).
 * Hidden when already live and all required steps are done (still shows if optional sync pending? hide when isLive).
 */
export default function GoLiveChecklistCard() {
  const { data, isLoading } = trpc.dealer.goLive.useQuery(undefined, {
    staleTime: 30_000,
  });

  if (isLoading || !data) return null;
  if (data.isLive && data.percent >= 100) return null;

  return (
    <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Rocket className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Go live this week
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.isLive
                  ? "Core desk is live — optional stock sync keeps inventory fresh."
                  : `${data.completedRequired}/${data.requiredTotal} required steps · ${data.percent}% — buyers need stock + showroom + WhatsApp.`}
              </p>
            </div>
          </div>
          {data.nextStep && (
            <Button asChild size="sm" className="shrink-0">
              <Link href={data.nextStep.href}>
                Next: {data.nextStep.label}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
          <div
            className="h-full bg-amber-400/90 transition-all"
            style={{ width: `${data.percent}%` }}
          />
        </div>

        <ul className="space-y-2">
          {data.steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors"
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {step.label}
                    {step.optional ? (
                      <span className="text-[10px] text-muted-foreground font-normal ml-1.5">
                        optional
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{step.hint}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
