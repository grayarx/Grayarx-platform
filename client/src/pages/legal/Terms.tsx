import LegalLayout from "@/components/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The agreement between GrayArx and your dealership."
      effectiveDate="22 May 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service ("Terms") form a legal agreement between GrayArx (Pty) Ltd ("GrayArx", "we") and the dealership or other entity that subscribes to the GrayArx platform ("Customer", "you"). By signing up or using the platform you agree to these Terms.
      </p>

      <h2>2. The service</h2>
      <p>
        GrayArx provides a software-as-a-service platform comprising autonomous AI agents (email, voice, meeting booking), a vehicle showroom, lead management, and a dealer dashboard. We continually improve the service and may add or modify features over time.
      </p>

      <h2>3. Subscription and billing</h2>
      <p>
        Subscriptions are billed monthly in South African Rand. Pricing is published at <a href="/pricing">grayarx.com/pricing</a>. We offer a 14-day free trial on all plans with no credit card required to start. After the trial, you authorise us to charge the subscription fee on a recurring basis until you cancel.
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

      <h2>8. Intellectual property</h2>
      <p>
        GrayArx and its licensors retain all rights to the platform, software, and brand. You retain ownership of all data you upload or create on the platform. You grant us a limited licence to process your data solely to provide the service.
      </p>

      <h2>9. Liability</h2>
      <p>
        To the maximum extent permitted by law, our aggregate liability for any claim arising from the service is limited to the fees you paid us in the 12 months preceding the event giving rise to the claim. We are not liable for indirect, special, or consequential damages including loss of profits, goodwill, or data.
      </p>
      <p>
        Nothing in these Terms limits liability for fraud, gross negligence, or any liability that cannot be excluded under South African law including the Consumer Protection Act.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        We may suspend or terminate the service if you breach these Terms, violate the Acceptable Use Policy, or fail to pay. We will give reasonable notice except where the breach is severe or unlawful.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these Terms with at least 30 days' notice. Continued use of the service after the effective date constitutes acceptance. If you don't agree to the changes you may cancel your subscription.
      </p>

      <h2>12. Dispute resolution</h2>
      <p>
        These Terms are governed by the laws of the Republic of South Africa. The parties agree to first attempt to resolve disputes through good-faith negotiation. Failing that, disputes will be referred to arbitration in Johannesburg under the rules of the Arbitration Foundation of Southern Africa.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms? Email <strong>legal@grayarx.com</strong>.
      </p>
    </LegalLayout>
  );
}
