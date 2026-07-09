import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Car,
  Calendar,
  Upload,
} from "lucide-react";
import { OWNER_EMAIL, OWNER_PHONE_DISPLAY, OWNER_PHONE_E164, OWNER_WHATSAPP_URL } from "@/lib/contact";

const FAQS = [
  {
    q: "What does the pilot include?",
    a: "Pilot partners receive Growth-level features: public showroom, CSV inventory import, web + WhatsApp Nala, lead pipeline, test-drive bookings, deal scores, 8-angle photos, and trade-in network. Pricing is tailored — we confirm terms before billing goes live.",
  },
  {
    q: "How do I add vehicles to my showroom?",
    a: "Go to Dashboard → Inventory → Add vehicle. You can also bulk-import from AutoTrader or Cars.co.za CSV via Import CSV. Imported stock feeds your web showroom and chatbot automatically.",
  },
  {
    q: "How do the AI agents work?",
    a: "Each agent handles a specific job behind the scenes: Nala (WhatsApp), Mia (email), Lerato (bookings), Sipho (prospecting), Tumi (trade-in), and Kagiso (improvements). You see leads and bookings in your dashboard — GrayArx runs the agents for you. Outbound AI calling is a future opt-in, not part of the pilot.",
  },
  {
    q: "Why didn't I receive a confirmation email?",
    a: "Email delivery requires API credentials (SendGrid/Resend) to be configured in your environment. During the pilot, confirmations may not send until credentials are connected — your data is still saved.",
  },
  {
    q: "How do test-drive bookings work?",
    a: "When a customer requests a test drive via the website or WhatsApp, Lerato pencils in a slot and it appears under Bookings → Customer test drives. You confirm, reschedule, or cancel from there.",
  },
  {
    q: "Is my data POPIA compliant?",
    a: "Yes. GrayArx includes consent capture, audit logs, and South African data residency. See our Privacy Policy and DPA for full details.",
  },
  {
    q: "What languages are supported?",
    a: "All 11 South African official languages plus Portuguese for cross-border customers.",
  },
];

const QUICK_LINKS = [
  { href: "/dealer/inventory", label: "Manage Inventory", icon: Car, desc: "Add or import vehicles" },
  { href: "/dealer/bookings", label: "Bookings", icon: Calendar, desc: "Test drives & demos" },
  { href: "/dealer/inventory/import", label: "CSV Import", icon: Upload, desc: "Bulk upload for chatbots" },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filtered = FAQS.filter(
    (f) =>
      !search ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <section className="pt-32 pb-12 gradient-mesh">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass-gold text-xs font-medium uppercase tracking-widest text-primary">
            <HelpCircle className="h-3.5 w-3.5" /> Help Centre
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">How can we help?</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Guides, FAQs, and quick links for your dealership console.
          </p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles…"
            className="max-w-md mx-auto h-12"
          />
        </div>
      </section>

      <section className="pb-12">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href}>
                <Card className="glass border-primary/10 hover:border-primary/30 transition cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <Card
                key={faq.q}
                className="glass border-primary/10 cursor-pointer"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{faq.q}</p>
                    {openIdx === i ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  {openIdx === i && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-2xl">
          <Card className="glass-gold border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl font-bold mb-2">Still need help?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Our team responds within one business day during the pilot.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline">
                  <a href={`mailto:${OWNER_EMAIL}`}>
                    <Mail className="h-4 w-4 mr-2" /> {OWNER_EMAIL}
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={`tel:${OWNER_PHONE_E164}`}>
                    <Phone className="h-4 w-4 mr-2" /> {OWNER_PHONE_DISPLAY}
                  </a>
                </Button>
                <Button asChild className="btn-gold">
                  <a href={OWNER_WHATSAPP_URL} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
