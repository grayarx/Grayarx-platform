import LegalLayout from "@/components/LegalLayout";

export default function AIEthics() {
  return (
    <LegalLayout
      title="AI Ethics & Transparency"
      subtitle="How GrayArx builds and operates AI responsibly."
      effectiveDate="22 May 2026"
    >
      <h2>Our principles</h2>
      <p>
        GrayArx's AI agents work autonomously on behalf of dealerships — sending emails, taking calls, and booking meetings with real customers. That responsibility demands clear principles. These commitments apply to every model and feature we ship.
      </p>

      <h2>1. Disclosure</h2>
      <p>
        Our AI agents identify themselves as AI when asked directly. Voice agents use natural-sounding speech but do not impersonate specific human employees. Email agents sign communications with the dealership name and include a clear contact path to a human team member.
      </p>

      <h2>2. Human in the loop</h2>
      <p>
        AI agents handle routine engagement — but every dealership has a human override. Hot leads, complex objections, and sensitive cases are escalated to your sales team. You always control which categories of conversation may be fully automated.
      </p>

      <h2>3. Bias and fairness</h2>
      <p>
        We test models for fairness across South African languages, accents, and demographic groups. We monitor outcomes to detect disparate impact in lead scoring or response quality and re-train when meaningful gaps appear.
      </p>

      <h2>4. Data minimisation</h2>
      <p>
        We use only the data necessary to deliver the service. We do not feed your customers' personal data into third-party foundation models for general training, and we never sell or share data for marketing purposes outside your dealership.
      </p>

      <h2>5. Model transparency</h2>
      <p>
        We publish our model card on request, including the training data sources, evaluation results, and known limitations. If you'd like a copy, email <strong>ethics@grayarx.com</strong>.
      </p>

      <h2>6. Safety and quality controls</h2>
      <p>
        Every agent is governed by content policies that prevent unlawful, deceptive, or harassing communications. Outputs are monitored, sampled for quality, and reviewed by humans on a continuous basis.
      </p>

      <h2>7. Incident response</h2>
      <p>
        If an AI agent makes a meaningful error — for example confidently providing incorrect vehicle information — we investigate, fix the root cause, and notify affected customers. Material incidents are reported to the dealership within 48 hours.
      </p>

      <h2>8. Customer rights</h2>
      <p>
        End customers interacting with GrayArx-powered agents can:
      </p>
      <ul>
        <li>Ask whether they are speaking to AI (and we will tell them).</li>
        <li>Request escalation to a human at any point.</li>
        <li>Opt out of AI-driven communication channels.</li>
        <li>Request access to or deletion of any conversation transcripts that relate to them.</li>
      </ul>

      <h2>9. Continuous improvement</h2>
      <p>
        We publish a quarterly transparency note covering aggregate quality metrics, customer-rights requests fulfilled, and any material policy changes.
      </p>

      <h2>Contact</h2>
      <p>
        Email <strong>ethics@grayarx.com</strong> with any concern — every message is reviewed by a senior member of our team within five business days.
      </p>
    </LegalLayout>
  );
}
