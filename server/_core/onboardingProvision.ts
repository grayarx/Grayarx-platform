/**
 * First night after Approve & provision: dealer login + Pilot cap + kickoff email.
 * Creating a dealership row is not enough — they cannot log in without a users row.
 */

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { hashPassword } from "./passwordHashing";
import { setDealershipPlan } from "@nalaOs/billing/usage";
import { sendEmailViaResend } from "./resendEmailService";
import { grayArxEmailFooter, grayArxEmailHeader } from "../../shared/emailBranding";

export type DealerOwnerLoginPlan =
  | { action: "create" }
  | { action: "link"; userId: number }
  | { action: "conflict"; userId: number; otherDealershipId: number };

export function planDealerOwnerLogin(
  existing: { id: number; dealershipId: number | null } | null,
  dealershipId: number,
): DealerOwnerLoginPlan {
  if (!existing) return { action: "create" };
  if (!existing.dealershipId || existing.dealershipId === dealershipId) {
    return { action: "link", userId: existing.id };
  }
  return {
    action: "conflict",
    userId: existing.id,
    otherDealershipId: existing.dealershipId,
  };
}

export type DealerOwnerLoginResult = {
  email: string;
  created: boolean;
  linkedExisting: boolean;
  conflict: boolean;
  temporaryPassword: string | null;
  userId: number | null;
};

export async function ensureDealerOwnerLogin(input: {
  dealershipId: number;
  email: string;
  name: string;
}): Promise<DealerOwnerLoginResult> {
  const email = input.email.trim().toLowerCase();
  const empty: DealerOwnerLoginResult = {
    email,
    created: false,
    linkedExisting: false,
    conflict: false,
    temporaryPassword: null,
    userId: null,
  };
  const db = await getDb();
  if (!db) return empty;

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const plan = planDealerOwnerLogin(
    existing ? { id: existing.id, dealershipId: existing.dealershipId } : null,
    input.dealershipId,
  );

  if (plan.action === "conflict") {
    console.warn(
      `[Onboarding] ${email} already on dealership ${plan.otherDealershipId} — not linking to ${input.dealershipId}`,
    );
    return { ...empty, conflict: true, userId: plan.userId };
  }

  if (plan.action === "link") {
    await db
      .update(users)
      .set({
        dealershipId: input.dealershipId,
        role: "dealer_owner",
        name: input.name.trim() || existing!.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, plan.userId));
    return {
      ...empty,
      linkedExisting: true,
      userId: plan.userId,
    };
  }

  const temporaryPassword = randomBytes(5).toString("base64url").slice(0, 10);
  const passwordHash = await hashPassword(temporaryPassword);
  const openId = `owner_${input.dealershipId}_${Date.now()}_${randomBytes(3).toString("hex")}`;
  const result: any = await db.insert(users).values({
    openId,
    email,
    name: input.name.trim() || email.split("@")[0],
    passwordHash,
    loginMethod: "email",
    role: "dealer_owner",
    dealershipId: input.dealershipId,
    emailVerified: 1,
  });
  const userId = Number(result[0]?.insertId ?? 0);
  return {
    email,
    created: true,
    linkedExisting: false,
    conflict: false,
    temporaryPassword,
    userId,
  };
}

