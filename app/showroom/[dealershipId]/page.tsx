import Link from "next/link";
import { listAvailable, formatVehicleLine } from "@/lib/conversion/stock";
import { getDealershipSettings } from "@/lib/dealership/settings";
import { listParts } from "@/lib/os/parts";
import { ensureBranches, getBranch } from "@/lib/branches/store";
import { seedMultiBranchStock } from "@/lib/marketplace/ingest";

type Props = {
  params: Promise<{ dealershipId: string }>;
};

export default async function ShowroomPage({ params }: Props) {
  const { dealershipId } = await params;
  ensureBranches();
  seedMultiBranchStock();
  const settings = getDealershipSettings(dealershipId);
  const branch = getBranch(dealershipId);
  const vehicles = listAvailable(dealershipId);
  const parts = settings.modules.parts ? listParts(dealershipId).slice(0, 8) : [];

  return (
    <div className="min-h-screen bg-[#0b1210] text-zinc-100">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          GrayArx showroom
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {settings.name || branch?.name || dealershipId}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          Live stock powered by GrayArx. Ask Nala on WhatsApp about any car
          {settings.modules.parts ? ", part," : ""}
          {settings.modules.service ? " or service booking" : ""}.
        </p>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Vehicles for sale
          </h2>
          <ul className="mt-4 divide-y divide-zinc-800 border-t border-zinc-800">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-4"
              >
                <div>
                  <p className="text-lg text-white">{formatVehicleLine(v)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Stock {v.stockNumber} · {v.mileage.toLocaleString("en-ZA")} km ·{" "}
                    {v.colour}
                  </p>
                </div>
                <p className="text-emerald-400">
                  R{v.price.toLocaleString("en-ZA")}
                </p>
              </li>
            ))}
            {vehicles.length === 0 ? (
              <li className="py-6 text-sm text-zinc-500">No vehicles listed.</li>
            ) : null}
          </ul>
        </section>

        {settings.modules.parts ? (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Parts counter (WhatsApp)
            </h2>
            <p className="mt-2 text-xs text-zinc-500">
              Prices from this yard&apos;s catalog import — not invented by GrayArx.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {parts.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>
                    {p.name}{" "}
                    <span className="text-zinc-600">
                      · {p.sku}
                      {p.oemNumber ? ` · OEM ${p.oemNumber}` : ""}
                    </span>
                  </span>
                  <span className="text-emerald-400">
                    R{p.retailPrice.toLocaleString("en-ZA")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="mt-10 text-sm text-zinc-500">
            This yard has parts WhatsApp turned off — sales
            {settings.modules.service ? " and service" : ""} only.
          </p>
        )}

        <p className="mt-12 text-xs text-zinc-600">
          Dealer desk:{" "}
          <Link href="/admin/os" className="text-emerald-500 underline">
            OS command center
          </Link>
        </p>
      </main>
    </div>
  );
}
