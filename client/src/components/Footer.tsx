import { Link } from "wouter";
import Logo from "./Logo";
import { GRAYARX_LEGAL } from "@shared/companyLegal";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { OWNER_PHONE_DISPLAY, OWNER_PHONE_E164, OWNER_EMAIL, OWNER_WHATSAPP_URL } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="relative border-t border-primary/15 bg-[#040406] mt-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 cyber-grid opacity-30" aria-hidden />
      <div className="container relative py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <Logo size={36} variant="icon" />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                  GrayArx
                </span>
                <span className="font-tech text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  AI Platform
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Dealership AI Operating System. Your 24/7 AI sales team built for South African
              dealerships.
            </p>
          </div>

          <div>
            <h4 className="font-tech text-[10px] font-semibold mb-5 text-primary uppercase tracking-[0.25em]">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/showroom" className="hover:text-primary transition-colors">Showroom</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link href="/#features" className="hover:text-primary transition-colors">Platform</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-tech text-[10px] font-semibold mb-5 text-primary uppercase tracking-[0.25em]">
              Legal & Compliance
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/legal" className="hover:text-primary transition-colors font-medium text-foreground/90">Legal centre (all documents)</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/ai-ethics" className="hover:text-primary transition-colors">AI Ethics</Link></li>
              <li><Link href="/dpa" className="hover:text-primary transition-colors">Data Processing</Link></li>
              <li><Link href="/aup" className="hover:text-primary transition-colors">Acceptable Use</Link></li>
              <li><Link href="/sla" className="hover:text-primary transition-colors">SLA (99.5%)</Link></li>
              <li><Link href="/credit-disclaimer" className="hover:text-primary transition-colors">Credit Disclaimer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-tech text-[10px] font-semibold mb-5 text-primary uppercase tracking-[0.25em]">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${OWNER_EMAIL}`} className="flex items-start gap-2 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{OWNER_EMAIL}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${OWNER_PHONE_E164}`} className="flex items-start gap-2 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{OWNER_PHONE_DISPLAY}</span>
                </a>
              </li>
              <li>
                <a href={OWNER_WHATSAPP_URL} target="_blank" rel="noreferrer noopener" className="flex items-start gap-2 hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>WhatsApp us</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="section-divider-glow my-12" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-tech text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              © {new Date().getFullYear()} GrayArx (Pty) Ltd · Ent. {GRAYARX_LEGAL.enterpriseNumber} · Income tax ref {GRAYARX_LEGAL.incomeTaxReference}
            </p>
            <p className="font-tech text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 mt-1">
              POPIA compliant · Built for South African dealerships
            </p>
          </div>
          <Link
            href="/legal"
            className="font-tech text-[10px] uppercase tracking-[0.18em] text-primary/80 hover:text-primary transition-colors"
          >
            Legal centre →
          </Link>
        </div>
      </div>
    </footer>
  );
}
