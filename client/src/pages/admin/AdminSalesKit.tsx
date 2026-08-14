import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FOUNDER_SALES_KIT_META,
  SALES_KIT_CLOSE,
  SALES_KIT_MONEY_ASK,
  SALES_KIT_OBJECTIONS,
  SALES_KIT_OPENER,
  SALES_KIT_PRECALL,
  SALES_KIT_RELATED_DOCS,
  type SalesKitSection,
} from "@shared/founderSalesKit";
import { Copy, ExternalLink, Phone } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`Copied: ${label}`),
    () => toast.error("Could not copy"),
  );
}

function SectionCard({ section }: { section: SalesKitSection }) {
  return (
    <Card className="card-premium border-primary/15">
      <CardContent className="p-5 md:p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold">{section.title}</h2>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          {section.body.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-primary mt-1.5 h-1 w-1 rounded-full shrink-0 bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {section.paste?.length ? (
          <div className="space-y-2 pt-2 border-t border-primary/10">
            <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-primary/70">
              Paste-ready
            </p>
            {section.paste.map((p) => (
              <div
                key={p.slice(0, 40)}
                className="flex gap-2 items-start rounded-lg border border-primary/10 bg-black/30 p-3"
              >
                <p className="text-xs text-foreground/90 flex-1 whitespace-pre-wrap">{p}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-8"
                  onClick={() => copyText(section.title, p)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function AdminSalesKit() {
  return (
    <AdminShell
      title={FOUNDER_SALES_KIT_META.title}
      subtitle={`${FOUNDER_SALES_KIT_META.audience}. ${FOUNDER_SALES_KIT_META.contact}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="tel:+27794915187">
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Call line
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/prospector">
              Prospector <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-3xl">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 md:p-6">
            <p className="font-tech text-[10px] uppercase tracking-[0.25em] text-primary mb-2">
              Money ask (default)
            </p>
            <p className="text-sm md:text-base text-foreground leading-relaxed">
              {FOUNDER_SALES_KIT_META.moneyAskLine}
            </p>
            <Button
              type="button"
              className="btn-gold mt-4 h-10"
              onClick={() =>
                copyText("Money ask", FOUNDER_SALES_KIT_META.moneyAskLine)
              }
            >
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy money ask
            </Button>
          </CardContent>
        </Card>

        <SectionCard section={SALES_KIT_PRECALL} />
        <SectionCard section={SALES_KIT_OPENER} />
        <SectionCard section={SALES_KIT_MONEY_ASK} />

        <div>
          <h2 className="font-display text-xl font-semibold mb-3">Objections</h2>
          <div className="grid gap-4">
            {SALES_KIT_OBJECTIONS.map((s) => (
              <SectionCard key={s.id} section={s} />
            ))}
          </div>
        </div>

        <SectionCard section={SALES_KIT_CLOSE} />

        <div className="text-xs text-muted-foreground space-y-1 pb-8">
          <p className="font-tech uppercase tracking-wider text-primary/60 mb-2">Related docs</p>
          {SALES_KIT_RELATED_DOCS.map((d) => (
            <p key={d.path}>
              <code className="text-foreground/80">{d.path}</code> — {d.label}
            </p>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
