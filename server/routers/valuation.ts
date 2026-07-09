/**
 * Live Vehicle Valuation Router
 * 
 * Provides tRPC procedures for:
 * - Looking up current market prices for any vehicle
 * - Calculating realistic trade-in offers
 * - Getting market valuations
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  calculateTradeInOffer,
  getMarketValuation,
  searchMarketPrices,
} from "../_core/liveMarketValuation";

export const valuationRouter = router({
  /**
   * Get current market value for a vehicle.
   * Shows what the car is worth on the market right now.
   */
  getMarketValue: publicProcedure
    .input(
      z.object({
        make: z.string().min(1, "Make is required"),
        model: z.string().min(1, "Model is required"),
        year: z.number().int().min(1990).max(new Date().getFullYear()),
        variant: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await getMarketValuation({
        make: input.make,
        model: input.model,
        year: input.year,
        variant: input.variant,
      });
    }),

  /**
   * Calculate realistic trade-in offer.
   * Shows both market value and what dealership will realistically offer.
   */
  getTradeInOffer: publicProcedure
    .input(
      z.object({
        make: z.string().min(1, "Make is required"),
        model: z.string().min(1, "Model is required"),
        year: z.number().int().min(1990).max(new Date().getFullYear()),
        variant: z.string().optional(),
        mileageKm: z.number().int().min(0).max(500_000),
        condition: z.enum(["excellent", "good", "fair", "poor"]),
        serviceHistory: z.enum(["full_dealer", "full_independent", "partial", "none"]),
        transmission: z.enum(["manual", "automatic", "cvt", "dct"]).default("automatic"),
        fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]).default("petrol"),
      }),
    )
    .query(async ({ input }) => {
      return await calculateTradeInOffer(
        {
          make: input.make,
          model: input.model,
          year: input.year,
          variant: input.variant,
        },
        input.mileageKm,
        input.condition,
        input.serviceHistory,
        input.transmission,
        input.fuel,
      );
    }),

  /**
   * Search for current market prices.
   * Returns raw market data (low, mid, high prices, number of listings).
   */
  searchMarketPrices: publicProcedure
    .input(
      z.object({
        make: z.string().min(1, "Make is required"),
        model: z.string().min(1, "Model is required"),
        year: z.number().int().min(1990).max(new Date().getFullYear()),
        variant: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await searchMarketPrices({
        make: input.make,
        model: input.model,
        year: input.year,
        variant: input.variant,
      });
    }),
});
