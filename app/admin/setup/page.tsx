"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SetupPayload = {
  twilio: {
    accountSidSet: boolean;
    authTokenSet: boolean;
    fromNumberSet: boolean;
    fromNumber?: string;
    webhookBaseUrlSet: boolean;
    webhookBaseUrl?: string;
    readyToDial: boolean;
    message: string;
  };
  regulatory: { note: string };
  nextSteps: string[];
};

type VerifyPayload = {
  ok: boolean;
  accountName?: string;
  balance?: string;
  error?: string;
};

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
          ok ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {ok ? "✓" : "·"}
      </span>
      <span className={ok ? "text-zinc-200" : "text-zinc-500"}>{label}</span>
    </li>
  );
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupPayload | null>(null);
  const [verify, setVerify] = useState<VerifyPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/setup/status");
    setStatus((await response.json()) as SetupPayload);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function testTwilio() {
    setLoading(true);
    setVerify(null);
    try {
      const response = await fetch("/api/setup/verify", { method: "POST" });
      setVerify((await response.json()) as VerifyPayload);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            Step-by-step
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Connect Twilio to Themba
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            You only paste secrets once in{" "}
            <code className="text-zinc-200">.env.local</code>. Everything else is
            already built.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <h2 className="text-lg font-semibold text-emerald-100">
            Where to paste (pick ONE place)
          </h2>
          <div className="mt-3 space-y-4 text-sm leading-6 text-emerald-100/90">
            <div>
              <p className="font-semibold text-white">
                ✅ Easiest — Cursor secrets popup (recommended)
              </p>
              <p className="mt-1">
                In this Cursor agent chat, look for the{" "}
                <strong>Twilio credentials for Themba</strong> form that appeared
                above. Paste your Account SID, Auth Token, and webhook URL there.
                The agent saves them securely — you do not create any file yourself.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white">
                Alternative — Cursor file explorer
              </p>
              <p className="mt-1">
                Left sidebar → open this project&apos;s root folder → New file →
                name it exactly <code className="text-emerald-200">.env.local</code>{" "}
                (same level as <code className="text-emerald-200">package.json</code>
                , not inside <code className="text-emerald-200">app/</code>).
              </p>
            </div>
            <div>
              <p className="font-semibold text-white">
                ❌ Not on grayarx.com yet
              </p>
              <p className="mt-1">
                The live GrayArx website does not have a settings page for Twilio
                yet. Production keys go in your host (e.g. Vercel env vars) when
                we deploy — not in the browser.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">
            1 · Paste your Twilio keys
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            In the project folder, create or edit{" "}
            <code className="text-zinc-200">.env.local</code> and paste:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-800 bg-black p-4 text-xs leading-6 text-emerald-200">
{`TWILIO_ACCOUNT_SID=AC...paste yours...
TWILIO_AUTH_TOKEN=...paste yours...
TWILIO_WEBHOOK_BASE_URL=https://grayarx.com

# Add AFTER bundle approved + number bought:
# TWILIO_FROM_NUMBER=+2760xxxxxxx`}
          </pre>
          <p className="mt-3 text-xs text-zinc-500">
            Do not paste tokens in chat — only in .env.local. Restart the app
            after saving.
          </p>
          <button
            type="button"
            onClick={testTwilio}
            disabled={loading}
            className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Testing…" : "Test my Twilio connection"}
          </button>
          {verify ? (
            <p
              className={`mt-3 text-sm ${verify.ok ? "text-emerald-300" : "text-red-300"}`}
            >
              {verify.ok
                ? `Connected to ${verify.accountName}. Balance: ${verify.balance}.`
                : verify.error}
            </p>
          ) : null}
        </section>

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">2 · Checklist</h2>
          {status ? (
            <ul className="mt-4 space-y-2">
              <Check ok={status.twilio.accountSidSet} label="Account SID saved" />
              <Check ok={status.twilio.authTokenSet} label="Auth Token saved" />
              <Check
                ok={status.twilio.webhookBaseUrlSet}
                label={`Webhook URL${status.twilio.webhookBaseUrl ? `: ${status.twilio.webhookBaseUrl}` : ""}`}
              />
              <Check
                ok={status.twilio.fromNumberSet}
                label={`Phone number${status.twilio.fromNumber ? `: ${status.twilio.fromNumber}` : " (waiting for bundle)"}`}
              />
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Loading…</p>
          )}
          {status?.twilio.readyToDial ? (
            <p className="mt-4 text-sm font-medium text-emerald-300">
              All green — Themba can dial!
            </p>
          ) : null}
        </section>

        <section className="mb-6 rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
          <h2 className="text-lg font-semibold text-amber-100">
            3 · Wait for Gray Ox bundle
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-200/80">
            {status?.regulatory.note ??
              "Twilio must approve your regulatory bundle before you can buy the +27 mobile number."}
          </p>
          <p className="mt-2 text-sm text-amber-200/80">
            When approved: buy the mobile number → assign Gray Ox bundle → add{" "}
            <code className="text-amber-100">TWILIO_FROM_NUMBER</code> to .env.local
            → restart.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">4 · Call a dealership</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-400">
            {(status?.nextSteps ?? []).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Link
            href="/admin/prospector"
            className="mt-4 inline-block rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
          >
            Open Prospector →
          </Link>
        </section>
      </main>
    </div>
  );
}
