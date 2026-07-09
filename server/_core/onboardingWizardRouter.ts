import { router, protectedProcedure, publicProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { onboardingSubmissions, vehicles, users, dealerships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./notification";
import { onboardingDrafts } from "../../drizzle/schema";
import { schedulePostSignupEmails } from "./postSignupEmailService";

/**
 * Parse CSV vehicle data
 */
function parseVehicleCSV(
  csvContent: string
): Array<{
  make: string;
  model: string;
  year: number;
  price: number;
}> {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const parsed = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const [make, model, year, price] = lines[i].split(",").map((s) => s.trim());

    if (!make || !model || !year || !price) continue;

    const yearNum = parseInt(year);
    const priceNum = parseFloat(price);

    if (isNaN(yearNum) || isNaN(priceNum)) continue;

    parsed.push({
      make,
      model,
      year: yearNum,
      price: priceNum,
    });
  }

  return parsed;
}

/**
 * Validate dealership info
 */
function validateDealershipInfo(input: {
  dealershipName: string;
  ownerName: string;
  email: string;
  phone: string;
  vehicleTypes: string[];
  estimatedMonthlyLeads: number;
  languages: string[];
}): { valid: boolean; errors: string[] } {
  const errors = [];

  if (!input.dealershipName || input.dealershipName.length < 2) {
    errors.push("Dealership name must be at least 2 characters");
  }

  if (!input.ownerName || input.ownerName.length < 2) {
    errors.push("Owner name must be at least 2 characters");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    errors.push("Invalid email address");
  }

  const phoneRegex = /^(\+27|0)[0-9]{9}$/;
  const cleanPhone = input.phone.replace(/\s/g, "").replace(/[()]/g, "");
  if (!phoneRegex.test(cleanPhone)) {
    errors.push("Invalid South African phone number");
  }

  if (!input.vehicleTypes || input.vehicleTypes.length === 0) {
    errors.push("At least one vehicle type is required");
  }

  if (input.estimatedMonthlyLeads < 1) {
    errors.push("Estimated monthly leads must be at least 1");
  }

  if (!input.languages || input.languages.length === 0) {
    errors.push("At least one language is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const onboardingWizardRouter = router({
  /**
   * Step 1: Submit dealership info
   */
  submitDealershipInfo: publicProcedure
    .input(
      z.object({
        dealershipName: z.string().min(2),
        ownerName: z.string().min(2),
        email: z.string().email(),
        phone: z.string(),
        vehicleTypes: z.array(z.string()).min(1),
        estimatedMonthlyLeads: z.number().int().positive(),
        languages: z.array(z.string()).min(1),
        region: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const validation = validateDealershipInfo(input);

      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.errors.join("; "),
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      try {
        const result = await db.insert(onboardingSubmissions).values({
          dealershipName: input.dealershipName,
          ownerName: input.ownerName,
          ownerEmail: input.email,
          ownerPhone: input.phone,
          region: input.region || null,
          monthlyVolume: input.estimatedMonthlyLeads,
          vehicleTypes: input.vehicleTypes,
          languages: input.languages,
          notes: input.notes || null,
          status: "new",
        });

        // Get the inserted ID
        const submissionId = (result as any)?.[0]?.insertId || 0;

        // Note: Post-signup emails will be scheduled after dealership is provisioned
        // by the founder via the admin panel

        return {
          success: true,
          submissionId: submissionId.toString(),
          message: "Dealership info submitted successfully",
        };
      } catch (error) {
        console.error("[Onboarding] Error submitting dealership info:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit dealership info",
        });
      }
    }),

  /**
   * Step 2: Validate and preview vehicle CSV
   */
  validateVehicleCSV: publicProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .query(({ input }) => {
      try {
        const vehicleList = parseVehicleCSV(input.csvContent);

        if (vehicleList.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No valid vehicles found in CSV",
          });
        }

        // Validate each vehicle
        const validated = vehicleList.map((v) => {
          const errors = [];

          if (v.year < 1990 || v.year > new Date().getFullYear() + 1) {
            errors.push(`Invalid year: ${v.year}`);
          }

          if (v.price < 0 || v.price > 10000000) {
            errors.push(`Invalid price: ${v.price}`);
          }

          return {
            ...v,
            status: errors.length === 0 ? "valid" : "error",
            error: errors.join("; "),
          };
        });

        const validCount = validated.filter((v) => v.status === "valid").length;
        const errorCount = validated.filter((v) => v.status === "error").length;

        return {
          success: true,
          preview: validated,
          summary: {
            total: vehicleList.length,
            valid: validCount,
            errors: errorCount,
          },
        };
      } catch (error) {
        console.error("[Onboarding] Error validating CSV:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to parse CSV",
        });
      }
    }),

  /**
   * Step 2: Import vehicles
   */
  importVehicles: publicProcedure
    .input(
      z.object({
        submissionId: z.string(),
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      try {
        const submissionIdNum = parseInt(input.submissionId);

        // Get submission
        const submission = await db
          .select()
          .from(onboardingSubmissions)
          .where(eq(onboardingSubmissions.id, submissionIdNum));

        if (!submission || submission.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        // Parse and validate vehicles
        const vehicleList = parseVehicleCSV(input.csvContent);
        const validVehicles = vehicleList.filter((v) => {
          return v.year >= 1990 && v.year <= new Date().getFullYear() + 1 && v.price >= 0 && v.price <= 10000000;
        });

        if (validVehicles.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No valid vehicles to import",
          });
        }

        // Insert vehicles (use submission ID as dealership reference for now)
        for (const vehicle of validVehicles) {
          await db.insert(vehicles).values({
            title: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price.toString(),
            status: "available",
          });
        }

        return {
          success: true,
          importedCount: validVehicles.length,
          message: `Imported ${validVehicles.length} vehicles`,
        };
      } catch (error) {
        console.error("[Onboarding] Error importing vehicles:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import vehicles",
        });
      }
    }),

  /**
   * Step 3: Add team members
   */
  addTeamMembers: publicProcedure
    .input(
      z.object({
        submissionId: z.string(),
        teamMembers: z.array(
          z.object({
            name: z.string().min(2),
            email: z.string().email(),
            role: z.enum(["owner", "manager", "consultant"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      try {
        const submissionIdNum = parseInt(input.submissionId);

        // Get submission
        const submission = await db
          .select()
          .from(onboardingSubmissions)
          .where(eq(onboardingSubmissions.id, submissionIdNum));

        if (!submission || submission.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        const teamResults = [];

        // Create user records for team members (mock - would send invites in production)
        for (const member of input.teamMembers) {
          try {
            // In production, would send email invite
            // For now, just track that we processed it
            teamResults.push({
              email: member.email,
              status: "invited",
            });
          } catch (error) {
            teamResults.push({
              email: member.email,
              status: "failed",
            });
          }
        }

        // Notify owner that onboarding is complete
        await notifyOwner({
          title: "New Dealership Onboarding Completed",
          content: `${submission[0].dealershipName} has completed the 3-step onboarding wizard. Ready for activation.`,
        });

        return {
          success: true,
          teamResults,
          message: "Team members added successfully",
        };
      } catch (error) {
        console.error("[Onboarding] Error adding team members:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add team members",
        });
      }
    }),

  /**
   * Get onboarding progress
   */
  getProgress: publicProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      try {
        const submissionIdNum = parseInt(input.submissionId);

        const submission = await db
          .select()
          .from(onboardingSubmissions)
          .where(eq(onboardingSubmissions.id, submissionIdNum));

        if (!submission || submission.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        const sub = submission[0];

        return {
          submissionId: input.submissionId,
          dealershipName: sub.dealershipName,
          status: sub.status,
          step1: {
            completed: true,
            dealershipName: sub.dealershipName,
            ownerName: sub.ownerName,
            email: sub.ownerEmail,
            phone: sub.ownerPhone,
          },
          step2: {
            completed: !!sub.csvUrl,
            vehicleCount: 0, // Would query vehicles table in production
          },
          step3: {
            completed: sub.status === "approved" || sub.status === "provisioned",
            teamCount: 0, // Would query users table in production
          },
        };
      } catch (error) {
        console.error("[Onboarding] Error getting progress:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get progress",
        });
      }
    }),

  /**
   * Save draft - Create or update a draft
   */
  saveDraft: publicProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        step: z.number().min(1).max(3),
        dealershipInfo: z
          .object({
            dealershipName: z.string(),
            ownerName: z.string(),
            email: z.string(),
            phone: z.string(),
            address: z.string().optional(),
            city: z.string().optional(),
            province: z.string().optional(),
            vehicleTypes: z.array(z.string()).optional(),
            estimatedMonthlyLeads: z.number().optional(),
            languages: z.array(z.string()).optional(),
          })
          .optional(),
        vehicleData: z.string().optional(),
        teamMembers: z
          .array(
            z.object({
              name: z.string(),
              email: z.string(),
              role: z.enum(["owner", "manager", "consultant"]),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        const sessionId =
          input.sessionId ||
          `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const now = new Date();

        // Check if draft exists
        const db2 = await getDb();
        if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB error" });
        const existing = await db2
          .select()
          .from(onboardingDrafts)
          .where(eq(onboardingDrafts.sessionId, sessionId))
          .limit(1);

        if (existing.length > 0) {
          // Update existing draft
          await db2
            .update(onboardingDrafts)
            .set({
              step: input.step,
              dealershipInfo: input.dealershipInfo
                ? JSON.stringify(input.dealershipInfo)
                : undefined,
              vehicleData: input.vehicleData
                ? JSON.stringify({ csv: input.vehicleData })
                : undefined,
              teamMembers: input.teamMembers
                ? JSON.stringify(input.teamMembers)
                : undefined,
              lastSavedAt: now,
              expiresAt,
            })
            .where(eq(onboardingDrafts.sessionId, sessionId));
        } else {
          // Create new draft
          await db2.insert(onboardingDrafts).values({
            sessionId,
            step: input.step,
            dealershipInfo: input.dealershipInfo
              ? JSON.stringify(input.dealershipInfo)
              : null,
            vehicleData: input.vehicleData
              ? JSON.stringify({ csv: input.vehicleData })
              : null,
            teamMembers: input.teamMembers
              ? JSON.stringify(input.teamMembers)
              : null,
            lastSavedAt: now,
            expiresAt,
            createdAt: now,
          });
        }

        return {
          success: true,
          sessionId,
          savedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        };
      } catch (error) {
        console.error("[Onboarding] Error saving draft:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save draft",
        });
      }
    }),

  /**
   * Load draft - Retrieve saved draft
   */
  loadDraft: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB error" });
        const draft = await db
          .select()
          .from(onboardingDrafts)
          .where(eq(onboardingDrafts.sessionId, input.sessionId))
          .limit(1);

        if (draft.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Draft not found",
          });
        }

        const d = draft[0];
        const now = new Date();

        // Check if draft has expired
        if (d.expiresAt && new Date(d.expiresAt) < now) {
          // Delete expired draft
          await db
            .delete(onboardingDrafts)
            .where(eq(onboardingDrafts.sessionId, input.sessionId));

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Draft has expired",
          });
        }

        return {
          sessionId: d.sessionId,
          step: d.step,
          dealershipInfo: d.dealershipInfo
            ? JSON.parse(d.dealershipInfo as string)
            : null,
          vehicleData: d.vehicleData
            ? JSON.parse(d.vehicleData as string).csv
            : null,
          teamMembers: d.teamMembers
            ? JSON.parse(d.teamMembers as string)
            : null,
          lastSavedAt: d.lastSavedAt?.toISOString(),
          expiresAt: d.expiresAt?.toISOString(),
        };
      } catch (error) {
        console.error("[Onboarding] Error loading draft:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load draft",
        });
      }
    }),

  /**
   * Approve dealership and trigger post-signup email sequence
   * Called by founder/admin after reviewing dealership application
   */
  approveDealership: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Add founder/admin role check
        // if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Verify dealership exists
        const dealershipRecords = await db
          .select()
          .from(dealerships)
          .where(eq(dealerships.id, input.dealershipId));

        if (dealershipRecords.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dealership not found",
          });
        }

        // Schedule post-signup emails
        await schedulePostSignupEmails(input.dealershipId);

        // Notify owner
        await notifyOwner({
          title: "Dealership Approved",
          content: `Dealership ${dealershipRecords[0].name} (ID: ${input.dealershipId}) has been approved. Post-signup email sequence initiated.`,
        });

        return {
          success: true,
          message: "Dealership approved and post-signup emails scheduled",
          dealershipId: input.dealershipId,
        };
      } catch (error) {
        console.error("[Onboarding] Error approving dealership:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve dealership",
        });
      }
    }),

  /**
   * Delete draft - Remove saved draft
   */
  deleteDraft: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB error" });
        await db
          .delete(onboardingDrafts)
          .where(eq(onboardingDrafts.sessionId, input.sessionId));

        return {
          success: true,
          message: "Draft deleted successfully",
        };
      } catch (error) {
        console.error("[Onboarding] Error deleting draft:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete draft",
        });
      }
    }),
});
