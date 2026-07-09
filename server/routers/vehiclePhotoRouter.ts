import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const vehiclePhotoRouter = router({
  // Placeholder procedures - services disabled
  getPhotos: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async () => {
      return [];
    }),
  
  uploadPhoto: protectedProcedure
    .input(z.object({ vehicleId: z.number(), fileName: z.string() }))
    .mutation(async ({ input }) => {
      return { id: 1, fileName: input.fileName };
    }),
});
