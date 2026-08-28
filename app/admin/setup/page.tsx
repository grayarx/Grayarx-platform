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
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
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
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("https://grayarx.com");
  const [fromNumber, setFromNumber] = useState("");
  const [status, setStatus] = useState<SetupPayload | null>(null);
  const [verify, setVerify] = useState<VerifyPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/setup/status");
    setStatus((await response.json()) as SetupPayload);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sidOk = accountSid.trim().startsWith("AC");
  const tokenOk = authToken.trim().length > 0;

  async function saveAndTest(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setVerify(null);
    setSaved(false);

    const sid = accountSid.trim();
    const token = authToken.trim();
    const webhook = webhookBaseUrl.trim() || "https://grayarx.com";

    if (!sid) {
      setError("Paste your Account SID first (starts with AC).");
      return;
    }
    if (!sid.startsWith("AC")) {
      setError(
        "That doesn't look like an Account SID. On Twilio home, copy Account SID — it starts with AC. (Not API Key SID — that starts with SK.)",
      );
      return;
    }
    if (!token) {
      setError("Paste your Auth Token first (Twilio home → Show).");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/setup/save-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: sid,
          authToken: token,
          webhookBaseUrl: webhook,
          fromNumber: fromNumber.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        verify?: VerifyPayload;
        saved?: boolean;
        status?: SetupPayload;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not save credentials.");
        return;
      }

      setSaved(true);
      setVerify(data.verify ?? null);
      if (data.status) setStatus(data.status);
      await refresh();
    } catch {
      setError("Network error — refresh the page and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            Paste your Twilio keys here
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Twilio setup for Themba
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Twilio Console → Account Dashboard → copy{" "}
            <strong className="text-white">Account SID</strong> (AC…) and{" "}
            <strong className="text-white">Auth Token</strong>.
          </p>
        </header>

        <form
          onSubmit={saveAndTest}
          className="rounded-xl border-2 border-emerald-600 bg-zinc-950 p-5"
        >
          <h2 className="text-lg font-semibold text-white">
            Paste your Twilio credentials
          </h2>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Account SID (must start with AC)
              </span>
              <input
                type="text"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="mt-1.5 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-3 font-mono text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                autoComplete="off"
              />
              {accountSid.trim() && !sidOk ? (
                <p className="mt-1 text-xs text-amber-300">
                  Must start with AC — you may have copied the wrong field.
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Auth Token
              </span>
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="paste auth token here"
                className="mt-1.5 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-3 font-mono text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Webhook URL
              </span>
              <input
                type="text"
                value={webhookBaseUrl}
                onChange={(e) => setWebhookBaseUrl(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-3 font-mono text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Phone number (optional for now)
              </span>
              <input
                type="text"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
                placeholder="+2760xxxxxxx — after Gray Ox approved"
                className="mt-1.5 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-3 font-mono text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 w-full cursor-pointer rounded-lg border-2 border-white bg-emerald-500 px-4 py-4 text-lg font-bold text-white shadow-lg hover:bg-emerald-400"
            style={{ color: "#ffffff", backgroundColor: "#10b981" }}
          >
            {loading ? "Saving & testing…" : "SAVE & TEST CONNECTION"}
          </button>

          <p className="mt-2 text-center text-xs text-zinc-500">
            {sidOk && tokenOk
              ? "Ready — click the green button above."
              : !sidOk
                ? "Waiting for Account SID (starts with AC)…"
                : "Waiting for Auth Token…"}
          </p>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          {saved && verify?.ok ? (
            <p className="mt-3 rounded-lg bg-emerald-950/50 p-3 text-sm text-emerald-200">
              ✅ Connected to {verify.accountName}. Balance: {verify.balance}.
              Keys saved.
            </p>
          ) : null}
          {saved && verify && !verify.ok ? (
            <p className="mt-3 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">
              Keys saved but Twilio rejected them: {verify.error}. Double-check
              SID and Token on Twilio home page.
            </p>
          ) : null}
        </form>

        <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">Checklist</h2>
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
                label={`Phone number${status.twilio.fromNumber ? `: ${status.twilio.fromNumber}` : " — waiting for Gray Ox bundle"}`}
              />
            </ul>
          ) : null}
        </section>

        <Link
          href="/admin/prospector"
          className="mt-6 inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Open Prospector →
        </Link>
      </main>
    </div>
  );
}
