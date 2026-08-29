import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { OS_TIER_PRICES_ZAR } from "@shared/osPlans";

/**
 * Public-ish pricing page — list prices must match OS invoices.
 * (Routed /pricing currently redirects home; keep amounts in sync anyway.)
 */

interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  popular?: boolean;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  cta: string;
  ctaVariant: "default" | "outline" | "secondary";
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "STARTER OS",
    price: OS_TIER_PRICES_ZAR.starter,
    currency: "R",
    period: "/month",
    description: "Perfect for single-location dealerships",
    features: [
      { name: "Service Reminders & Automation", included: true },
      { name: "SMS + Email (1,000/month)", included: true },
      { name: "Basic Document Management", included: true },
      { name: "E-Signatures", included: true },
      { name: "Essential Reporting", included: true },
      { name: "Unlimited Team Members", included: true },
      { name: "Email Support", included: true },
      { name: "WhatsApp Chatbot", included: false },
      { name: "Test Drive Booking", included: false },
      { name: "Advanced Reporting", included: false },
      { name: "Multi-Location (5+)", included: false },
      { name: "Priority Support", included: false },
    ],
    cta: "Get Started",
    ctaVariant: "outline",
  },
  {
    id: "professional",
    name: "PROFESSIONAL OS",
    price: OS_TIER_PRICES_ZAR.professional,
    currency: "R",
    period: "/month",
    description: "For growing dealership networks",
    popular: true,
    features: [
      { name: "Service Reminders & Automation", included: true },
      { name: "SMS + Email (5,000/month)", included: true },
      { name: "Advanced Document Management", included: true },
      { name: "E-Signatures", included: true },
      { name: "Advanced Reporting & Forecasting", included: true },
      { name: "Unlimited Team Members", included: true },
      { name: "WhatsApp Chatbot (Nala)", included: true },
      { name: "Test Drive Booking (Lerato)", included: true },
      { name: "Multi-Location (up to 5)", included: true },
      { name: "Priority Support (< 2 hours)", included: true },
      { name: "Dedicated Success Manager", included: true },
      { name: "Unlimited Locations", included: false },
    ],
    cta: "Start Free Trial",
    ctaVariant: "default",
  },
  {
    id: "enterprise",
    name: "ENTERPRISE OS",
    price: OS_TIER_PRICES_ZAR.enterprise,
    currency: "R",
    period: "/month",
    description: "For large dealership groups",
    features: [
      { name: "Service Reminders & Automation", included: true },
      { name: "SMS + Email (Unlimited)", included: true },
      { name: "Advanced Document Management", included: true },
      { name: "E-Signatures", included: true },
      { name: "12-Month Forecasting & Analytics", included: true },
      { name: "Unlimited Team Members", included: true },
      { name: "WhatsApp Chatbot (Nala)", included: true },
      { name: "Test Drive Booking (Lerato)", included: true },
      { name: "Unlimited Locations", included: true },
      { name: "Custom Report Builder", included: true },
      { name: "Priority Support (24/7)", included: true },
      { name: "Dedicated Success Manager", included: true },
    ],
    cta: "Contact Sales",
    ctaVariant: "default",
  },
];

const VALUE_PROPOSITION = [
  {
    title: "Service Revenue",
    value: "R 16,320/month",
    description: "Automated reminders increase service appointments by 68%",
  },
  {
    title: "Cash Flow Impact",
    value: "R 3,333/month",
    description: "Faster document processing & e-signatures",
  },
  {
    title: "Inventory Optimization",
    value: "R 8,000/month",
    description: "Better tracking and allocation across locations",
  },
  {
    title: "Total Monthly Value",
    value: "R 28,195/month",
    description: "300-1,100% annual ROI depending on tier",
  },
];

export default function PricingTier3() {
  const [selectedTier, setSelectedTier] = useState<string>("professional");
  const { data: user } = trpc.auth.me.useQuery();

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    // Trigger checkout or contact form
    if (tierId === "enterprise") {
      // Open contact sales form
      window.location.href = "/contact-sales";
    } else {
      // Redirect to checkout
      window.location.href = `/checkout?tier=${tierId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Enterprise Pricing Built for Dealerships
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Simple, transparent pricing. No hidden fees. Scale from SMB to enterprise.
          </p>

          {/* Value Proposition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {VALUE_PROPOSITION.map((item, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-amber-500 mb-2">
                    {item.value}
                  </div>
                  <div className="text-sm text-slate-300">{item.title}</div>
                  <div className="text-xs text-slate-400 mt-2">{item.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative transition-all duration-300 ${
                tier.popular
                  ? "md:scale-105 border-amber-500/50 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl"
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-amber-500 text-slate-950 font-bold">
                    MOST POPULAR
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier.currency}
                      {tier.price.toLocaleString()}
                    </span>
                    <span className="text-slate-400">{tier.period}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    {tier.id === "starter" && "Best for service-focused dealerships"}
                    {tier.id === "professional" && "Best for growing networks"}
                    {tier.id === "enterprise" && "Best for large groups"}
                  </p>
                </div>
              </CardHeader>

              <CardContent>
                <Button
                  onClick={() => handleSelectTier(tier.id)}
                  variant={tier.ctaVariant}
                  className="w-full mb-8 group"
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden mb-16">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-white font-semibold">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-white font-semibold">
                    Starter
                  </th>
                  <th className="px-6 py-4 text-center text-white font-semibold">
                    Professional
                  </th>
                  <th className="px-6 py-4 text-center text-white font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Service Reminders", e: true, p: true, en: true },
                  { name: "WhatsApp Chatbot", e: false, p: true, en: true },
                  { name: "Test Drive Booking", e: false, p: true, en: true },
                  { name: "Advanced Reporting", e: false, p: true, en: true },
                  { name: "12-Month Forecasting", e: false, p: false, en: true },
                  { name: "Custom Reports", e: false, p: false, en: true },
                  { name: "Locations Supported", e: "1", p: "5", en: "Unlimited" },
                  { name: "Support", e: "Email", p: "Priority", en: "24/7" },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-700 hover:bg-slate-700/20"
                  >
                    <td className="px-6 py-4 text-slate-300">{row.name}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.e === "boolean" ? (
                        row.e ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-300">{row.e}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.p === "boolean" ? (
                        row.p ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-300">{row.p}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.en === "boolean" ? (
                        row.en ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-300">{row.en}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: "Can I upgrade or downgrade anytime?",
                a: "Yes, upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.",
              },
              {
                q: "Is there a setup fee?",
                a: "No setup fees. You pay only the monthly subscription. Onboarding is free.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, bank transfers, and EFT payments.",
              },
              {
                q: "Do you offer discounts for annual billing?",
                a: "Yes, annual billing saves you 15% compared to monthly pricing.",
              },
              {
                q: "What's included in support?",
                a: "Email support (Starter), Priority support (Professional), 24/7 support (Enterprise).",
              },
              {
                q: "Can I add more team members?",
                a: "Yes, all tiers include unlimited team members at no extra cost.",
              },
            ].map((faq, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-slate-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your dealership?
          </h2>
          <p className="text-slate-400 mb-8">
            Join 100+ dealerships already using GrayArx to automate operations and increase revenue.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => handleSelectTier("professional")}
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={() => handleSelectTier("enterprise")}
              size="lg"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
