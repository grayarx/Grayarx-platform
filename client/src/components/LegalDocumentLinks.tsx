import { Link } from "wouter";
import {
  LEGAL_DOCUMENTS,
  PILOT_SIGN_OFF_DOCS,
  type LegalDocument,
  type LegalDocCategory,
} from "@shared/legalDocuments";
import { GRAYARX_LEGAL } from "@shared/companyLegal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<LegalDocCategory, string> = {
  platform: "Platform policies",
  pilot: "Pilot sign-off (before go-live)",
  compliance: "Compliance & disclosures",
};

function DocRow({ doc, compact }: { doc: LegalDocument; compact?: boolean }) {
  return (
    <Link href={doc.href}>
      <div
        className={cn(
          "group flex items-start gap-3 rounded-xl border border-primary/10 bg-card/40 p-4 transition-colors hover:border-primary/30 hover:bg-card/70",
          compact && "p-3",
        )}
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {doc.signOff ? (
            <PenLine className="h-4 w-4 text-primary" />
          ) : (
            <FileText className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium group-hover:text-primary transition-colors">
              {doc.title}
            </span>
            {doc.signOff && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Sign before go-live
              </Badge>
            )}
          </div>
          {!compact && (
            <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
          )}
        </div>
        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

export function LegalDocumentLinks({
  categories,
  showPilotBanner = true,
  compact = false,
}: {
  categories?: LegalDocCategory[];
  showPilotBanner?: boolean;
  compact?: boolean;
}) {
  const docs = categories
    ? LEGAL_DOCUMENTS.filter((d) => categories.includes(d.category))
    : LEGAL_DOCUMENTS;

  const grouped = (["pilot", "platform", "compliance"] as LegalDocCategory[]).filter(
    (c) => docs.some((d) => d.category === c),
  );

  return (
    <div className="space-y-8">
      {showPilotBanner && PILOT_SIGN_OFF_DOCS.length > 0 && (
        <Card className="border-amber-500/25 bg-amber-500/5">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-amber-200/90">Pilot dealerships</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Before we activate your account, please review and sign the{" "}
              <strong className="text-foreground">Dealer Agreement</strong> and{" "}
              <strong className="text-foreground">POPIA Consent Form</strong> online on each
              document page — or email signed copies to{" "}
              <a href={`mailto:${GRAYARX_LEGAL.legalEmail}`} className="text-primary hover:underline">
                {GRAYARX_LEGAL.legalEmail}
              </a>{" "}
              or WhatsApp {GRAYARX_LEGAL.phone}. All other policies below apply from day one.
            </p>
          </CardContent>
        </Card>
      )}

      {grouped.map((category) => (
        <div key={category}>
          <h3 className="font-tech mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            {CATEGORY_LABELS[category]}
          </h3>
          <div className="space-y-2">
            {docs
              .filter((d) => d.category === category)
              .map((doc) => (
                <DocRow key={doc.id} doc={doc} compact={compact} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
