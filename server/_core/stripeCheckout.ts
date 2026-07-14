/**
 * Stripe Checkout helpers — real API when STRIPE_SECRET_KEY is set.
 * Bank/EFT invoicing works without Stripe; Checkout is optional.
 */

import Stripe from "stripe";
import { TIER_PRICES_ZAR, type SubscriptionTierId } from "../../shared/subscriptionTiers";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export async function createInvoiceCheckoutSession(opts: {
  invoiceId: number;
  invoiceNumber: string;
  dealershipName: string;
  amountZar: number;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { error: "STRIPE_SECRET_KEY not configured — use bank/EFT invoice instead" };
  }

  const amountCents = Math.round(opts.amountZar * 100);
  if (amountCents < 100) {
    return { error: "Invoice amount too small for Stripe Checkout" };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: opts.customerEmail || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "zar",
          unit_amount: amountCents,
          product_data: {
            name: `GrayArx invoice ${opts.invoiceNumber}`,
            description: `Subscription / services — ${opts.dealershipName}`,
          },
        },
      },
    ],
    metadata: {
      invoiceId: String(opts.invoiceId),
      invoiceNumber: opts.invoiceNumber,
      source: "grayarx_invoice",
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  if (!session.url) {
    return { error: "Stripe did not return a Checkout URL" };
  }

  return { url: session.url, sessionId: session.id };
}

export async function createSubscriptionCheckoutSession(opts: {
  dealershipId: number;
  plan: SubscriptionTierId;
  dealershipName: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { error: "STRIPE_SECRET_KEY not configured — use bank/EFT invoice instead" };
  }

  const amountZar = TIER_PRICES_ZAR[opts.plan];
  const amountCents = Math.round(amountZar * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: opts.customerEmail || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "zar",
          unit_amount: amountCents,
          product_data: {
            name: `GrayArx ${opts.plan} — monthly`,
            description: `${opts.dealershipName} · ${opts.plan} plan`,
          },
        },
      },
    ],
    metadata: {
      dealershipId: String(opts.dealershipId),
      plan: opts.plan,
      source: "grayarx_subscription",
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  if (!session.url) {
    return { error: "Stripe did not return a Checkout URL" };
  }

  return { url: session.url, sessionId: session.id };
}
