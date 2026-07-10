import LegalLayout from "@/components/LegalLayout";

export default function AUP() {
  return (
    <LegalLayout
      title="Acceptable Use Policy"
      subtitle="What you can — and can't — do with GrayArx."
      effectiveDate="10 July 2026"
    >
      <p>
        This Acceptable Use Policy ("AUP") sets out the conduct expected of customers using GrayArx. It complements the Terms of Service and is enforced to keep the platform safe for dealerships and consumers.
      </p>

      <h2>1. Lawful use</h2>
      <p>
        You agree not to use the platform to violate South African law, including the Consumer Protection Act, the National Credit Act, the Electronic Communications and Transactions Act, the Protection of Personal Information Act, and the Cybercrimes Act.
      </p>

      <h2>2. Communication consent</h2>
      <p>
        You will obtain valid consent from data subjects before sending direct marketing through the platform, and you will honour opt-out requests promptly. The Email and Voice agents will refuse to send communications to recipients who have unsubscribed or who appear on a do-not-contact list you maintain.
      </p>

      <h2>3. Honest representation</h2>
      <p>
        Vehicle listings must be accurate, including price, kilometres, year, and material defects. Prohibited content includes deceptive pricing, fabricated reviews, undisclosed sponsorships, or impersonation of another business.
      </p>

      <h2>4. Prohibited content</h2>
      <p>You may not use GrayArx to send or store:</p>
      <ul>
        <li>Hate speech, harassment, or discriminatory content.</li>
        <li>Content that infringes intellectual property rights.</li>
        <li>Malware, phishing, or social engineering.</li>
        <li>Content related to illegal goods or services.</li>
        <li>Sexually explicit content.</li>
      </ul>

      <h2>5. AI agent guardrails</h2>
      <p>
        You will not configure AI agents to deceive customers about their AI status, to make legal or medical claims, to perform price discrimination based on protected characteristics, or to generate misleading personalisation that crosses into manipulation.
      </p>

      <h2>6. Security</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Probe, scan, or test the vulnerability of the platform without authorisation.</li>
        <li>Interfere with service performance or attempt to access other customers' data.</li>
        <li>Reverse-engineer or attempt to extract source code from the platform.</li>
      </ul>
      <p>
        Authorised security research is welcomed via our coordinated disclosure programme — email <strong>security@grayarx.com</strong>.
      </p>

      <h2>7. Fair use and rate limits</h2>
      <p>
        Plan limits (leads, vehicles, AI sessions) are set out in your pilot or subscription agreement. We may apply technical rate limits to protect platform stability. Excessive automated requests outside the published API may be throttled or suspended.
      </p>

      <h2>8. Reporting and enforcement</h2>
      <p>
        Suspected violations can be reported to <strong>abuse@grayarx.com</strong>. We may investigate, request explanations, suspend specific features, or terminate the account in cases of serious or repeated violation.
      </p>

      <h2>9. Updates</h2>
      <p>
        We may update this AUP as we learn how the platform is used in practice. Material changes will be communicated 14 days in advance.
      </p>
    </LegalLayout>
  );
}
