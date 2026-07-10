import LegalLayout from "@/components/LegalLayout";
import { LegalDocumentLinks } from "@/components/LegalDocumentLinks";
import ComplianceContactForm from "@/components/ComplianceContactForm";
import { GRAYARX_LEGAL, grayArxRegisteredAddressSingleLine, grayArxTaxStatusLine } from "@shared/companyLegal";

export default function LegalHub() {
  return (
    <LegalLayout
      title="Legal & compliance centre"
      subtitle="Everything your dealership needs to review, sign, and stay compliant with South African law."
      effectiveDate="10 July 2026"
      showHubCrumb={false}
    >
      <p>
        GrayArx ({GRAYARX_LEGAL.legalName}, Enterprise No. {GRAYARX_LEGAL.enterpriseNumber}) —{" "}
        {grayArxTaxStatusLine()} Operates under POPIA, the Consumer Protection Act, and the
        Electronic Communications and Transactions Act. Use this page as the single link to share
        with dealership owners, compliance officers, or your attorney.
      </p>

      <h2>Security &amp; data protection at a glance</h2>
      <ul>
        <li><strong>Encryption:</strong> All data encrypted at rest (AES-256) and in transit (TLS 1.3).</li>
        <li><strong>Database:</strong> TiDB Cloud — SOC 2 compliant, geo-redundant, automated backups.</li>
        <li><strong>File storage:</strong> Cloudflare R2 with private bucket policies (no public listing).</li>
        <li><strong>Authentication:</strong> JWT / httpOnly cookies; bcrypt password hashing.</li>
        <li><strong>Tenant isolation:</strong> Each dealership's data is strictly isolated — no cross-dealer data leakage.</li>
        <li><strong>Secrets:</strong> All API keys stored as Railway environment variables, never in code.</li>
        <li><strong>POPIA:</strong> GrayArx acts as Operator; the dealership is the Responsible Party. Full POPIA compliance per Act 4 of 2013.</li>
        <li><strong>Data ownership:</strong> Dealers own 100% of their data. Export available within 30 days of cancellation.</li>
        <li><strong>AI &amp; WhatsApp:</strong> Messages processed via Meta's Cloud API. AI responses via OpenAI GPT / Google Gemini. Customers are informed they may be interacting with an AI.</li>
      </ul>

      <div className="not-prose">
        <LegalDocumentLinks />
      </div>

      <h2 className="mt-12">Contact privacy or legal team</h2>
      <p>
        Use this form if you cannot email directly — it creates a monitored ticket and alerts our
        Information Officer queue (same as mailing {GRAYARX_LEGAL.informationOfficerEmail}).
      </p>
      <ComplianceContactForm />

      <h2 className="mt-12">Information Officer & legal contacts</h2>
      <ul>
        <li>
          <strong>Privacy / POPIA queries:</strong>{" "}
          <a href={`mailto:${GRAYARX_LEGAL.informationOfficerEmail}`}>
            {GRAYARX_LEGAL.informationOfficerEmail}
          </a>
        </li>
        <li>
          <strong>Contracts & agreements:</strong>{" "}
          <a href={`mailto:${GRAYARX_LEGAL.legalEmail}`}>{GRAYARX_LEGAL.legalEmail}</a>
        </li>
        <li>
          <strong>General support:</strong>{" "}
          <a href={`mailto:${GRAYARX_LEGAL.supportEmail}`}>{GRAYARX_LEGAL.supportEmail}</a>
        </li>
        <li>
          <strong>Registered address:</strong> {grayArxRegisteredAddressSingleLine()}
        </li>
      </ul>

      <p className="text-sm text-muted-foreground">
        These documents are provided for operational use during the GrayArx pilot programme.
        Formal attorney review is recommended before scaling beyond pilot dealerships.{" "}
        <a href="/legal/popia-information-officer">POPIA Information Officer guide</a>.
      </p>
    </LegalLayout>
  );
}
