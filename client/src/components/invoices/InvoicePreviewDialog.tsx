/**
 * Modal preview of an invoice document — used both for "Draft invoice"
 * (before it's persisted) and before an explicit "Send" action, so
 * Thandi/founder can eyeball the actual PDF (letterhead, VAT, totals, FNB
 * EFT details) before anything goes out.
 */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceSheet } from "@/components/invoices/InvoiceSheet";
import type { InvoiceDocumentView } from "@shared/invoiceDocument";
import type { ReactNode } from "react";

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  title,
  loading,
  doc,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  loading?: boolean;
  doc: InvoiceDocumentView | null | undefined;
  footer: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto rounded-sm border border-black/10">
          {loading && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground bg-white">
              Building preview…
            </div>
          )}
          {!loading && doc && (
            <div
              className="bg-white px-6 py-8 text-[#1a1a1a] sm:px-10"
              style={{ fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif' }}
            >
              <InvoiceSheet doc={doc} />
            </div>
          )}
          {!loading && !doc && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground bg-white">
              Preview unavailable.
            </div>
          )}
        </div>

        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
