"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getTwilioSetupState,
  saveTwilioCredentials,
  type SaveTwilioResult,
} from "./actions";

export function SetupForm() {
  const [result, setResult] = useState<SaveTwilioResult | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
    startTransition(async () => {
      const state = await getTwilioSetupState();
      setConnected(state.connected);
      if (state.connected) {
        setResult({
          ok: true,
          verifyOk: true,
          message: `Already connected to ${state.accountName}. Balance: ${state.balance}.`,
          accountName: state.accountName,
          balance: state.balance,
        });
      }
    });
  }, []);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await saveTwilioCredentials(formData);
      setResult(res);
      setConnected(res.verifyOk);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
        Saving to: <span className="font-mono text-zinc-200">{pageUrl || "…"}</span>
      </div>

      {connected || result?.verifyOk ? (
        <div
          className="rounded-xl border-2 border-emerald-500 bg-emerald-600 px-6 py-8 text-center"
          role="status"
        >
          <p className="text-3xl font-bold text-white">✅ CONNECTED</p>
          <p className="mt-3 text-lg text-emerald-50">{result?.message}</p>
          <p className="mt-4 text-sm text-emerald-100">
            Next: wait for Gray Ox bundle → buy +27 number → save again with phone
            number.
          </p>
        </div>
      ) : null}

      {result && !result.verifyOk ? (
        <div
          className="rounded-xl border-2 border-red-500 bg-red-950 px-6 py-6"
          role="alert"
        >
          <p className="text-xl font-bold text-red-200">❌ Not connected yet</p>
          <p className="mt-2 text-sm text-red-100">{result.message}</p>
          {result.accountSidPreview ? (
            <p className="mt-2 font-mono text-xs text-red-300">
              Server received SID {result.accountSidPreview} · token{" "}
              {result.tokenLength} chars
            </p>
          ) : null}
        </div>
      ) : null}

      {!connected ? (
        <form action={handleSubmit} className="rounded-xl border border-zinc-700 bg-zinc-950 p-6">
          <p className="mb-4 text-sm text-zinc-400">
            Twilio.com → Account Dashboard → copy these two values → paste below →
            click the big button.
          </p>

          <label className="mb-4 block">
            <span className="text-sm font-medium text-white">1. Account SID</span>
            <input
              name="accountSid"
              required
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-2 w-full rounded-lg border border-zinc-600 bg-black px-4 py-4 font-mono text-base text-white"
            />
          </label>

          <label className="mb-4 block">
            <span className="text-sm font-medium text-white">2. Auth Token</span>
            <input
              name="authToken"
              required
              placeholder="paste token from Twilio (click Show first)"
              className="mt-2 w-full rounded-lg border border-zinc-600 bg-black px-4 py-4 font-mono text-base text-white"
            />
          </label>

          <input type="hidden" name="webhookBaseUrl" value="https://grayarx.com" />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-500 py-5 text-xl font-bold text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Connecting to Twilio…" : "CONNECT TWILIO"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
