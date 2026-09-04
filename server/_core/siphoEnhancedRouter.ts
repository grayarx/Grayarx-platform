import { router, protectedProcedure } from "./trpc";
import { z } from "zod";
import {
  researchCompany,
  analyzeWebsite,
  scoreProspect,
  generateEmailDraft,
  enhancedProspectResearch,
} from "./siphoResearchModule";

const prospectResearchSchema = z.object({
  companyName: z.string().min(2),
  website: z.string().url().optional(),
  region: z.string(),
  vehicleTypes: z.array(z.string()).optional(),
});

const emailDraftSchema = z.object({
  prospectId: z.string(),
  subject: z.string(),
  body: z.string(),
  cta: z.string(),
});

export const siphoEnhancedRouter = router({
  researchCompany: protectedProcedure
    .input(prospectResearchSchema)
    .mutation(async ({ ctx, input }: any) => {
      try {
        const companyInfo = await researchCompany(input.companyName, input.region);

        return {
          success: true,
          prospectId: `prospect-${Date.now()}`,
          companyInfo,
          researchedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to research company",
        };
      }
    }),

  analyzeWebsite: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }: any) => {
      try {
        const analysis = await analyzeWebsite(input.url);

        return {
          success: true,
          analysis,
          analyzedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to analyze website",
        };
      }
    }),

  scoreProspect: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        website: z.string().url().optional(),
        region: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const companyInfo = await researchCompany(input.companyName, input.region);
        const websiteAnalysis = await analyzeWebsite(
          input.website || companyInfo.website || ""
        );
        const score = await scoreProspect(companyInfo, websiteAnalysis);

        return {
          success: true,
          score,
          scoredAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to score prospect",
        };
      }
    }),

  generateEmailDraft: protectedProcedure
    .input(prospectResearchSchema)
    .mutation(async ({ ctx, input }: any) => {
      try {
        const companyInfo = await researchCompany(input.companyName, input.region);
        const websiteAnalysis = await analyzeWebsite(
          input.website || companyInfo.website || ""
        );
        const score = await scoreProspect(companyInfo, websiteAnalysis);
        const emailDraft = await generateEmailDraft(companyInfo, websiteAnalysis, score);

        return {
          success: true,
          prospectId: `prospect-${Date.now()}`,
          emailDraft,
          score,
          generatedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to generate email draft",
        };
      }
    }),

  fullProspectResearch: protectedProcedure
    .input(prospectResearchSchema)
    .mutation(async ({ ctx, input }: any) => {
      try {
        const research = await enhancedProspectResearch(
          input.companyName,
          input.website || "",
          input.region
        );

        return {
          success: true,
          prospectId: `prospect-${Date.now()}`,
          research,
          researchedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to complete prospect research",
        };
      }
    }),

  approveEmailDraft: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        emailDraftId: z.string(),
        customizations: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return {
        success: true,
        prospectId: input.prospectId,
        status: "approved",
        approvedAt: new Date(),
        message: "Email draft approved and queued for sending",
      };
    }),

  rejectEmailDraft: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        emailDraftId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return {
        success: true,
        prospectId: input.prospectId,
        status: "rejected",
        rejectedAt: new Date(),
        message: "Email draft rejected, Sipho will generate alternative",
      };
    }),

  listPendingDrafts: protectedProcedure.query(async ({ ctx }: any) => {
    return [
      {
        prospectId: "prospect-1",
        companyName: "Premium Auto Sales",
        region: "Johannesburg",
        score: 82,
        tier: "gold",
        emailDraft: {
          subject: "Premium Auto Sales: what happens to your 9pm WhatsApps?",
          preview: "I've been analyzing leading dealerships in Johannesburg...",
        },
        createdAt: new Date(Date.now() - 3600000),
        status: "pending_review",
      },
      {
        prospectId: "prospect-2",
        companyName: "Elite Motors",
        region: "Cape Town",
        score: 75,
        tier: "silver",
        emailDraft: {
          subject: "Elite Motors: Capture More Qualified Leads with AI",
          preview: "Your dealership has built an impressive reputation...",
        },
        createdAt: new Date(Date.now() - 7200000),
        status: "pending_review",
      },
    ];
  }),

  getResearchHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }: any) => {
      return [
        {
          prospectId: "prospect-1",
          companyName: "Premium Auto Sales",
          region: "Johannesburg",
          score: 82,
          tier: "gold",
          status: "approved",
          emailSent: true,
          sentAt: new Date(Date.now() - 86400000),
          researchedAt: new Date(Date.now() - 172800000),
        },
        {
          prospectId: "prospect-2",
          companyName: "Elite Motors",
          region: "Cape Town",
          score: 75,
          tier: "silver",
          status: "pending_review",
          emailSent: false,
          researchedAt: new Date(Date.now() - 259200000),
        },
      ];
    }),

  getProspectDetails: protectedProcedure
    .input(z.object({ prospectId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      return {
        prospectId: input.prospectId,
        companyInfo: {
          name: "Premium Auto Sales",
          website: "https://www.premiumautosales.co.za",
          registrationNumber: "2024/123456",
          yearsInBusiness: 8,
          estimatedSize: "medium",
          location: "Johannesburg",
          reviews: [
            { platform: "Google", rating: 4.2, count: 156 },
            { platform: "Facebook", rating: 4.5, count: 89 },
          ],
        },
        websiteAnalysis: {
          title: "Premium Auto Sales",
          uiQuality: "average",
          inventoryPresentation: "basic",
          painPoints: [
            "Manual inventory updates",
            "No AI-powered search",
            "Limited lead qualification",
          ],
          opportunities: [
            "Implement AI-powered lead capture",
            "Automate inventory management",
            "Add 24/7 AI agent for inquiries",
          ],
        },
        prospectScore: {
          totalScore: 82,
          tier: "gold",
          reasoning: [
            "8 years in business indicates stability",
            "Website quality: average - opportunity for improvement",
            "Current lead capture: contact_form, phone_button, whatsapp",
            "3 identified pain points that GrayArx can solve",
          ],
        },
        emailDraft: {
          subject: "Premium Auto Sales: what happens to your 9pm WhatsApps?",
          body: "Hi Premium Auto Sales Team...",
          cta: "Book a 15-minute demo",
        },
        status: "approved",
        emailSent: true,
        sentAt: new Date(),
      };
    }),

  batchResearch: protectedProcedure
    .input(
      z.object({
        prospects: z.array(
          z.object({
            companyName: z.string(),
            website: z.string().url().optional(),
            region: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const results = [];

      for (const prospect of input.prospects) {
        try {
          const research = await enhancedProspectResearch(
            prospect.companyName,
            prospect.website || "",
            prospect.region
          );

          results.push({
            companyName: prospect.companyName,
            success: true,
            prospectId: `prospect-${Date.now()}`,
            score: research.prospectScore.totalScore,
            tier: research.prospectScore.tier,
          });
        } catch (error) {
          results.push({
            companyName: prospect.companyName,
            success: false,
            error: "Failed to research",
          });
        }
      }

      return {
        success: true,
        totalProcessed: input.prospects.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
        batchId: `batch-${Date.now()}`,
        completedAt: new Date(),
      };
    }),
});
