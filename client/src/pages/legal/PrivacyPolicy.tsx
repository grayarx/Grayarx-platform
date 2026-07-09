import LegalLayout from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="POPIA-compliant data handling, in plain English."
      effectiveDate="22 May 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        GrayArx (Pty) Ltd ("GrayArx", "we", "us", or "our") is the responsible party (data controller) for your personal information under the Protection of Personal Information Act, 2013 (POPIA). Our registered office is in Johannesburg, South Africa. You can contact our Information Officer at <strong>privacy@grayarx.com</strong>.
      </p>

      <h2>2. What information we collect</h2>
      <p>We collect only what's necessary to operate the GrayArx platform and the autonomous AI agents that work for your dealership:</p>
      <ul>
        <li><strong>Account information:</strong> name, email, phone, dealership name, role.</li>
        <li><strong>Lead and customer information you upload or that customers submit:</strong> name, contact details, vehicle preferences, conversation transcripts, consent records.</li>
        <li><strong>Usage data:</strong> log-in events, feature usage, IP address, device and browser metadata.</li>
        <li><strong>Vehicle inventory data:</strong> make, model, year, price, images, specifications.</li>
        <li><strong>Communications:</strong> emails, voice call recordings, WhatsApp messages, SMS — handled by our AI agents on your behalf.</li>
      </ul>

      <h2>3. Why we collect it (lawful basis)</h2>
      <p>We process personal information on the following POPIA grounds:</p>
      <ul>
        <li><strong>Contract:</strong> to deliver the GrayArx platform and AI agent services to your dealership.</li>
        <li><strong>Consent:</strong> for marketing communications and where consent is required by POPIA.</li>
        <li><strong>Legitimate interest:</strong> to secure our services, prevent fraud, and improve product performance.</li>
        <li><strong>Legal obligation:</strong> to comply with South African law, tax requirements, and lawful requests from authorities.</li>
      </ul>

      <h2>4. How we use AI</h2>
      <p>
        Our AI agents (Email, Calling, and Booking) process personal information to draft and send communications, qualify leads, and book appointments. We use a combination of large language models and our own fine-tuned models trained on dealership data with appropriate consent. <strong>We do not use your customers' personal data to train foundation models for third parties.</strong> Voice calls are transcribed in real time and the audio is retained only as long as necessary for quality and compliance, after which it is deleted.
      </p>

      <h2>5. Sharing your information</h2>
      <p>We share personal information only with:</p>
      <ul>
        <li><strong>Sub-processors</strong> who help us run the service (cloud hosting, email delivery, voice telephony, calendar APIs). All sub-processors are bound by data-processing agreements.</li>
        <li><strong>Your dealership team members</strong> based on the role-based access you configure.</li>
        <li><strong>Authorities</strong> when required by South African law.</li>
      </ul>
      <p>We never sell your personal information.</p>

      <h2>6. Data residency and cross-border transfers</h2>
      <p>
        We host primary infrastructure in South Africa. Where personal information is transferred outside South Africa (for example for AI inference), we ensure the receiving jurisdiction has an adequate level of protection or that contractual safeguards under section 72 of POPIA are in place.
      </p>

      <h2>7. How long we keep it</h2>
      <p>
        We retain personal information only as long as necessary to fulfil the purposes set out above or as required by law. Lead records are typically retained for 36 months after last interaction; voice call recordings for 12 months; account data for the lifetime of the account plus 7 years for tax compliance.
      </p>

      <h2>8. Your rights under POPIA</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Be informed about the processing of your personal information.</li>
        <li>Access the personal information we hold about you.</li>
        <li>Request correction or deletion of inaccurate information.</li>
        <li>Object to processing for direct marketing.</li>
        <li>Withdraw consent at any time.</li>
        <li>Lodge a complaint with the Information Regulator (South Africa).</li>
      </ul>
      <p>
        To exercise any of these rights, email <strong>privacy@grayarx.com</strong>. We will respond within 30 days.
      </p>

      <h2>9. Security</h2>
      <p>
        We use industry-standard security controls including encryption in transit (TLS 1.3) and at rest (AES-256), role-based access control, audit logging, multi-factor authentication, and regular penetration testing. In the event of a security compromise that affects personal information, we will notify the Information Regulator and affected data subjects as required by section 22 of POPIA.
      </p>

      <h2>10. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to remember preferences. We use limited analytics cookies to understand how the platform is used. You can disable non-essential cookies in your browser at any time without affecting service.
      </p>

      <h2>11. Children</h2>
      <p>
        GrayArx is a B2B platform for dealerships and is not directed at children under 18. We do not knowingly collect personal information from children.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated via email and posted here at least 14 days before they take effect.
      </p>

      <h2>13. Contact</h2>
      <p>
        Information Officer<br />
        GrayArx (Pty) Ltd<br />
        Email: <strong>privacy@grayarx.com</strong><br />
        Information Regulator (SA): <a href="https://inforegulator.org.za" target="_blank" rel="noopener">inforegulator.org.za</a>
      </p>
    </LegalLayout>
  );
}
