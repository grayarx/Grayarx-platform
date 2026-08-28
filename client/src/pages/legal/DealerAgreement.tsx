import LegalLayout from "@/components/LegalLayout";
import LegalSignOffForm from "@/components/LegalSignOffForm";
import MailtoLink from "@/components/MailtoLink";
import { GRAYARX_LEGAL, grayArxRegisteredAddressSingleLine, grayArxTaxStatusLine } from "@shared/companyLegal";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DealerAgreement() {
  return (
    <LegalLayout
      title="Dealer Agreement"
      subtitle="Pilot subscription contract between GrayArx and your dealership."
      effectiveDate="10 July 2026"
    >
      <div className="not-prose mb-8 flex flex-wrap gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          Print / save as PDF
        </Button>
        <Button asChild variant="outline">
          <Link href="/legal">← All legal documents</Link>
        </Button>
      </div>

      <h2>1. Parties</h2>
      <p>
        <strong>GrayArx</strong> means {GRAYARX_LEGAL.legalName} (Enterprise No.{" "}
        {GRAYARX_LEGAL.enterpriseNumber}), registered address {grayArxRegisteredAddressSingleLine()}.{" "}
        {grayArxTaxStatusLine()}
      </p>
      <p>
        <strong>Dealer</strong> means the motor vehicle dealership entering into this Agreement
        (details completed in the signature block below).
      </p>

      <h2>2. Subscription & pilot pricing</h2>
      <p>
        GrayArx provides the Nala Dealership OS (inventory, showroom, WhatsApp sales, parts,
        service, trade-in, missed-call recovery, Monday ROI). The Pilot is fourteen days at no
        charge, capped at 150 WhatsApp conversations. After the Pilot, the monthly fee is
        confirmed in writing before billing begins — typically Starter OS (R7,990/month),
        Professional OS (R14,990/month, the usual close), or Enterprise OS (from R29,990/month)
        depending on scope agreed on your kickoff call.
      </p>
      <p>
        Full plan feature matrices are available on request. Outbound AI voice calling is{" "}
        <strong>not</strong> included in the pilot unless explicitly enabled in writing later.
      </p>

      <h2>3. Term, renewal & cancellation</h2>
      <ul>
        <li>Subscriptions renew monthly unless otherwise agreed.</li>
        <li>The Dealer may cancel from the dashboard; cancellation takes effect at the end of the current billing cycle.</li>
        <li>GrayArx may suspend or terminate for material breach, non-payment, or Acceptable Use Policy violations.</li>
      </ul>

      <h2>4. Data & POPIA</h2>
      <p>
        The Dealer is the <strong>responsible party</strong> under POPIA. GrayArx acts as{" "}
        <strong>processor</strong> on the Dealer's instructions. The Dealer must obtain lawful
        consent before uploading customer data, provide privacy notices, and notify GrayArx of
        breaches within 24 hours. See also the{" "}
        <a href="/dpa">Data Processing Agreement</a> and{" "}
        <a href="/legal/popia-consent-form">POPIA Consent Form</a>.
      </p>

      <h2>5. Credit, finance & consumer law</h2>
      <p>
        GrayArx is software only. The Dealer remains solely responsible for NCA affordability
        assessments, FAIS licensing where applicable, CPA product descriptions, and all finance
        disclosures. See the <a href="/credit-disclaimer">Credit & Finance Disclaimer</a>.
      </p>

      <h2>6. AI agents & communications</h2>
      <p>
        AI-assisted replies are disclosed to customers. The Dealer is responsible for reviewing
        high-value or sensitive conversations. Marketing emails and SMS require lawful consent
        under POPIA s.69 and ECTA — unsubscribe mechanisms are built into the platform.
      </p>

      <h2>7. Service levels & support</h2>
      <p>
        GrayArx targets 99.5% monthly uptime as set out in the{" "}
        <a href="/sla">Service Level Agreement</a>. Support is via{" "}
        <MailtoLink email={GRAYARX_LEGAL.supportEmail} /> and {GRAYARX_LEGAL.phone} during business
        hours unless Enterprise SLA applies.
      </p>

      <h2>8. Liability & indemnity</h2>
      <p>
        GrayArx's aggregate liability is limited to fees paid in the 12 months preceding a claim,
        except where South African law does not permit limitation (fraud, gross negligence). The
        Dealer indemnifies GrayArx for claims arising from the Dealer's use of the service,
        uploaded data, or violation of applicable law.
      </p>

      <h2>9. Governing law</h2>
      <p>
        This Agreement is governed by the laws of the Republic of South Africa. Disputes: good-faith
        negotiation (14 days), then mediation, then South African courts in Johannesburg.
      </p>

      <h2>10. Related documents</h2>
      <p>This Agreement incorporates by reference:</p>
      <ul>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/privacy-policy">Privacy Policy</a></li>
        <li><a href="/dpa">Data Processing Agreement</a></li>
        <li><a href="/aup">Acceptable Use Policy</a></li>
        <li><a href="/ai-ethics">AI Ethics & Transparency</a></li>
      </ul>

      <h2 className="mt-12">Signature block</h2>
      <p>
        Complete and sign below on GrayArx, or print and return to{" "}
        <MailtoLink email={GRAYARX_LEGAL.legalEmail} subject="Signed Dealer Agreement" /> before
        account activation.
      </p>

      <LegalSignOffForm type="dealer_agreement" />

      <div className="not-prose mt-8 hidden print:grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-5 space-y-4">
          <p className="font-semibold">Dealer</p>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Dealership legal name</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-6" />
            </div>
            <div>
              <span className="text-muted-foreground">Company registration no.</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-6" />
            </div>
            <div>
              <span className="text-muted-foreground">Authorised signatory</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-6" />
            </div>
            <div>
              <span className="text-muted-foreground">Title</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-6" />
            </div>
            <div>
              <span className="text-muted-foreground">Signature & date</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-10" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-5 space-y-4">
          <p className="font-semibold">GrayArx (Pty) Ltd</p>
          <p className="text-sm text-muted-foreground">
            {grayArxRegisteredAddressSingleLine()}
            <br />
            <MailtoLink email={GRAYARX_LEGAL.legalEmail} /> · {GRAYARX_LEGAL.phone}
          </p>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Authorised signatory</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-6" />
            </div>
            <div>
              <span className="text-muted-foreground">Signature & date</span>
              <div className="mt-1 border-b border-dashed border-white/20 pb-10" />
            </div>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
