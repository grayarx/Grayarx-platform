import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Loader2 } from "lucide-react";

interface DemoBookingDialogProps {
  trigger?: React.ReactNode;
}

export default function DemoBookingDialog({ trigger }: DemoBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    dealershipName: "",
    contactName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "10:00",
    notes: "",
  });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Demo booked!", {
        description: "We've sent a calendar invite to your email.",
      });
      setOpen(false);
      setForm({
        dealershipName: "",
        contactName: "",
        email: "",
        phone: "",
        preferredDate: "",
        preferredTime: "10:00",
        notes: "",
      });
    },
    onError: (e) => toast.error(e.message || "Booking failed"),
    onSettled: () => setSubmitting(false),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    createBooking.mutate({
      dealershipName: form.dealershipName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-semibold"
          >
            Book Demo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Book a Live Demo
          </DialogTitle>
          <DialogDescription>
            See how GrayArx's AI agents handle real dealer enquiries — 30 minutes, zero pressure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-dealer" className="text-xs">Dealership *</Label>
              <Input
                id="d-dealer"
                required
                value={form.dealershipName}
                onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-name" className="text-xs">Your Name *</Label>
              <Input
                id="d-name"
                required
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-email" className="text-xs">Email *</Label>
              <Input
                id="d-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-phone" className="text-xs">Phone *</Label>
              <Input
                id="d-phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-date" className="text-xs">Preferred Date *</Label>
              <Input
                id="d-date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={form.preferredDate}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-time" className="text-xs">Preferred Time *</Label>
              <Select
                value={form.preferredTime}
                onValueChange={(v) => setForm({ ...form, preferredTime: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"].map((t) => (
                    <SelectItem key={t} value={t}>{t} SAST</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-notes" className="text-xs">Anything we should know? (optional)</Label>
            <Textarea
              id="d-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="btn-gold w-full font-semibold h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Demo Booking"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
