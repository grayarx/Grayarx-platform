import DealerShell from "@/components/DealerShell";
import { LegalDocumentLinks } from "@/components/LegalDocumentLinks";
import ComplianceContactForm from "@/components/ComplianceContactForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GRAYARX_LEGAL } from "@shared/companyLegal";
import { Scale, Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DealerLegal() {
  return (
    <DealerShell
      title="Legal & compliance"
      subtitle="Policies, agreements, and POPIA documents for your dealership."
    >
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Your compliance pack
          </CardTitle>
          <CardDescription>
            Share this page with your owner or compliance contact. Pilot dealerships must sign the
            Dealer Agreement and POPIA form before go-live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LegalDocumentLinks showPilotBanner={false} />
        </CardContent>
      </Card>

      <Card className="border-primary/10 mt-6">
        <CardHeader>
          <CardTitle className="text-base">Send a compliance message</CardTitle>
        </CardHeader>
        <CardContent>
          <ComplianceContactForm compact />
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-base">Need help or a signed copy?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Email signed agreements to{" "}
            <a href={`mailto:${GRAYARX_LEGAL.legalEmail}`} className="text-primary hover:underline">
              {GRAYARX_LEGAL.legalEmail}
            </a>
            . POPIA and privacy queries:{" "}
            <a
              href={`mailto:${GRAYARX_LEGAL.informationOfficerEmail}`}
              className="text-primary hover:underline"
            >
              {GRAYARX_LEGAL.informationOfficerEmail}
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${GRAYARX_LEGAL.legalEmail}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email legal team
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/legal">Public legal centre</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DealerShell>
  );
}
