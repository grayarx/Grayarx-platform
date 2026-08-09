import LegalLayout from "@/components/LegalLayout";
import MailtoLink from "@/components/MailtoLink";

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The agreement between GrayArx and your dealership."
      effectiveDate="10 July 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service ("Terms") form a legal agreement between GrayArx (Pty) Ltd ("GrayArx", "we") and the dealership or other entity that subscribes to the GrayArx platform ("Customer", "you"). By signing up or using the platform you agree to these Terms.
      </p>

      <h2>2. The service</h2>
      <p>
        GrayArx provides a software-as-a-service platform comprising autonomous AI agents (WhatsApp, email, trade-in valuation, test-drive booking, lead prospecting, finance pre-approval), a vehicle showroom, lead management pipeline, deal-score intelligence, and a dealer dashboard. We continually improve the service and may add or modify features over time.
      </p>

      <h2>3. Subscription and billing</h2>
      <p>
        Subscriptions are billed monthly in South African Rand. During the pilot programme, pricing is confirmed in writing before billing begins. Plan limits and features are agreed per dealership. After the trial, you authorise us to charge the subscription fee on a recurring basis until you cancel.
      </p>

      <h2>4. Free trial</h2>
      <p>
        During the 14-day free trial you have full access to your selected plan. You may cancel at any time during the trial without charge. If you do not cancel, the subscription will continue and we will issue an invoice on the first day of the new billing cycle.
      </p>

      <h2>5. Cancellation</h2>
      <p>
        You may cancel your subscription at any time from your dashboard. Cancellation takes effect at the end of the current billing period. We do not offer pro-rata refunds for partial months but will refund clear cases of service failure on a case-by-case basis.
      </p>

      <h2>6. Customer responsibilities</h2>
      <p>You agree to:</p>
      <ul>
        <li>Provide accurate dealership information.</li>
        <li>Obtain all necessary consents before uploading customer data.</li>
        <li>Use the service in compliance with the Acceptable Use Policy and South African law.</li>
        <li>Keep your credentials confidential and notify us of unauthorised access.</li>
        <li>Pay all fees on time.</li>
      </ul>

      <h2>7. Our responsibilities</h2>
      <p>
        We commit to a 99.5% monthly uptime as set out in the <a href="/sla">Service Level Agreement</a>. We will process personal information as described in the <a href="/privacy-policy">Privacy Policy</a> and <a href="/dpa">Data Processing Agreement</a>.
      </p>

      <h2>8. Data security and infrastructure</h2>
      <p>We apply the following technical safeguards to protect your dealership's data and your customers' personal information:</p>
      <ul>
        <li><strong>Encryption:</strong> All data is encrypted at rest (AES-256) and in transit (TLS 1.3).</li>
        <li><strong>Database:</strong> TiDB Cloud — SOC 2 compliant, geo-redundant, with automated backups and point-in-time recovery.</li>
        <li><strong>File storage:</strong> Cloudflare R2 object storage with private bucket policies. Files are never publicly listable.</li>
        <li><strong>Authentication:</strong> JWT tokens with secure httpOnly cookies; bcrypt password hashing.</li>
        <li><strong>API access control:</strong> All dealer routes require an authenticated session. No data is accessible without a valid active token.</li>
        <li><strong>Tenant isolation:</strong> Each dealership's data is logically isolated. No dealer can access another dealership's data.</li>
        <li><strong>Secrets management:</strong> API keys and credentials are stored as Railway environment variables, never in source code.</li>
        <li><strong>Hosting:</strong> Railway with zero-downtime deployments and automated health monitoring.</li>
      </ul>

      <h2>9. Dealer data ownership</h2>
      <ul>
        <li>You own 100% of the data you upload or generate on the GrayArx platform — inventory, leads, customer records, and conversation logs.</li>
        <li>Upon termination of your subscription, you may request a full data export within 30 days of cancellation.</li>
        <li>GrayArx will not use your inventory, lead, or customer data to train AI foundation models or share it with competitors or other dealerships.</li>
        <li>Each dealership ID has its own data partition enforced at both the application and database level.</li>
      </ul>

      <h2>10. POPIA compliance</h2>
      <p>
        GrayArx complies with the Protection of Personal Information Act (POPIA), Act 4 of 2013. Under POPIA:
      </p>
      <ul>
        <li><strong>GrayArx is the Operator:</strong> we process personal information on your behalf and under your instructions only.</li>
        <li><strong>You are the Responsible Party:</strong> your dealership must obtain valid POPIA consent from customers before capturing their data via GrayArx.</li>
        <li><strong>Data deletion:</strong> customers may request deletion of their data at any time via <strong>privacy@grayarx.com</strong>.</li>
        <li><strong>Data residency:</strong> data is stored in South Africa or in compliant cross-border jurisdictions with adequate protections under POPIA section 72.</li>
        <li><strong>No commercialisation:</strong> we do not sell, share for commercial gain, or monetise customer personal information.</li>
        <li>A full Data Processing Agreement (DPA) is available at <a href="/dpa">/dpa</a>.</li>
      </ul>

      <h2>11. WhatsApp and AI communications</h2>
      <ul>
        <li>WhatsApp messages are processed via Meta's Cloud API under Meta's data processing terms.</li>
        <li>AI-generated responses use OpenAI large language models (with template fallbacks if unavailable). Conversation data is not used to train foundation models.</li>
        <li>Conversation logs are stored encrypted and are accessible only to the relevant dealership.</li>
        <li>You are responsible for ensuring that customers are informed — before or at the start of an AI conversation — that they may be interacting with an AI assistant.</li>
      </ul>

      <h2>12. Intellectual property</h2>
      <p>
        GrayArx and its licensors retain all rights to the platform, software, and brand. You retain ownership of all data you upload or create on the platform. You grant us a limited licence to process your data solely to provide the service.
      </p>

      <h2>14. Liability</h2>
      <p>
        To the maximum extent permitted by law, our aggregate liability for any claim arising from the service is limited to the fees you paid us in the 12 months preceding the event giving rise to the claim. We are not liable for indirect, special, or consequential damages including loss of profits, goodwill, or data.
      </p>
      <p>
        Nothing in these Terms limits liability for fraud, gross negligence, or any liability that cannot be excluded under South African law including the Consumer Protection Act.
      </p>

      <h2>15. Suspension and termination</h2>
      <p>
        We may suspend or terminate the service if you breach these Terms, violate the Acceptable Use Policy, or fail to pay. We will give reasonable notice except where the breach is severe or unlawful.
      </p>

      <h2>16. Changes to these terms</h2>
      <p>
        We may update these Terms with at least 30 days' notice. Continued use of the service after the effective date constitutes acceptance. If you don't agree to the changes you may cancel your subscription.
      </p>

      <h2>17. Dispute resolution</h2>
      <p>
        These Terms are governed by the laws of the Republic of South Africa. The parties agree to first attempt to resolve disputes through good-faith negotiation. Failing that, disputes will be referred to arbitration in Johannesburg under the rules of the Arbitration Foundation of Southern Africa.
      </p>

      <h2>18. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <MailtoLink email="legal@grayarx.com" subject="Terms of Service enquiry" />.
      </p>
    </LegalLayout>
  );
}
