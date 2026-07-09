import LegalLayout from "@/components/LegalLayout";

export default function CreditDisclaimer() {
  return (
    <LegalLayout
      title="Credit & Finance Disclaimer"
      subtitle="Trade-in valuations and finance tools are illustrative only — not credit offers."
      effectiveDate="1 June 2026"
    >
      <h2>1. Purpose</h2>
      <p>
        This disclaimer clarifies the legal status of credit-related features on the GrayArx platform,
        including trade-in valuations (Tumi agent) and finance affordability tools. It applies to all
        users of these services in South Africa.
      </p>

      <h2>2. Trade-in valuations</h2>
      <p>
        Trade-in estimates are <strong>illustrative only</strong>. They are not a binding offer to
        purchase, a credit assessment, or a guarantee. Estimates use market data and information you
        provide — not a physical inspection.
      </p>
      <p>
        The final trade-in value is determined solely by the dealership after inspection, agreed in
        writing, and must comply with the National Credit Act (NCA).
      </p>

      <h2>3. Finance calculator</h2>
      <p>
        The finance calculator helps customers explore affordability. It does <strong>not</strong>{" "}
        constitute a credit offer, pre-approval, or credit agreement. Only a registered credit
        provider may offer credit under the NCA.
      </p>

      <h2>4. Dealer responsibility</h2>
      <p>
        Dealerships using GrayArx remain responsible for NCA compliance, FAIS obligations (where
        applicable), accurate pricing, and all binding commitments made to customers. AI-generated
        figures must be confirmed by qualified staff before they are relied upon.
      </p>

      <h2>5. No financial advice</h2>
      <p>
        GrayArx does not provide financial advice. Customers should consult a registered financial
        services provider or the dealership's finance department before entering any credit agreement.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about this disclaimer: <strong>hello@grayarx.com</strong>. For privacy matters:{" "}
        <strong>privacy@grayarx.com</strong>.
      </p>
    </LegalLayout>
  );
}
