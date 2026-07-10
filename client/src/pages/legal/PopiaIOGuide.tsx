import LegalLayout from "@/components/LegalLayout";
import { GRAYARX_LEGAL } from "@shared/companyLegal";
import { Link } from "wouter";

export default function PopiaIOGuide() {
  return (
    <LegalLayout
      title="POPIA Information Officer"
      subtitle="What registration means for GrayArx and your dealership."
      effectiveDate="10 July 2026"
    >
      <h2>What is an Information Officer?</h2>
      <p>
        Under POPIA, every organisation that processes personal information must appoint an{" "}
        <strong>Information Officer (IO)</strong> — the person responsible for compliance, data
        subject requests, and liaison with the Information Regulator of South Africa.
      </p>

      <h2>GrayArx</h2>
      <ul>
        <li>
          <strong>IO contact:</strong>{" "}
          <a href={`mailto:${GRAYARX_LEGAL.informationOfficerEmail}`}>
            {GRAYARX_LEGAL.informationOfficerEmail}
          </a>
        </li>
        <li>
          <strong>Entity:</strong> {GRAYARX_LEGAL.legalName} (Ent. {GRAYARX_LEGAL.enterpriseNumber})
        </li>
        <li>
          GrayArx acts as a <strong>processor</strong> for dealership customer data
        </li>
      </ul>

      <h2>Your dealership</h2>
      <p>
        Each dealership is the <strong>responsible party</strong> for its customers. You must obtain
        lawful consent, provide privacy notices, and honour data subject rights. Sign the{" "}
        <Link href="/legal/popia-consent-form">POPIA Consent Form</Link> before go-live.
      </p>

      <h2>Registration with the Information Regulator</h2>
      <p>
        GrayArx should register as a responsible party and name its IO with the{" "}
        <strong>Information Regulator</strong> before scaling beyond a small pilot. This is a
        once-off administrative step (not done automatically by software).
      </p>
      <ol>
        <li>Visit the Information Regulator website (inforegulator.org.za)</li>
        <li>Register {GRAYARX_LEGAL.legalName} and the named Information Officer</li>
        <li>Keep confirmation on file</li>
        <li>Monitor {GRAYARX_LEGAL.informationOfficerEmail} daily via the{" "}
          <Link href="/legal">Legal centre contact form</Link>
        </li>
      </ol>

      <h2>Not the same as FAIS or NCA</h2>
      <p>
        POPIA covers <em>personal information</em>. Credit and finance rules (NCA/FAIS) are separate
        — see the <Link href="/credit-disclaimer">Credit Disclaimer</Link>.
      </p>
    </LegalLayout>
  );
}
