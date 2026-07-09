import { Link } from "wouter";
import Logo from "./Logo";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { OWNER_PHONE_DISPLAY, OWNER_PHONE_E164, OWNER_EMAIL, OWNER_WHATSAPP_URL } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(212,175,55,0.15)] bg-[oklch(0.12_0_0)] mt-32">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Logo size={40} />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg font-bold tracking-tight">
                  GrayArx
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  AI Platform
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Dealership AI Operating System. Your 24/7 AI sales team built for South African dealerships.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 text-primary uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/showroom" className="hover:text-primary">Showroom</Link></li>
              <li><Link href="/help" className="hover:text-primary">Help Centre</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><Link href="/#agents" className="hover:text-primary">AI Agents</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 text-primary uppercase tracking-widest">
              Legal & Compliance
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/ai-ethics" className="hover:text-primary">AI Ethics</Link></li>
              <li><Link href="/dpa" className="hover:text-primary">Data Processing</Link></li>
              <li><Link href="/aup" className="hover:text-primary">Acceptable Use</Link></li>
              <li><Link href="/sla" className="hover:text-primary">SLA (99.5%)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold mb-4 text-primary uppercase tracking-widest">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${OWNER_EMAIL}`} className="flex items-start gap-2 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 mt-0.5 text-primary" />
                  <span>{OWNER_EMAIL}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${OWNER_PHONE_E164}`} className="flex items-start gap-2 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 mt-0.5 text-primary" />
                  <span>{OWNER_PHONE_DISPLAY}</span>
                </a>
              </li>
              <li>
                <a href={OWNER_WHATSAPP_URL} target="_blank" rel="noreferrer noopener" className="flex items-start gap-2 hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4 mt-0.5 text-primary" />
                  <span>WhatsApp us</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[rgba(212,175,55,0.1)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GrayArx. All rights reserved. POPIA compliant.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for South African dealerships
          </p>
        </div>
      </div>
    </footer>
  );
}
