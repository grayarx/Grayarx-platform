import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { brandingService } from "../_core/brandingService";

export const brandingRouter = router({
  /**
   * Get current branding configuration (public)
   */
  getConfig: publicProcedure.query(() => {
    return brandingService.getConfig();
  }),

  /**
   * Get CSS variables for theming (public)
   */
  getCSSVariables: publicProcedure.query(() => {
    return brandingService.getCSSVariables();
  }),

  /**
   * Get dealership hours (public)
   */
  getHours: publicProcedure.query(() => {
    const config = brandingService.getConfig();
    return {
      hours: config.dealershipHours,
      isOpen: brandingService.isCurrentlyOpen(),
      hoursString: brandingService.getHoursString(),
    };
  }),

  /**
   * Check if dealership is currently open (public)
   */
  isOpen: publicProcedure.query(() => {
    return {
      isOpen: brandingService.isCurrentlyOpen(),
      timezone: brandingService.getConfig().timezone,
    };
  }),

  /**
   * Get meta tags for SEO (public)
   */
  getMetaTags: publicProcedure.query(() => {
    return brandingService.getMetaTags();
  }),

  /**
   * Update branding configuration (admin only)
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        dealershipName: z.string().optional(),
        dealershipPhone: z.string().optional(),
        dealershipEmail: z.string().email().optional(),
        dealershipAddress: z.string().optional(),
        dealershipWebsite: z.string().url().optional(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        textColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        fontFamily: z.string().optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        chatbotGreeting: z.string().optional(),
        chatbotTheme: z.enum(["light", "dark", "custom"]).optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      // Only allow admins to update branding
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const validation = brandingService.validateConfig(input);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      return brandingService.updateConfig(input);
    }),

  /**
   * Update dealership hours (admin only)
   */
  updateHours: protectedProcedure
    .input(
      z.object({
        monday: z.string().optional(),
        tuesday: z.string().optional(),
        wednesday: z.string().optional(),
        thursday: z.string().optional(),
        friday: z.string().optional(),
        saturday: z.string().optional(),
        sunday: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const currentConfig = brandingService.getConfig();
      return brandingService.updateConfig({
        dealershipHours: {
          ...currentConfig.dealershipHours,
          ...input,
        },
      });
    }),

  /**
   * Update social media links (admin only)
   */
  updateSocialMedia: protectedProcedure
    .input(
      z.object({
        facebook: z.string().url().optional(),
        instagram: z.string().url().optional(),
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        youtube: z.string().url().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const currentConfig = brandingService.getConfig();
      return brandingService.updateConfig({
        socialMedia: {
          ...currentConfig.socialMedia,
          ...input,
        },
      });
    }),

  /**
   * Update logo (admin only)
   */
  updateLogo: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        width: z.number().positive(),
        height: z.number().positive(),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      return brandingService.updateConfig({
        logo: input,
      });
    }),

  /**
   * Reset to default configuration (admin only)
   */
  resetToDefault: protectedProcedure.mutation(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return brandingService.resetToDefault();
  }),

  /**
   * Export branding configuration as JSON (admin only)
   */
  exportConfig: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return {
      config: brandingService.exportConfig(),
      timestamp: new Date(),
    };
  }),

  /**
   * Import branding configuration from JSON (admin only)
   */
  importConfig: protectedProcedure
    .input(z.object({ jsonString: z.string() }))
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const result = brandingService.importConfig(input.jsonString);
      if (!result.success) {
        throw new Error(result.error);
      }

      return brandingService.getConfig();
    }),

  /**
   * Get calibration metrics for lead scoring (admin only)
   */
  getCalibrationMetrics: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // This would be imported from leadScoringService
    return {
      message: "Calibration metrics available via insights.getLeadMetrics",
    };
  }),
});
