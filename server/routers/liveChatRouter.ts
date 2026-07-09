import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const liveChatRouter = router({
  // Placeholder procedures - services disabled
  getEscalations: protectedProcedure.query(async () => {
    return [];
  }),
  
  createEscalation: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      return { id: 1, message: input.message };
    }),
});
