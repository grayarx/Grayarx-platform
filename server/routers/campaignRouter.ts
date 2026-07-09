import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const campaignRouter = router({
  // Placeholder procedures - services disabled
  getAll: protectedProcedure.query(async () => {
    return [];
  }),
  
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return { id: 1, name: input.name };
    }),
});
