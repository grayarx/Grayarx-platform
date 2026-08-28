import Link from "next/link";
import { SetupForm } from "./SetupForm";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold text-white">Connect Twilio</h1>
        <p className="mt-2 text-zinc-400">
          Paste two values from Twilio. One button. Done.
        </p>

        <div className="mt-8">
          <SetupForm />
        </div>

        <Link
          href="/admin/prospector"
          className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300"
        >
          → Prospector (after connected)
        </Link>
      </main>
    </div>
  );
}
