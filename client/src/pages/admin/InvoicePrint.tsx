/**
 * Customer-ready printable invoice — GrayArx gold/black brand.
 * Open from Admin → Invoices → Download / Print, then use the browser
 * “Save as PDF” / Print dialog.
 */
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { LOGO_ICON_URL } from "@/components/Logo";
import { INVOICE_BRAND } from "@shared/invoiceBrand";
import { Printer, ArrowLeft, Download } from "lucide-react";

export default function InvoicePrint() {
  const params = useParams<{ id: string }>();
  const invoiceId = Number(params.id);

  const query = trpc.thandi.getInvoice.useQuery(
    { invoiceId },
    { enabled: Number.isFinite(invoiceId) && invoiceId > 0 },
  );

  const doc = query.data?.document;

  useEffect(() => {
    document.title = doc
      ? `Invoice ${doc.invoiceNumber} · GrayArx`
      : "Invoice · GrayArx";
  }, [doc]);

  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8">
        <p>Invalid invoice id.</p>
        <Link href="/admin/invoices">Back to invoices</Link>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 font-sans">
        Loading invoice…
      </div>
    );
  }

  if (query.error || !doc) {
    return (
      <div className="min-h-screen bg-white text-slate-900 p-8 font-sans">
        <p className="mb-4">{query.error?.message ?? "Invoice not found."}</p>
        <Button asChild variant="outline">
          <Link href="/admin/invoices">← Back to invoices</Link>
        </Button>
      </div>
    );
  }

  const accent = doc.accentColor || INVOICE_BRAND.gold;
  const logoSrc = doc.logoUrl || LOGO_ICON_URL;

  return (
    <div className="invoice-print-root min-h-screen bg-[#f3f1ec] text-[#1a1a1a]">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .invoice-print-toolbar { display: none !important; }
          .invoice-print-root { background: #fff !important; }
          .invoice-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
            border: none !important;
          }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="invoice-print-toolbar sticky top-0 z-10 border-b border-black/10 bg-[#0b0b0b] text-white print:hidden">
        <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link href="/admin/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Thandi invoices
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-[#C9A24A] text-black hover:bg-[#d4af37]"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <article
        className="invoice-sheet mx-auto my-6 max-w-[820px] rounded-sm border border-black/5 bg-white px-8 py-10 shadow-sm sm:px-12"
        style={{ fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif' }}
      >
        {/* Letterhead */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 pb-6" style={{ borderColor: accent }}>
          <div className="flex items-start gap-4">
            <img
              src={logoSrc}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
            <div>
              <div
                className="text-xl font-bold tracking-[0.12em] uppercase"
                style={{ color: INVOICE_BRAND.ink }}
              >
                {doc.from.name}
              </div>
              {doc.from.subtitle && (
                <div className="mt-1 text-sm" style={{ color: INVOICE_BRAND.muted }}>
                  {doc.from.subtitle}
                </div>
              )}
              <div className="mt-3 space-y-0.5 text-xs leading-relaxed" style={{ color: INVOICE_BRAND.muted }}>
                {doc.from.address && <div>{doc.from.address}</div>}
                {doc.from.email && <div>{doc.from.email}</div>}
                {doc.from.phone && <div>{doc.from.phone}</div>}
                {doc.from.taxLine && <div>{doc.from.taxLine}</div>}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              Tax invoice
            </div>
            <div className="mt-1 font-mono text-lg font-bold">{doc.invoiceNumber}</div>
            <div className="mt-3 space-y-1 text-xs" style={{ color: INVOICE_BRAND.muted }}>
              <div>
                <span className="font-medium text-[#1a1a1a]">Date:</span> {doc.invoiceDate}
              </div>
              <div>
                <span className="font-medium text-[#1a1a1a]">Due:</span> {doc.dueDate}
              </div>
              <div>
                <span className="font-medium text-[#1a1a1a]">Status:</span>{" "}
                <span className="uppercase tracking-wide">{doc.status}</span>
              </div>
              <div>
                <span className="font-medium text-[#1a1a1a]">Currency:</span> ZAR
              </div>
            </div>
          </div>
        </header>

        {/* Bill to */}
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Bill to
            </div>
            <div className="text-base font-semibold">{doc.billTo.name}</div>
            <div className="mt-1 space-y-0.5 text-sm" style={{ color: INVOICE_BRAND.muted }}>
              {doc.billTo.email && <div>{doc.billTo.email}</div>}
              {doc.billTo.phone && <div>{doc.billTo.phone}</div>}
              {doc.billTo.detail && <div>{doc.billTo.detail}</div>}
            </div>
          </div>
          <div className="rounded-sm p-4" style={{ background: INVOICE_BRAND.paperTint }}>
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Amount due
            </div>
            <div className="text-3xl font-bold tracking-tight">{doc.totalFormatted}</div>
            <div className="mt-1 text-xs" style={{ color: INVOICE_BRAND.muted }}>
              Prepared by {doc.preparedBy}
            </div>
          </div>
        </section>

        {/* Line items */}
        <section className="mt-10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: INVOICE_BRAND.black, color: "#fff" }}>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Description
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Amount (ZAR)
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.lineItems.map((item, i) => (
                <tr
                  key={`${item.description}-${i}`}
                  style={{ borderBottom: `1px solid ${INVOICE_BRAND.rule}` }}
                >
                  <td className="px-3 py-3 align-top">{item.description}</td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-3 text-right align-top tabular-nums font-medium">
                    {new Intl.NumberFormat("en-ZA", {
                      style: "currency",
                      currency: "ZAR",
                      minimumFractionDigits: 2,
                    }).format(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: INVOICE_BRAND.muted }}>Subtotal</span>
              <span className="tabular-nums font-medium">{doc.subtotalFormatted}</span>
            </div>
            {doc.showVat && (
              <div className="flex justify-between">
                <span style={{ color: INVOICE_BRAND.muted }}>VAT (15%)</span>
                <span className="tabular-nums font-medium">{doc.vatFormatted}</span>
              </div>
            )}
            {!doc.showVat && (
              <div className="flex justify-between text-xs" style={{ color: INVOICE_BRAND.muted }}>
                <span>VAT</span>
                <span>Not charged / not registered</span>
              </div>
            )}
            <div
              className="flex justify-between border-t-2 pt-3 text-base font-bold"
              style={{ borderColor: accent }}
            >
              <span>Total due</span>
              <span className="tabular-nums">{doc.totalFormatted}</span>
            </div>
          </div>
        </section>

        {/* Payments */}
        {doc.payments.length > 0 && (
          <section className="mt-10">
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Payments recorded
            </div>
            <ul className="space-y-1 text-sm" style={{ color: INVOICE_BRAND.muted }}>
              {doc.payments.map((p, i) => (
                <li key={i}>
                  {p.paymentDate} · {p.method} · {p.amountFormatted}
                  {p.reference ? ` · Ref ${p.reference}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* EFT / bank payment */}
        {doc.eftPayment && (
          <section
            className="mt-8 rounded-sm border px-4 py-4 text-sm"
            style={{ borderColor: accent, background: INVOICE_BRAND.paperTint }}
          >
            <div
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Pay by EFT / bank transfer
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wide" style={{ color: INVOICE_BRAND.muted }}>
                  Bank
                </dt>
                <dd className="font-semibold">{doc.eftPayment.bankName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide" style={{ color: INVOICE_BRAND.muted }}>
                  Account name
                </dt>
                <dd className="font-semibold">{doc.eftPayment.accountName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide" style={{ color: INVOICE_BRAND.muted }}>
                  Account number
                </dt>
                <dd className="font-mono font-semibold tracking-wide">
                  {doc.eftPayment.accountNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide" style={{ color: INVOICE_BRAND.muted }}>
                  Branch code
                </dt>
                <dd className="font-mono font-semibold">{doc.eftPayment.branchCode}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wide" style={{ color: INVOICE_BRAND.muted }}>
                  Payment reference
                </dt>
                <dd className="font-mono font-semibold">{doc.eftPayment.paymentReference}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs" style={{ color: INVOICE_BRAND.muted }}>
              Use the invoice number as your payment reference so we can allocate your payment.
            </p>
          </section>
        )}

        {doc.dealershipBankNote && !doc.eftPayment && (
          <section
            className="mt-8 rounded-sm border px-4 py-3 text-sm"
            style={{ borderColor: INVOICE_BRAND.rule }}
          >
            <div
              className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Dealership payment details
            </div>
            <div style={{ color: INVOICE_BRAND.muted }}>{doc.dealershipBankNote}</div>
          </section>
        )}

        {!doc.eftPayment && !doc.dealershipBankNote && doc.bankDetailsMasked && (
          <section className="mt-8 rounded-sm border px-4 py-3 text-sm" style={{ borderColor: INVOICE_BRAND.rule }}>
            <div
              className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Payment details
            </div>
            <div style={{ color: INVOICE_BRAND.muted }}>
              Bank reference (masked): {doc.bankDetailsMasked}
            </div>
          </section>
        )}

        {!doc.eftPayment && doc.letterheadMode === "platform" && (
          <section
            className="mt-8 rounded-sm border border-dashed px-4 py-3 text-sm"
            style={{ borderColor: INVOICE_BRAND.rule, color: INVOICE_BRAND.muted }}
          >
            EFT bank details are not configured yet. Set{" "}
            <span className="font-mono text-xs">BANK_ACCOUNT_NUMBER</span> (and related vars) on the
            server to show payment instructions on this invoice.
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-xs leading-relaxed" style={{ borderColor: INVOICE_BRAND.rule, color: INVOICE_BRAND.muted }}>
          {doc.platformCredit && <p className="mb-2">{doc.platformCredit}</p>}
          <p className="mb-2">{doc.popiaFooter}</p>
          <p>
            {doc.grayArxLegalName} · {doc.grayArxWebsite.replace(/^https?:\/\//, "")}
          </p>
        </footer>
      </article>
    </div>
  );
}
