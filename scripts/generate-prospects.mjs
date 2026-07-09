#!/usr/bin/env node

/**
 * Generate 50 dealership prospects using Sipho prospector agent.
 * Runs 5 scout calls across different SA regions (10 prospects each).
 */

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from "../server/routers.ts";

const SA_REGIONS = [
  { region: "Gauteng", city: "Johannesburg" },
  { region: "Gauteng", city: "Pretoria" },
  { region: "Western Cape", city: "Cape Town" },
  { region: "KwaZulu-Natal", city: "Durban" },
  { region: "Limpopo", city: "Polokwane" },
];

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      headers: async () => {
        // Note: This script runs server-side, so we need to mock auth
        // In production, use a service account token
        return {
          "content-type": "application/json",
        };
      },
    }),
  ],
});

async function generateProspects() {
  console.log("🚀 Starting Sipho prospector to generate 50 dealership leads...\n");

  let totalCreated = 0;

  for (const { region, city } of SA_REGIONS) {
    try {
      console.log(`📍 Scouting ${region} (${city})...`);

      const result = await trpc.prospects.scout.mutate({
        region,
        city,
        count: 10, // 10 prospects per region
      });

      console.log(`   ✅ Created ${result.created} prospects\n`);
      totalCreated += result.created;
    } catch (error) {
      console.error(`   ❌ Error scouting ${region}:`, error);
    }
  }

  console.log(`\n✨ Prospect generation complete!`);
  console.log(`   Total prospects created: ${totalCreated}`);
  console.log(`   Next: Review prospects at /admin/prospects`);
}

generateProspects().catch(console.error);
