import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatVehiclePrice } from "@/lib/formatPrice";

interface ShowroomEnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: {
    id: string;
    title: string;
    price: number;
    year: number;
    km: number;
    fuel: string;
    transmission: string;
    image?: string;
  };
  dealershipEmail?: string;
  dealershipName?: string;
}

export function ShowroomEnquiryModal({
  open,
  onOpenChange,
  vehicle,
  dealershipEmail = "info@grayarx.com",
  dealershipName = "GrayArx Dealership",
}: ShowroomEnquiryModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enquire = trpc.showroom.enquire.useMutation({
    onSuccess: (data) => {
      toast.success("Enquiry sent!", {
        description: data.message || "The dealership will contact you soon.",
      });
      setEmail("");
      setName("");
      setPhone("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to send enquiry", {
        description: error.message || "Please try again.",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !phone) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    enquire.mutate({
      vehicleId: vehicle.id,
      vehicleTitle: vehicle.title,
      vehiclePrice: vehicle.price,
      vehicleYear: vehicle.year,
      vehicleKm: vehicle.km,
      vehicleFuel: vehicle.fuel,
      vehicleTransmission: vehicle.transmission,
      vehicleImage: vehicle.image,
      clientEmail: email,
      clientName: name,
      clientPhone: phone,
      dealershipEmail,
      dealershipName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enquire about this vehicle</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-3 pt-1">
              {vehicle.image && (
                <img
                  src={vehicle.image}
                  alt=""
                  className="h-12 w-16 rounded-md object-cover object-center img-premium shrink-0"
                />
              )}
              <span>
                {vehicle.title} · {vehicle.year} · {formatVehiclePrice(vehicle.price)}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+27 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-gold flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Enquiry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
