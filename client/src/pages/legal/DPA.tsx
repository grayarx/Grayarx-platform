import LegalLayout from "@/components/LegalLayout";

export default function DPA() {
  return (
    <LegalLayout
      title="Data Processing Agreement"
      subtitle="Where GrayArx acts as your operator under POPIA."
      effectiveDate="22 May 2026"
    >
      <h2>1. Purpose</h2>
      <p>
        This Data Processing Agreement ("DPA") forms part of the Terms of Service between GrayArx (Pty) Ltd ("Operator") and the Customer ("Responsible Party") whenever GrayArx processes personal information on the Customer's behalf within the meaning of POPIA.
      </p>

      <h2>2. Roles</h2>
      <p>
        The Customer is the responsible party (data controller) for personal information of leads, customers, and dealership staff that it loads into GrayArx. GrayArx acts as the operator (data processor) and processes that personal information solely on the Customer's documented instructions, including by means of the platform configuration and AI agent settings the Customer chooses.
      </p>

      <h2>3. Categories of data subjects and personal information</h2>
      <ul>
        <li><strong>Data subjects:</strong> leads, prospective customers, existing customers, dealership staff.</li>
        <li><strong>Categories of personal information:</strong> name, contact details, vehicle preferences, finance enquiry data (where provided), conversation transcripts, voice recordings, scheduling information.</li>
      </ul>

      <h2>4. Operator obligations</h2>
      <p>GrayArx will:</p>
      <ul>
        <li>Process personal information only on the Customer's documented instructions.</li>
        <li>Implement appropriate technical and organisational security measures (Section 19 of POPIA).</li>
        <li>Ensure that personnel authorised to process personal information are bound by confidentiality.</li>
        <li>Assist the Customer in responding to data-subject requests, breach notifications, and impact assessments.</li>
        <li>Notify the Customer without undue delay (and within 48 hours) of becoming aware of a security compromise.</li>
        <li>On termination, delete or return all personal information at the Customer's choice unless retention is legally required.</li>
      </ul>

      <h2>5. Sub-processors</h2>
      <p>
        The Customer authorises GrayArx to engage sub-processors to deliver the service (cloud hosting, email delivery, voice telephony, calendar APIs, AI inference). A current list is maintained at <strong>grayarx.com/subprocessors</strong>. We give 30 days' notice of new sub-processors. The Customer may object on reasonable grounds.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Where personal information is transferred outside South Africa, GrayArx will ensure that the receiving jurisdiction has an adequate level of protection or that an applicable legal mechanism under section 72 of POPIA is used.
      </p>

      <h2>7. Audits</h2>
      <p>
        Once per year, on at least 30 days' notice, the Customer may request a security and compliance audit. GrayArx will provide reasonable assistance, including access to its most recent security certifications and audit reports.
      </p>

      <h2>8. Liability</h2>
      <p>
        Liability under this DPA is governed by the limits set out in the Terms of Service, except where higher liability applies as a matter of South African law.
      </p>

      <h2>9. Term and termination</h2>
      <p>
        This DPA is effective for as long as GrayArx processes personal information on behalf of the Customer. On termination, sections 4 (final paragraph), 7, and 8 survive.
      </p>

      <h2>10. Contact</h2>
      <p>
        Information Officer · <strong>privacy@grayarx.com</strong>
      </p>
    </LegalLayout>
  );
}
