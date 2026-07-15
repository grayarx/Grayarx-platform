/**
 * Customer-ready printable invoice — GrayArx gold/black brand.
 * Open from Admin → Invoices → Download / Print, then use the browser
 * “Save as PDF” / Print dialog.
 */
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { InvoiceSheet } from "@/components/invoices/InvoiceSheet";
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
        <InvoiceSheet doc={doc} />
      </article>
    </div>
  );
}
