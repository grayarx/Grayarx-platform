import LegalLayout from "@/components/LegalLayout";
import { LegalDocumentLinks } from "@/components/LegalDocumentLinks";
import { GRAYARX_LEGAL, grayArxRegisteredAddressSingleLine } from "@shared/companyLegal";

export default function LegalHub() {
  return (
    <LegalLayout
      title="Legal & compliance centre"
      subtitle="Everything your dealership needs to review, sign, and stay compliant with South African law."
      effectiveDate="9 July 2026"
      showHubCrumb={false}
    >
      <p>
        GrayArx ({GRAYARX_LEGAL.legalName}, Enterprise No. {GRAYARX_LEGAL.enterpriseNumber})
        operates under POPIA, the Consumer Protection Act, and the Electronic Communications
        and Transactions Act. Use this page as the single link to share with dealership owners,
        compliance officers, or your attorney.
      </p>

      <div className="not-prose">
        <LegalDocumentLinks />
      </div>

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
        Formal attorney review is recommended before scaling beyond pilot dealerships.
      </p>
    </LegalLayout>
  );
}
