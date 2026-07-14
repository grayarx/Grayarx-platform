import { router, protectedProcedure } from "./trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { hashPassword } from "./passwordHashing";
import { randomBytes } from "crypto";

const teamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["dealer_owner", "dealer_consultant"]),
  name: z.string().min(1).max(120).optional(),
});

function mapUiRole(role: "admin" | "manager" | "salesperson" | "dealer_owner" | "dealer_consultant") {
  if (role === "admin" || role === "manager" || role === "dealer_owner") return "dealer_owner" as const;
  return "dealer_consultant" as const;
}

function assertCanManageTeam(user: { role: string; dealershipId: number | null }) {
  const allowed = ["founder", "admin", "dealer_owner"];
  if (!allowed.includes(user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can manage team members" });
  }
  if (user.role !== "founder" && user.role !== "admin" && !user.dealershipId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No dealership assigned" });
  }
}

/**
 * Minimal working staff invite / create-user for a dealership.
 * Creates a real users row with a temporary password the inviter can share.
 * Email delivery is best-effort (logs if Resend not configured).
 */
export const teamMembersRouter = router({
  inviteTeamMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(120).optional(),
        role: z.enum(["admin", "manager", "salesperson", "dealer_owner", "dealer_consultant"]),
        dealershipId: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertCanManageTeam(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const dealershipId =
        ctx.user.role === "founder" || ctx.user.role === "admin"
          ? input.dealershipId ?? ctx.user.dealershipId
          : ctx.user.dealershipId;

      if (!dealershipId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "dealershipId is required (founders: pass dealershipId)",
        });
      }

      const role = mapUiRole(input.role);
      const email = input.email.trim().toLowerCase();
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) {
        if (existing.dealershipId && existing.dealershipId !== dealershipId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That email is already linked to another dealership",
          });
        }
        await db
          .update(users)
          .set({
            dealershipId,
            role,
            name: input.name?.trim() || existing.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id));
        return {
          success: true,
          email,
          role,
          userId: existing.id,
          invitationSent: false,
          temporaryPassword: null as string | null,
          message: "Existing user linked to this dealership",
        };
      }

      const temporaryPassword = randomBytes(5).toString("base64url").slice(0, 10);
      const passwordHash = await hashPassword(temporaryPassword);
      const openId = `team_${dealershipId}_${Date.now()}_${randomBytes(3).toString("hex")}`;
      const result: any = await db.insert(users).values({
        openId,
        email,
        name: input.name?.trim() || email.split("@")[0],
        passwordHash,
        loginMethod: "email",
        role,
        dealershipId,
        emailVerified: 1,
      });
      const userId = Number(result[0]?.insertId ?? 0);

      // Best-effort email — never fail the invite if mail is down
      try {
        const { sendEmail } = await import("./emailSender");
        await sendEmail({
          to: email,
          subject: "You're invited to GrayArx",
          html: `<p>Hi ${input.name || "there"},</p>
<p>You've been added to a GrayArx dealership workspace as <strong>${role}</strong>.</p>
<p>Sign in at <a href="https://www.grayarx.com/login">grayarx.com/login</a> with:</p>
<ul><li>Email: ${email}</li><li>Temporary password: <code>${temporaryPassword}</code></li></ul>
<p>Please change your password after first login.</p>`,
        });
      } catch (e) {
        console.warn("[teamMembers] invite email skipped:", e instanceof Error ? e.message : e);
      }

      return {
        success: true,
        email,
        role,
        userId,
        invitationSent: true,
        temporaryPassword,
        message: "User created — share the temporary password securely",
      };
    }),

  listTeamMembers: protectedProcedure
    .input(z.object({ dealershipId: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      assertCanManageTeam(ctx.user);
      const db = await getDb();
      if (!db) return [];

      const dealershipId =
        ctx.user.role === "founder" || ctx.user.role === "admin"
          ? input?.dealershipId ?? ctx.user.dealershipId
          : ctx.user.dealershipId;

      if (!dealershipId) return [];

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(
          and(
            eq(users.dealershipId, dealershipId),
          ),
        );

      return rows.map((r) => ({
        id: String(r.id),
        email: r.email ?? "",
        name: r.name ?? null,
        role: r.role,
        status: "accepted" as const,
        invitedAt: r.createdAt,
        acceptedAt: r.lastSignedIn,
      }));
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["admin", "manager", "salesperson", "dealer_owner", "dealer_consultant"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertCanManageTeam(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = Number(input.memberId);
      if (!userId) throw new TRPCError({ code: "BAD_REQUEST" });

      const [member] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      if (
        ctx.user.role !== "founder" &&
        ctx.user.role !== "admin" &&
        member.dealershipId !== ctx.user.dealershipId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const role = mapUiRole(input.role);
      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
      return { success: true, memberId: input.memberId, role };
    }),

  removeTeamMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertCanManageTeam(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = Number(input.memberId);
      if (!userId) throw new TRPCError({ code: "BAD_REQUEST" });
      if (userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove yourself" });
      }

      const [member] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      if (
        ctx.user.role !== "founder" &&
        ctx.user.role !== "admin" &&
        member.dealershipId !== ctx.user.dealershipId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Soft-remove: detach from dealership rather than delete account
      await db
        .update(users)
        .set({ dealershipId: null, role: "user", updatedAt: new Date() })
        .where(eq(users.id, userId));
      return { success: true, memberId: input.memberId, removed: true };
    }),

  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async () => {
      return {
        success: false,
        error: "Use the temporary password from your invite — login at /login",
      };
    }),

  resendInvitation: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertCanManageTeam(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = Number(input.memberId);
      const [member] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!member?.email) throw new TRPCError({ code: "NOT_FOUND" });

      const temporaryPassword = randomBytes(5).toString("base64url").slice(0, 10);
      const passwordHash = await hashPassword(temporaryPassword);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));

      return {
        success: true,
        memberId: input.memberId,
        temporaryPassword,
        message: "Password reset — share the new temporary password securely",
      };
    }),
});
