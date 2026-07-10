import LegalLayout from "@/components/LegalLayout";

export default function SLA() {
  return (
    <LegalLayout
      title="Service Level Agreement"
      subtitle="A 99.5% monthly uptime commitment with measurable credits."
      effectiveDate="10 July 2026"
    >
      <h2>1. Uptime commitment</h2>
      <p>
        GrayArx commits to a <strong>monthly uptime of at least 99.5%</strong> for the production platform (dealer dashboard, public showroom, and AI agent endpoints) on Professional and Enterprise plans. Enterprise customers can opt into a 99.9% commitment as part of their contract.
      </p>

      <h2>2. How uptime is measured</h2>
      <p>
        Uptime is measured monthly, calculated as the total number of minutes in the calendar month minus the minutes the service was Unavailable, divided by the total minutes in the month.
      </p>
      <p>
        <strong>"Unavailable"</strong> means the service returns errors for more than 5% of legitimate requests for at least 5 consecutive minutes, as measured by our external monitoring.
      </p>

      <h2>3. Service credits</h2>
      <p>If we fail to meet the uptime commitment in any calendar month, eligible customers may request the following service credit applied to the next month's invoice:</p>

      <table>
        <thead>
          <tr>
            <th>Monthly Uptime</th>
            <th>Service Credit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>99.0% – &lt; 99.5%</td>
            <td>10% of monthly fee</td>
          </tr>
          <tr>
            <td>95.0% – &lt; 99.0%</td>
            <td>25% of monthly fee</td>
          </tr>
          <tr>
            <td>&lt; 95.0%</td>
            <td>50% of monthly fee</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Exclusions</h2>
      <p>The uptime commitment excludes downtime caused by:</p>
      <ul>
        <li>Scheduled maintenance announced at least 48 hours in advance (we aim for less than 4 hours per month).</li>
        <li>Force majeure including natural disasters, large-scale internet outages, or government action.</li>
        <li>Customer-side issues including misconfiguration, third-party services or networks outside our control.</li>
        <li>Any breach of the Terms of Service or Acceptable Use Policy.</li>
      </ul>

      <h2>5. How to claim a credit</h2>
      <p>
        To request a service credit, email <strong>support@grayarx.com</strong> within 30 days of the end of the affected month, including the dates and times of the unavailability you observed and any supporting evidence. Approved credits will appear on the next invoice. Service credits are the sole remedy under this SLA.
      </p>

      <h2>6. Support response times</h2>
      <p>We commit to the following first-response targets during business hours (Mon–Fri, 08:00–17:00 SAST):</p>

      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Description</th>
            <th>First Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>P1 — Critical</td>
            <td>Production down or unusable</td>
            <td>1 hour (24/7)</td>
          </tr>
          <tr>
            <td>P2 — High</td>
            <td>Major feature broken; workaround available</td>
            <td>4 hours</td>
          </tr>
          <tr>
            <td>P3 — Normal</td>
            <td>Minor issue or question</td>
            <td>1 business day</td>
          </tr>
          <tr>
            <td>P4 — Low</td>
            <td>Feature request or general feedback</td>
            <td>3 business days</td>
          </tr>
        </tbody>
      </table>

      <h2>7. Status page</h2>
      <p>
        Live system status, scheduled maintenance, and incident history are published at <strong>status.grayarx.com</strong>. We commit to posting an incident update within 15 minutes of confirmation.
      </p>

      <h2>8. Contact</h2>
      <p>
        Support · <strong>support@grayarx.com</strong> · +27 (0) 11 000 0000
      </p>
    </LegalLayout>
  );
}
