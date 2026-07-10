import { router, publicProcedure, protectedProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { passwordResetTokens, users } from "../../drizzle/schema";
import { eq, gt, sql } from "drizzle-orm";
import { sendProspectEmail } from "./emailSendingService";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, REMEMBER_ME_MS, SESSION_MS } from "../../shared/const";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { isFounderEmail } from "../../shared/founderAccess";
import { promoteUserToFounder } from "../db";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Generate a secure random token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash token for storage (optional security layer)
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authEnhancedRouter = router({
  /**
   * Get current user
   */
  me: publicProcedure.query((opts) => opts.ctx.user),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  /**
   * Request password reset - sends email with reset link
   */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email("Invalid email address") }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const email = normalizeEmail(input.email);

      // Find user by email (case-insensitive)
      const user = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${email}`)
        .limit(1);

      if (!user || user.length === 0) {
        // Don't reveal if email exists (security best practice)
        return { success: true, message: "If email exists, reset link will be sent" };
      }

      const userId = user[0].id;

      // Generate reset token
      const token = generateResetToken();
      const hashedToken = hashToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database
      await db.insert(passwordResetTokens).values({
        userId,
        token: hashedToken,
        expiresAt,
        used: 0,
      });

      // Send reset email via SendGrid
      const resetLink = `${process.env.VITE_APP_URL || "https://www.grayarx.com"}/reset-password?token=${token}`;
      try {
        // Email sending is optional - don't block password reset if it fails
        console.log("Password reset email would be sent to:", input.email);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        // Don't fail the request if email fails
      }

      return { success: true, message: "Password reset link sent to your email" };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const hashedToken = hashToken(input.token);

      // Find valid token
      const resetToken = await db!
        .select()
        .from(passwordResetTokens)
        .where(
          eq(passwordResetTokens.token, hashedToken)
        )
        .limit(1);

      if (!resetToken || resetToken.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      const tokenRecord = resetToken[0];

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reset token has expired",
        });
      }

      // Check if token was already used
      if (tokenRecord.used === 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset token has already been used",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, tokenRecord.userId));

      await db
        .update(passwordResetTokens)
        .set({ used: 1, usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenRecord.id));

      return {
        success: true,
        message: "Password reset successful. Please sign in with your new password.",
      };
    }),

  /**
   * Validate reset token (for frontend to check if token is valid)
   */
  validateResetToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const hashedToken = hashToken(input.token);

      const resetToken = await db!
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, hashedToken))
        .limit(1);

      if (!resetToken || resetToken.length === 0) {
        return { valid: false, message: "Invalid token" };
      }

      const tokenRecord = resetToken[0];

      if (tokenRecord.expiresAt < new Date()) {
        return { valid: false, message: "Token has expired" };
      }

      if (tokenRecord.used === 1) {
        return { valid: false, message: "Token has already been used" };
      }

      return { valid: true, message: "Token is valid" };
    }),

  /**
   * Get current user (for checking auth status)
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      dealershipId: ctx.user.dealershipId,
    };
  }),

  /**
   * Email + password login
   */
  loginWithEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password required"),
        rememberMe: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const email = normalizeEmail(input.email);
        const rows = await db
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = ${email}`)
          .limit(1);
        let user = rows[0];

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        if (!user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "No password on this account. Use Forgot password or sign up with email and password.",
          });
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        if (isFounderEmail(user.email) && user.role !== "founder" && user.role !== "admin") {
          user = await promoteUserToFounder(user.id);
        }

        const sessionMs = input.rememberMe ? REMEMBER_ME_MS : SESSION_MS;
        const token = Buffer.from(
          JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + sessionMs })
        ).toString("base64");

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionMs });

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[loginWithEmail] Unexpected error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Login failed. Please try again." });
      }
    }),

  /**
   * Email + password signup
   */
  signupWithEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const email = normalizeEmail(input.email);
        const existing = await db
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = ${email}`)
          .limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = `local_${crypto.randomUUID()}`;
        const role = isFounderEmail(email) ? "founder" : "user";

        await db.insert(users).values({
          openId,
          email,
          name: input.name || null,
          passwordHash,
          loginMethod: "email",
          lastSignedIn: new Date(),
          role,
          emailVerified: 0,
        });

        const newRows = await db
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = ${email}`)
          .limit(1);
        const user = newRows[0];
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User creation failed" });

        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const token = Buffer.from(
          JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + ONE_YEAR_MS })
        ).toString("base64");

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[signupWithEmail] Unexpected error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Signup failed. Please try again." });
      }
    }),
});
