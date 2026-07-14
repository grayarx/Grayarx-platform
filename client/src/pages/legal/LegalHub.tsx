import LegalLayout from "@/components/LegalLayout";
import { LegalDocumentLinks } from "@/components/LegalDocumentLinks";
import ComplianceContactForm from "@/components/ComplianceContactForm";
import { GRAYARX_LEGAL, grayArxRegisteredAddressSingleLine, grayArxTaxStatusLine } from "@shared/companyLegal";
import { Card, CardContent } from "@/components/ui/card";

export default function LegalHub() {
  return (
    <LegalLayout
      title="Legal & compliance centre"
      subtitle="Everything your dealership needs to review, sign, and stay compliant with South African law."
      effectiveDate="10 July 2026"
      showHubCrumb={false}
    >
      {/* Pilot banner — top of page */}
      <div className="not-prose mb-8">
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
      </div>

      {/* Document links — no pilot banner (shown above already) */}
      <div className="not-prose">
        <LegalDocumentLinks showPilotBanner={false} />
      </div>

      {/* Company & security details — collapsed by default, available for compliance officers */}
      <div className="not-prose mt-10">
        <details className="group rounded-xl border border-border/40 bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
            <span>Company details &amp; security information</span>
            <svg
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-border/40 px-5 py-5 text-sm text-muted-foreground space-y-5">
            <p>
              GrayArx ({GRAYARX_LEGAL.legalName}, Enterprise No. {GRAYARX_LEGAL.enterpriseNumber}) —{" "}
              {grayArxTaxStatusLine()} Operates under POPIA, the Consumer Protection Act, and the
              Electronic Communications and Transactions Act. Use this page as the single link to share
              with dealership owners, compliance officers, or your attorney.
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Security &amp; data protection at a glance
              </p>
              <ul className="space-y-1.5">
                <li><strong className="text-foreground/70">Encryption:</strong> All data encrypted at rest (AES-256) and in transit (TLS 1.3).</li>
                <li><strong className="text-foreground/70">Database:</strong> TiDB Cloud — SOC 2 compliant, geo-redundant, automated backups.</li>
                <li><strong className="text-foreground/70">File storage:</strong> Cloudflare R2 with private bucket policies (no public listing).</li>
                <li><strong className="text-foreground/70">Authentication:</strong> JWT / httpOnly cookies; bcrypt password hashing.</li>
                <li><strong className="text-foreground/70">Tenant isolation:</strong> Each dealership's data is strictly isolated — no cross-dealer data leakage.</li>
                <li><strong className="text-foreground/70">Secrets:</strong> All API keys stored as Railway environment variables, never in code.</li>
                <li><strong className="text-foreground/70">POPIA:</strong> GrayArx acts as Operator; the dealership is the Responsible Party. Full POPIA compliance per Act 4 of 2013.</li>
                <li><strong className="text-foreground/70">Data ownership:</strong> Dealers own 100% of their data. Export available within 30 days of cancellation.</li>
                <li><strong className="text-foreground/70">AI &amp; WhatsApp:</strong> Messages processed via Meta's Cloud API. AI responses via OpenAI (template fallback when unavailable). Customers are informed they may be interacting with an AI.</li>
              </ul>
            </div>
          </div>
        </details>
      </div>

      <h2 className="mt-12">Contact privacy or legal team</h2>
      <p>
        Use this form to raise a privacy or legal query — it creates a monitored ticket in our
        Information Officer queue.
      </p>
      <ComplianceContactForm />

      {/* IO contacts + registered address — collapsed, sensitive */}
      <div className="not-prose mt-8">
        <details className="group rounded-xl border border-border/40 bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
            <span>Information Officer &amp; registered details</span>
            <svg
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-border/40 px-5 py-5 text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground/70">Privacy / POPIA queries:</strong>{" "}
              <a href={`mailto:${GRAYARX_LEGAL.informationOfficerEmail}`} className="text-primary hover:underline">
                {GRAYARX_LEGAL.informationOfficerEmail}
              </a>
            </p>
            <p><strong className="text-foreground/70">Contracts &amp; agreements:</strong>{" "}
              <a href={`mailto:${GRAYARX_LEGAL.legalEmail}`} className="text-primary hover:underline">
                {GRAYARX_LEGAL.legalEmail}
              </a>
            </p>
            <p><strong className="text-foreground/70">General support:</strong>{" "}
              <a href={`mailto:${GRAYARX_LEGAL.supportEmail}`} className="text-primary hover:underline">
                {GRAYARX_LEGAL.supportEmail}
              </a>
            </p>
            <p><strong className="text-foreground/70">Registered address:</strong>{" "}
              {grayArxRegisteredAddressSingleLine()}
            </p>
            <p className="pt-2 text-xs text-muted-foreground/60">
              These documents are provided for operational use during the GrayArx pilot programme.
              Formal attorney review is recommended before scaling beyond pilot dealerships.{" "}
              <a href="/legal/popia-information-officer" className="hover:underline">POPIA Information Officer guide</a>.
            </p>
          </div>
        </details>
      </div>
    </LegalLayout>
  );
}