export function buildProvisionedEmailHtml(opts: {
  ownerName: string;
  dealershipName: string;
  email: string;
  temporaryPassword: string | null;
  shortcode: string;
  csvUrl?: string | null;
}): string {
  const showroom = `https://www.grayarx.com/showroom?shortcode=${encodeURIComponent(opts.shortcode)}`;
  const passwordBlock = opts.temporaryPassword
    ? `<p style="line-height:1.6;color:#ccc;">Sign in at <a href="https://www.grayarx.com/login" style="color:#d4af37;">grayarx.com/login</a></p>
          <ul style="color:#ccc;line-height:1.6;">
            <li>Email: ${escapeHtml(opts.email)}</li>
            <li>Temporary password: <code style="color:#d4af37;">${escapeHtml(opts.temporaryPassword)}</code></li>
          </ul>
          <p style="line-height:1.6;color:#888;font-size:13px;">Change this password after first login.</p>`
    : `<p style="line-height:1.6;color:#ccc;">Sign in at <a href="https://www.grayarx.com/login" style="color:#d4af37;">grayarx.com/login</a> with <strong>${escapeHtml(opts.email)}</strong> (your existing GrayArx password).</p>`;

  const csvLine = opts.csvUrl?.trim()
    ? `<li>We already have a stock CSV link from your application — import it under Inventory → Import, or paste a fresh export.</li>`
    : `<li>Import live stock (CSV / DMS export) under <strong>Inventory → Import</strong>.</li>`;

  return `
    <html><body style="font-family:Inter,sans-serif;background:#0a0a0a;padding:24px;margin:0;">
      <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #d4af3744;border-radius:12px;overflow:hidden;">
        ${grayArxEmailHeader("Your yard is provisioned")}
        <div style="padding:32px;color:#e8e8e8;">
          <p style="line-height:1.6;">Hi ${escapeHtml(opts.ownerName)},</p>
          <p style="line-height:1.6;color:#ccc;">
            <strong>${escapeHtml(opts.dealershipName)}</strong> is on GrayArx. This is a 14-day Pilot — Nala answers WhatsApp from live stock once cars are on the floor.
          </p>
          ${passwordBlock}
          <p style="line-height:1.6;color:#ccc;font-size:14px;margin-top:24px;">First night:</p>
          <ol style="color:#ccc;line-height:1.7;padding-left:20px;">
            ${csvLine}
            <li>Open your public showroom: <a href="${showroom}" style="color:#d4af37;">${showroom}</a></li>
            <li>WhatsApp auto-links when your Meta display number matches the phone on this application. If it does not, GrayArx pastes the Phone Number ID in Settings.</li>
            <li>Send one test: “Is this still available?” — Nala should reply with price and a viewing ask.</li>
          </ol>
          <p style="line-height:1.6;color:#888;font-size:13px;">
            Dealer Agreement + POPIA: <a href="https://www.grayarx.com/legal" style="color:#d4af37;">grayarx.com/legal</a>. Questions — reply or WhatsApp +27 79 491 5187.
          </p>
        </div>
        ${grayArxEmailFooter()}
      </div>
    </body></html>
  `;
}

export async function sendOnboardingProvisionedEmail(opts: {
  to: string;
  ownerName: string;
  dealershipName: string;
  temporaryPassword: string | null;
  shortcode: string;
  csvUrl?: string | null;
}): Promise<void> {
  await sendEmailViaResend({
    to: opts.to,
    subject: `${opts.dealershipName} is live on GrayArx — first night`,
    html: buildProvisionedEmailHtml({
      ownerName: opts.ownerName,
      dealershipName: opts.dealershipName,
      email: opts.to,
      temporaryPassword: opts.temporaryPassword,
      shortcode: opts.shortcode,
      csvUrl: opts.csvUrl,
    }),
    from: "pilot@grayarx.com",
    replyTo: "hello@grayarx.com",
  });
}

export async function finishOnboardingProvision(input: {
  dealershipId: number;
  created: boolean;
  publicShortcode?: string;
  ownerEmail: string;
  ownerName: string;
  dealershipName: string;
  csvUrl?: string | null;
}): Promise<{
  dealershipId: number;
  created: boolean;
  publicShortcode?: string;
  login: DealerOwnerLoginResult;
}> {
  try {
    setDealershipPlan(String(input.dealershipId), "pilot");
  } catch (e) {
    console.warn("[Onboarding] Pilot plan not set:", e instanceof Error ? e.message : e);
  }

  const login = await ensureDealerOwnerLogin({
    dealershipId: input.dealershipId,
    email: input.ownerEmail,
    name: input.ownerName,
  });

  const shortcode = input.publicShortcode?.trim() || "";
  if (shortcode && !login.conflict && (input.created || login.created)) {
    try {
      await sendOnboardingProvisionedEmail({
        to: login.email,
        ownerName: input.ownerName,
        dealershipName: input.dealershipName,
        temporaryPassword: login.temporaryPassword,
        shortcode,
        csvUrl: input.csvUrl,
      });
    } catch (e) {
      console.warn("[Onboarding] provisioned email failed:", e instanceof Error ? e.message : e);
    }
  }

  return {
    dealershipId: input.dealershipId,
    created: input.created,
    publicShortcode: input.publicShortcode,
    login,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
