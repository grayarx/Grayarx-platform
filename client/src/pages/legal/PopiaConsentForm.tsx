import LegalLayout from "@/components/LegalLayout";
import { GRAYARX_LEGAL, grayArxRegisteredAddressSingleLine } from "@shared/companyLegal";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PopiaConsentForm() {
  return (
    <LegalLayout
      title="POPIA Consent & Acknowledgment Form"
      subtitle="Dealership acknowledgment of POPIA obligations when using GrayArx."
      effectiveDate="1 June 2026"
    >
      <div className="not-prose mb-8 flex flex-wrap gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          Print / save as PDF
        </Button>
        <Button asChild variant="outline">
          <Link href="/legal">← All legal documents</Link>
        </Button>
      </div>

      <p>
        By signing this Form, the dealership confirms it understands its obligations under the
        Protection of Personal Information Act, 2013 (POPIA) and agrees to comply when using the
        GrayArx platform.
      </p>

      <h2>1. Dealership information (complete below)</h2>
      <div className="not-prose my-6 space-y-3 text-sm">
        {[
          "Dealership legal name",
          "Company registration number",
          "Principal contact person",
          "Contact email",
          "Contact phone",
          "Registered address",
        ].map((label) => (
          <div key={label}>
            <span className="text-muted-foreground">{label}</span>
            <div className="mt-1 border-b border-dashed border-white/20 pb-6" />
          </div>
        ))}
      </div>

      <h2>2. Processor (GrayArx) details</h2>
      <ul>
        <li>
          <strong>Legal name:</strong> {GRAYARX_LEGAL.legalName}
        </li>
        <li>
          <strong>Enterprise number:</strong> {GRAYARX_LEGAL.enterpriseNumber}
        </li>
        <li>
          <strong>Tax reference:</strong> {GRAYARX_LEGAL.taxReference}
        </li>
        <li>
          <strong>VAT status:</strong>{" "}
          {GRAYARX_LEGAL.vatRegistered ? GRAYARX_LEGAL.vatNumber : "Not VAT-registered (July 2026)"}
        </li>
        <li>
          <strong>Registered address:</strong> {grayArxRegisteredAddressSingleLine()}
        </li>
        <li>
          <strong>Information Officer:</strong>{" "}
          <a href={`mailto:${GRAYARX_LEGAL.informationOfficerEmail}`}>
            {GRAYARX_LEGAL.informationOfficerEmail}
          </a>
        </li>
      </ul>

      <h2>3. Acknowledgments</h2>
      <p>The dealership acknowledges and confirms that:</p>
      <ul>
        <li>
          It is the <strong>responsible party</strong> under POPIA and determines the purpose and
          means of processing personal information collected from customers.
        </li>
        <li>
          GrayArx is a <strong>processor</strong> and processes personal information only on the
          dealership's documented instructions.
        </li>
        <li>
          All customer data uploaded or captured via GrayArx is collected on a lawful basis
          (consent, contract, legal obligation, or legitimate interest as applicable).
        </li>
        <li>
          Explicit consent is obtained before collecting sensitive personal information and before
          direct marketing where required by POPIA s.69.
        </li>
        <li>
          Privacy notices are provided to data subjects identifying the dealership as responsible
          party and GrayArx as processor.
        </li>
        <li>
          Data subjects may exercise POPIA rights (access, correction, deletion, objection) via the
          dealership; GrayArx will assist within 30 days.
        </li>
        <li>
          Personal information breaches affecting customer data will be reported to GrayArx within{" "}
          <strong>24 hours</strong> of discovery.
        </li>
        <li>
          AI-assisted communications are disclosed to customers; human review is available for
          sensitive cases.
        </li>
      </ul>

      <h2>4. Permitted processing purposes</h2>
      <ul>
        <li>Lead capture and customer relationship management</li>
        <li>Vehicle inventory, sales, and showroom enquiries</li>
        <li>Appointment booking and follow-up communications</li>
        <li>Trade-in and finance enquiries (dealer remains responsible for NCA compliance)</li>
        <li>Service, warranty, and regulatory reporting as applicable</li>
      </ul>
      <p>
        Further processing for a new purpose requires fresh consent or another lawful basis under
        POPIA.
      </p>

      <h2>5. Data retention</h2>
      <p>
        The dealership agrees to retention periods aligned with the{" "}
        <a href="/privacy-policy">GrayArx Privacy Policy</a> unless a shorter period is required
        by law or dealership policy. Lead records: typically 36 months after last interaction.
      </p>

      <h2>6. Signature</h2>
      <p>
        Return the signed Form to{" "}
        <a href={`mailto:${GRAYARX_LEGAL.legalEmail}`}>{GRAYARX_LEGAL.legalEmail}</a> with your
        signed <a href="/legal/dealer-agreement">Dealer Agreement</a>.
      </p>

      <div className="not-prose mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-5 space-y-3 text-sm">
          <p className="font-semibold">Dealership authorised signatory</p>
          <div>
            <span className="text-muted-foreground">Name</span>
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
        <div className="rounded-xl border border-white/10 p-5 space-y-3 text-sm">
          <p className="font-semibold">GrayArx acknowledgment</p>
          <p className="text-muted-foreground text-xs">
            Received on: _______________
          </p>
          <div>
            <span className="text-muted-foreground">GrayArx representative</span>
            <div className="mt-1 border-b border-dashed border-white/20 pb-10" />
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
