import LegalLayout from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="POPIA-compliant data handling, in plain English."
      effectiveDate="10 July 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        GrayArx (Pty) Ltd (Enterprise No. 2026/407647/07) is the responsible party (data controller) for your personal information under the Protection of Personal Information Act, 2013 (POPIA). Our registered address is Sjampanije Street, Roodepoort, Gauteng 1736, South Africa. You can contact our Information Officer at <strong>privacy@grayarx.com</strong>.
      </p>

      <h2>2. What information we collect</h2>
      <p>We collect only what's necessary to operate the GrayArx platform and the autonomous AI agents that work for your dealership:</p>
      <ul>
        <li><strong>Account information:</strong> name, email, phone, dealership name, role.</li>
        <li><strong>Lead and customer information you upload or that customers submit:</strong> name, contact details, vehicle preferences, conversation transcripts, consent records.</li>
        <li><strong>Usage data:</strong> log-in events, feature usage, IP address, device and browser metadata.</li>
        <li><strong>Vehicle inventory data:</strong> make, model, year, price, images, specifications.</li>
        <li><strong>Communications:</strong> emails, WhatsApp messages, and SMS — handled by our AI agents on your behalf when enabled.</li>
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
        Our AI agents (Email, WhatsApp, and Booking) process personal information to draft and send communications, qualify leads, and book appointments. We use a combination of large language models and our own fine-tuned models trained on dealership data with appropriate consent. <strong>We do not use your customers' personal data to train foundation models for third parties.</strong> Outbound AI voice calling is not part of the pilot unless explicitly enabled later.
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

      <h2>9. Data security</h2>
      <p>
        GrayArx takes the security of your data and your customers' personal information seriously. We have implemented the following technical and organisational controls:
      </p>
      <ul>
        <li><strong>Encryption at rest:</strong> All data stored in our database and object storage is encrypted using AES-256.</li>
        <li><strong>Encryption in transit:</strong> All communications between your browser, our servers, and third-party services use TLS 1.3.</li>
        <li><strong>Database:</strong> We use TiDB Cloud — an enterprise-grade, SOC 2 compliant, geo-redundant distributed database with automated backups and point-in-time recovery.</li>
        <li><strong>File and photo storage:</strong> Vehicle images and uploaded files are stored in Cloudflare R2 object storage with private bucket policies. Files are never publicly listable and are accessed only via signed, time-limited URLs.</li>
        <li><strong>Authentication:</strong> User sessions are protected with JWT tokens stored in secure httpOnly cookies. Passwords are hashed using bcrypt with an appropriate cost factor — we never store plaintext passwords.</li>
        <li><strong>API protection:</strong> All dealer-facing API routes require an authenticated session. No dealership data is accessible without a valid, active session token.</li>
        <li><strong>Tenant isolation:</strong> No dealer's data is ever visible to or shared with another dealership. Each dealership ID has its own logical data partition enforced at the application and query layer.</li>
        <li><strong>Secrets management:</strong> API keys, tokens, and credentials are stored as Railway environment variables and are never committed to source code or exposed to the client.</li>
        <li><strong>Infrastructure:</strong> The platform runs on Railway with zero-downtime deployments and automated health monitoring.</li>
        <li><strong>Backups:</strong> Regular automated backups are maintained via TiDB Cloud's native backup service.</li>
        <li><strong>Incident response:</strong> In the event of a security compromise that affects personal information, we will notify the Information Regulator and affected data subjects as required by section 22 of POPIA.</li>
      </ul>

      <h2>10. WhatsApp and AI communications</h2>
      <p>
        When your dealership uses our WhatsApp AI agent (Nala) or email agent (Mia), the following applies:
      </p>
      <ul>
        <li><strong>WhatsApp processing:</strong> WhatsApp messages are processed via Meta's Cloud API under Meta's data processing terms. Message content passes through Meta's infrastructure before reaching GrayArx.</li>
        <li><strong>AI-generated responses:</strong> AI replies are generated using industry-standard large language models — OpenAI GPT and/or Google Gemini (via Manus Forge). Prompts and responses are not used to train foundation models.</li>
        <li><strong>Conversation logs:</strong> All conversation logs are stored encrypted and are accessible only to the relevant dealership. No other dealership can view your customers' conversations.</li>
        <li><strong>AI disclosure to customers:</strong> Customers are always informed — via an opening message or disclosure — that they may be interacting with an AI assistant. Dealerships are responsible for ensuring this disclosure is clear and maintained.</li>
      </ul>

      <h2>11. Dealer data ownership</h2>
      <ul>
        <li>Dealers own 100% of the data they upload to or generate within the GrayArx platform.</li>
        <li>Upon subscription termination, dealers may request a full data export within 30 days. After 30 days we may delete the data subject to our retention obligations.</li>
        <li>GrayArx does not use your inventory, lead, or customer data to train third-party AI models, nor does it share that data with competitors or other dealerships.</li>
        <li>Each dealership's data is logically isolated — enforced at both the application and database levels by dealership ID.</li>
      </ul>

      <h2>12. POPIA — roles and responsibilities</h2>
      <p>
        GrayArx complies fully with the Protection of Personal Information Act (POPIA), Act 4 of 2013. Under this framework:
      </p>
      <ul>
        <li><strong>GrayArx acts as an Operator (Processor):</strong> We process personal information on behalf of dealerships and only according to their instructions.</li>
        <li><strong>The dealership is the Responsible Party:</strong> The dealership determines the purpose and means of processing customer data and must obtain valid POPIA consent before capturing customer information via the GrayArx platform.</li>
        <li><strong>Data deletion requests:</strong> Customers may request deletion of their personal information at any time by contacting <strong>privacy@grayarx.com</strong>. We will process verified deletion requests within 30 days.</li>
        <li><strong>Data residency:</strong> Data is stored in South Africa or in compliant cross-border jurisdictions with adequate protections under section 72 of POPIA.</li>
        <li><strong>We do not sell or monetise personal information:</strong> We never sell, share for commercial gain, or monetise your customers' personal data.</li>
      </ul>

      <h2>14. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to remember preferences. We use limited analytics cookies to understand how the platform is used. You can disable non-essential cookies in your browser at any time without affecting service.
      </p>

      <h2>15. Children</h2>
      <p>
        GrayArx is a B2B platform for dealerships and is not directed at children under 18. We do not knowingly collect personal information from children.
      </p>

      <h2>16. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated via email and posted here at least 14 days before they take effect.
      </p>

      <h2>17. Contact</h2>
      <p>
        Information Officer<br />
        GrayArx (Pty) Ltd · Enterprise No. 2026/407647/07<br />
        Sjampanije Street, Roodepoort, Gauteng 1736, South Africa<br />
        Email: <strong>privacy@grayarx.com</strong><br />
        Information Regulator (SA): <a href="https://inforegulator.org.za" target="_blank" rel="noopener">inforegulator.org.za</a>
      </p>
    </LegalLayout>
  );
}
