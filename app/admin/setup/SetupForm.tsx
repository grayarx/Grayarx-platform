"use client";

import { useEffect, useState } from "react";

type Result = {
  type: "success" | "error" | "info";
  title: string;
  detail: string;
};

export function SetupForm() {
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
    fetch("/api/setup/ping")
      .then((r) => r.json())
      .then((d: { alive?: boolean; message?: string }) => {
        setServerOk(Boolean(d.alive));
        if (d.alive) {
          setResult({
            type: "info",
            title: "Server is online",
            detail: d.message ?? "Ready for your Twilio keys.",
          });
        }
      })
      .catch(() => {
        setServerOk(false);
        setResult({
          type: "error",
          title: "Wrong page or server offline",
          detail:
            "This page is not connected to the GrayArx server. Use the Preview link from your Cursor agent — not grayarx.com.",
        });
      });

    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((d: { verify?: { ok: boolean; accountName?: string; balance?: string; error?: string } }) => {
        if (d.verify?.ok) {
          setResult({
            type: "success",
            title: "Already connected",
            detail: `${d.verify.accountName} — balance ${d.verify.balance}`,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  async function connect() {
    setLoading(true);
    setResult({ type: "info", title: "Connecting…", detail: "Talking to Twilio now." });

    try {
      const response = await fetch("/api/setup/save-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid,
          authToken,
          webhookBaseUrl: "https://grayarx.com",
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        verify?: { ok: boolean; accountName?: string; balance?: string; error?: string };
        debug?: { accountSidPreview?: string; tokenLength?: number };
      };

      if (!response.ok) {
        setResult({
          type: "error",
          title: "Could not save",
          detail: data.error ?? `Server error ${response.status}`,
        });
        return;
      }

      if (data.verify?.ok) {
        setResult({
          type: "success",
          title: "CONNECTED TO TWILIO",
          detail: `${data.verify.accountName} — balance ${data.verify.balance}. Keys saved. Waiting on Gray Ox bundle for phone number.`,
        });
        return;
      }

      setResult({
        type: "error",
        title: "Saved but Twilio rejected login",
        detail:
          data.verify?.error ??
          "Wrong SID or Token — copy both again from Twilio home page.",
      });
    } catch {
      setResult({
        type: "error",
        title: "Network failed",
        detail: "Browser could not reach the server. Use the Cursor Preview link.",
      });
    } finally {
      setLoading(false);
    }
  }

  const resultBox =
    result?.type === "success"
      ? "border-emerald-500 bg-emerald-600"
      : result?.type === "error"
        ? "border-red-500 bg-red-900"
        : "border-zinc-600 bg-zinc-800";

  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-400">
        Server: {serverOk === true ? "🟢 online" : serverOk === false ? "🔴 offline" : "…"} ·{" "}
        {pageUrl || "loading"}
      </p>

      {result ? (
        <div className={`rounded-xl border-2 px-5 py-6 ${resultBox}`}>
          <p className="text-xl font-bold text-white">{result.title}</p>
          <p className="mt-2 text-sm text-white/90">{result.detail}</p>
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-950 p-5">
        <label className="block">
          <span className="text-sm font-medium text-white">Account SID (starts with AC)</span>
          <input
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-600 bg-black px-4 py-3 font-mono text-white"
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-white">Auth Token</span>
          <input
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-600 bg-black px-4 py-3 font-mono text-white"
            placeholder="paste from Twilio — click Show first"
          />
        </label>

        <button
          type="button"
          onClick={connect}
          disabled={loading}
          className="w-full rounded-xl py-5 text-xl font-bold text-black"
          style={{ backgroundColor: loading ? "#6ee7b7" : "#10b981" }}
        >
          {loading ? "CONNECTING…" : "CONNECT TWILIO"}
        </button>
      </div>
    </div>
  );
}
